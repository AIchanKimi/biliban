import { describe, test, expect, beforeEach } from "bun:test";
import {
  normalize,
  toRuntimeConfig,
  toStorageObject,
  loadConfig,
  saveConfig,
  subscribe,
} from "../../src/content/config/store.js";
import {
  CONFIG_KEY,
  backupKeyFor,
  BUILTIN_RULES_VERSION,
} from "../../src/content/config/defaults.js";
import { BUILTIN_RULES } from "../../src/content/rules/builtin-rules.js";

// ---------- chrome.storage.local 内存 mock ----------
function mockChrome(initial = {}) {
  const store = { ...initial };
  const listeners = [];
  globalThis.chrome = {
    storage: {
      local: {
        get: async (keys) => {
          const out = {};
          for (const key of keys) {
            if (key in store) {
              out[key] = store[key];
            }
          }
          return out;
        },
        set: async (obj) => {
          const changes = {};
          for (const [key, value] of Object.entries(obj)) {
            store[key] = value;
            changes[key] = { newValue: value };
          }
          for (const listener of listeners) {
            listener(changes, "local");
          }
        },
      },
      onChanged: {
        addListener: (listener) => listeners.push(listener),
        removeListener: (listener) => {
          const index = listeners.indexOf(listener);
          if (index >= 0) {
            listeners.splice(index, 1);
          }
        },
      },
    },
  };
  return store;
}

describe("normalize（v5 形状规范化）", () => {
  test("null 输入 → 默认配置（规则播种内置集，冻结）", () => {
    const result = normalize(null);
    expect(result.version).toBe(5);
    expect(result.enable).toBe(true);
    expect(result.words).toEqual([]);
    expect(result.durations).toEqual([]);
    expect(result.builtinVersion).toBe(BUILTIN_RULES_VERSION);
    expect(result.rules.length).toBe(BUILTIN_RULES.length);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test("v1 形状自动迁移为统一 words", () => {
    const result = normalize({
      functionEnable: false,
      keywordArray: ["广告"],
      usernameArray: ["某UP"],
    });
    expect(result.version).toBe(5);
    expect(result.enable).toBe(false);
    expect(result.words).toEqual([
      { value: "某UP", scopes: ["global"] },
      { value: "广告", scopes: ["global"] },
    ]);
  });

  test("v2 形状自动合并 usernames/keywords，duration 转词条", () => {
    const result = normalize({
      version: 2,
      enable: true,
      duration: { enable: true, minSeconds: 90 },
      usernames: [{ value: "u", scopes: ["global"] }],
      keywords: [{ value: "k", scopes: ["search"] }],
    });
    expect(result.version).toBe(5);
    expect(result.words).toEqual([
      { value: "u", scopes: ["global"] },
      { value: "k", scopes: ["search"] },
    ]);
    expect(result.durations).toEqual([
      { op: "lt", seconds: 90, scopes: ["global"] },
    ]);
  });

  test("v3 形状：全局 duration 转「短于」词条", () => {
    const result = normalize({
      version: 3,
      enable: true,
      duration: { enable: true, minSeconds: 60 },
      words: [{ value: "广告", scopes: ["global"] }],
    });
    expect(result.durations).toEqual([
      { op: "lt", seconds: 60, scopes: ["global"] },
    ]);
  });

  test("词条 value trim 归一（v6.2，trim 后为空则剔除）", () => {
    const result = normalize({
      version: 5,
      words: [
        { value: "  词  ", scopes: ["global"] },
        { value: "   ", scopes: ["global"] },
      ],
    });
    expect(result.words).toEqual([{ value: "词", scopes: ["global"] }]);
  });

  test("词条形状强制：value 非字符串/空串剔除，scopes 归一化（废弃分类回落 global）", () => {
    const result = normalize({
      version: 5,
      words: [
        { value: "ok", scopes: ["search"] },
        { value: "", scopes: ["search"] },
        { value: 42, scopes: [] },
        { value: "legacy", scopes: ["dynamics"] },
        "裸字符串",
      ],
    });
    expect(result.words).toEqual([
      { value: "ok", scopes: ["search"] },
      { value: "legacy", scopes: ["global"] },
    ]);
  });

  test("列表字段非数组时强制为 []", () => {
    const result = normalize({
      version: 5,
      words: "not-array",
      rules: null,
      durations: null,
    });
    expect(result.words).toEqual([]);
    expect(result.rules).toEqual([]);
    expect(result.durations).toEqual([]);
  });

  test("时长词条强制：非法项剔除", () => {
    const result = normalize({
      version: 5,
      durations: [
        { op: "lt", seconds: 60, scopes: ["global"] },
        { op: "bad", seconds: 60, scopes: ["global"] },
        { op: "gt", seconds: -1, scopes: ["global"] },
        { op: "gt", seconds: "120", scopes: ["bad"] },
        "not-object",
      ],
    });
    expect(result.durations).toEqual([
      { op: "lt", seconds: 60, scopes: ["global"] },
      { op: "gt", seconds: 120, scopes: ["global"] },
    ]);
  });

  test("规则规范化：selector 必填，mode 收敛，textSelectors 数组，durationSelector 可选", () => {
    const result = normalize({
      version: 5,
      rules: [
        { id: "r1", selector: ".x", scopes: ["search"], mode: "hide" },
        {
          id: "r2",
          selector: "",
          scopes: ["home"],
          mode: "match",
          textSelectors: [".t"],
        },
        {
          id: "r3",
          selector: ".y",
          scopes: ["bad"],
          mode: "weird",
          textSelectors: [".t", " ", ".u"],
          durationSelector: ".dur",
          enabled: false,
        },
        { selector: ".z" },
        "not-object",
      ],
    });
    expect(result.rules).toEqual([
      {
        id: "r1",
        selector: ".x",
        scopes: ["search"],
        mode: "hide",
        textSelectors: [],
        durationSelector: "",
        enabled: true,
      },
      {
        id: "r3",
        selector: ".y",
        scopes: ["global"],
        mode: "match",
        textSelectors: [".t", ".u"],
        durationSelector: ".dur",
        enabled: false,
      },
    ]);
  });

  test("旧形状规则：titleSelector/userSelector 并入 textSelectors", () => {
    const result = normalize({
      version: 5,
      rules: [
        {
          id: "old",
          selector: ".card",
          scopes: ["play"],
          mode: "match",
          titleSelector: ".t",
          userSelector: ".u",
        },
      ],
    });
    expect(result.rules[0].textSelectors).toEqual([".t", ".u"]);
  });

  test("v6.1：输出不再含 builtinRules 字段，builtinVersion 恒为当前集版本", () => {
    const result = normalize({
      version: 5,
      rules: [{ id: "r1", selector: ".x", scopes: ["play"], mode: "hide" }],
    });
    expect("builtinRules" in result).toBe(false);
    expect(result.builtinVersion).toBe(BUILTIN_RULES_VERSION);
    expect(result.rules.map((r) => r.id)).toContain("r1");
  });

  test("v4 迁移：持久化的 builtinRules 并入 rules，用户编辑保留", () => {
    const result = normalize({
      version: 4,
      builtinVersion: 3,
      builtinRules: [
        {
          id: "builtin-bili-video-card",
          selector: ".edited",
          scopes: ["play"],
          mode: "match",
          textSelectors: [".t"],
        },
      ],
      rules: [
        { id: "custom-1", selector: ".c", scopes: ["search"], mode: "hide" },
      ],
    });
    const edited = result.rules.find((r) => r.id === "builtin-bili-video-card");
    expect(edited.selector).toBe(".edited"); // 用户编辑过的内置规则保留
    expect(result.rules.find((r) => r.id === "custom-1")).toBeTruthy();
    expect(
      result.rules.find((r) => r.id === "builtin-space-cube"),
    ).toBeTruthy(); // 其余内置按 id 补入
  });

  test("不修改入参（不可变）", () => {
    const input = { version: 5, words: [{ value: "a", scopes: ["home"] }] };
    normalize(input);
    expect(input.words[0].scopes).toEqual(["home"]);
  });
});

describe("toRuntimeConfig / toStorageObject", () => {
  test("words 完成正则重建，durations 原样", () => {
    const result = toRuntimeConfig({
      version: 5,
      words: [
        { value: "/x/i", scopes: ["global"] },
        { value: "普通", scopes: ["play"] },
      ],
      durations: [{ op: "lt", seconds: 60, scopes: ["global"] }],
    });
    expect(result.words[0].value).toBeInstanceOf(RegExp);
    expect(result.words[1].value).toBe("普通");
    expect(result.durations).toEqual([
      { op: "lt", seconds: 60, scopes: ["global"] },
    ]);
  });

  test("往返一致：toRuntimeConfig → toStorageObject → 原存储形状", () => {
    const raw = {
      version: 5,
      enable: true,
      durations: [{ op: "lt", seconds: 60, scopes: ["global"] }],
      words: [
        { value: "/a,b/gi", scopes: ["search"] },
        { value: "广告", scopes: ["global"] },
      ],
      rules: [
        {
          id: "r1",
          selector: ".x",
          scopes: ["play"],
          mode: "hide",
          textSelectors: [".t"],
          durationSelector: "",
          enabled: true,
        },
      ],
      builtinVersion: BUILTIN_RULES_VERSION,
    };
    expect(toStorageObject(toRuntimeConfig(raw))).toEqual(raw);
  });
});

describe("loadConfig（迁移写回与版本化备份）", () => {
  test("v1 存储 → 写回 v5 + v1 备份键", async () => {
    const store = mockChrome({
      [CONFIG_KEY]: {
        functionEnable: true,
        keywordArray: ["广告"],
        commentArray: ["丢"],
      },
    });
    const config = await loadConfig();
    expect(config.version).toBe(5);
    expect(config.words).toEqual([{ value: "广告", scopes: ["global"] }]);
    expect(store[CONFIG_KEY].version).toBe(5);
    expect(store[backupKeyFor(1)]).toEqual({
      functionEnable: true,
      keywordArray: ["广告"],
      commentArray: ["丢"],
    });
  });

  test("v3 存储 → 升级 v5 + v3 备份键", async () => {
    const v3 = {
      version: 3,
      enable: true,
      duration: { enable: true, minSeconds: 60 },
      words: [],
      rules: [],
    };
    const store = mockChrome({ [CONFIG_KEY]: v3 });
    const config = await loadConfig();
    expect(config.version).toBe(5);
    expect(config.durations).toEqual([
      { op: "lt", seconds: 60, scopes: ["global"] },
    ]);
    expect(store[backupKeyFor(3)]).toEqual(v3);
  });

  test("v4 存储直通，不写备份", async () => {
    const v4 = {
      version: 5,
      enable: true,
      words: [],
      durations: [],
      rules: [],
    };
    const store = mockChrome({ [CONFIG_KEY]: v4 });
    await loadConfig();
    expect(store[backupKeyFor(1)]).toBeUndefined();
    expect(store[backupKeyFor(3)]).toBeUndefined();
  });

  test("空存储 → 默认配置，不落盘", async () => {
    const store = mockChrome({});
    const config = await loadConfig();
    expect(config.enable).toBe(true);
    expect(store[CONFIG_KEY]).toBeUndefined();
  });
});

describe("saveConfig + subscribe（回显过滤）", () => {
  beforeEach(() => mockChrome({}));

  test("自身写入的回显被过滤，远端变更被送达（规范化后）", async () => {
    const received = [];
    const unsubscribe = subscribe((config) => received.push(config));

    await saveConfig({
      version: 5,
      enable: true,
      words: [{ value: "自己写的", scopes: ["global"] }],
      durations: [],
      rules: [],
    });
    expect(received.length).toBe(0);

    // 模拟远端标签页写入（键序不同也不应误判——canonicalJson 键序无关）
    await chrome.storage.local.set({
      [CONFIG_KEY]: {
        version: 5,
        words: [{ scopes: ["search"], value: "远端词" }],
        rules: [],
        durations: [],
        enable: true,
      },
    });
    expect(received.length).toBe(1);
    expect(received[0].words).toEqual([
      { value: "远端词", scopes: ["search"] },
    ]);

    unsubscribe();
    await chrome.storage.local.set({
      [CONFIG_KEY]: {
        version: 5,
        enable: false,
        words: [],
        durations: [],
        rules: [],
      },
    });
    expect(received.length).toBe(1);
  });

  test("非 local 区域与非配置键忽略", async () => {
    const received = [];
    subscribe((config) => received.push(config));
    await chrome.storage.local.set({ other_key: 1 });
    expect(received.length).toBe(0);
  });
});
