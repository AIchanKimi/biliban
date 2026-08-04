import { describe, test, expect, beforeEach } from "bun:test";
import {
  initTempStore,
  getTempEntries,
  addTempEntries,
  setTempEntries,
  pruneExpired,
  getEffectiveEntries,
  mergeTempEntries,
  subscribeTemp,
} from "../../src/content/config/temp-store.js";
import { TEMP_KEY } from "../../src/content/config/defaults.js";

// ---------- chrome.storage.local 内存 mock ----------
function mockChrome(initial = {}) {
  const store = { ...initial };
  const listeners = [];
  globalThis.chrome = {
    storage: {
      local: {
        get: async (keys) => {
          const keyList = Array.isArray(keys) ? keys : [keys]; // chrome API 两种形式都支持
          const out = {};
          for (const key of keyList) {
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

const HOUR = 3600_000;

describe("temp-store（过期制临时词条）", () => {
  beforeEach(() => {
    mockChrome({});
  });

  test("add 后未到期可读取，固定有效期 1 小时（v6.5）", async () => {
    await initTempStore();
    const before = Date.now();
    await addTempEntries([
      { kind: "word", value: "临时词", scopes: ["search"] },
    ]);
    const entries = getTempEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].value).toBe("临时词");
    expect(entries[0].expiresAt).toBeGreaterThanOrEqual(before + HOUR - 1000);
    expect(entries[0].expiresAt).toBeLessThanOrEqual(Date.now() + HOUR + 1000);
  });

  test("过期词条不返回，pruneExpired 清除并写回", async () => {
    await initTempStore();
    await setTempEntries([
      {
        kind: "word",
        value: "已过期",
        scopes: ["global"],
        expiresAt: Date.now() - 1000,
      },
      {
        kind: "word",
        value: "未过期",
        scopes: ["global"],
        expiresAt: Date.now() + HOUR,
      },
    ]);
    expect(getTempEntries().map((e) => e.value)).toEqual(["未过期"]);
    const store =
      globalThis.chrome && (await chrome.storage.local.get(TEMP_KEY));
    expect(store[TEMP_KEY].length).toBe(2); // 尚未 prune
    const removed = await pruneExpired();
    expect(removed).toBe(1);
    const after = await chrome.storage.local.get(TEMP_KEY);
    expect(after[TEMP_KEY].map((e) => e.value)).toEqual(["未过期"]);
  });

  test("initTempStore 载入即清除过期项", async () => {
    mockChrome({
      [TEMP_KEY]: [
        {
          kind: "word",
          value: "old",
          scopes: ["global"],
          expiresAt: Date.now() - HOUR,
        },
        {
          kind: "duration",
          op: "lt",
          seconds: 60,
          scopes: ["home"],
          expiresAt: Date.now() + HOUR,
        },
      ],
    });
    await initTempStore();
    expect(getTempEntries().length).toBe(1);
    expect(getTempEntries()[0].kind).toBe("duration");
  });

  test("setTempEntries：自带 expiresAt 保留，缺省按小时数补齐", async () => {
    await initTempStore();
    const fixed = Date.now() + 7 * HOUR;
    await setTempEntries(
      [
        { kind: "word", value: "a", scopes: ["global"], expiresAt: fixed },
        { kind: "word", value: "b", scopes: ["global"] },
      ],
      6,
    );
    const entries = getTempEntries();
    expect(entries.find((e) => e.value === "a").expiresAt).toBe(fixed);
    const b = entries.find((e) => e.value === "b");
    expect(b.expiresAt).toBeGreaterThan(Date.now() + 5.9 * HOUR);
    expect(b.expiresAt).toBeLessThan(Date.now() + 6.1 * HOUR);
  });

  test("非法项过滤 + 重复身份跳过", async () => {
    await initTempStore();
    await addTempEntries([
      { kind: "word", value: "", scopes: ["global"] },
      { kind: "bad", value: "x", scopes: ["global"] },
      { kind: "word", value: "ok", scopes: ["global"] },
      { kind: "word", value: "ok", scopes: ["global"] },
    ]);
    expect(getTempEntries().map((e) => e.value)).toEqual(["ok"]);
  });

  test("subscribeTemp：自身写入回显过滤，远端变更生效", async () => {
    const store = mockChrome({});
    await initTempStore();
    let calls = 0;
    subscribeTemp(() => calls++);
    await addTempEntries([
      { kind: "word", value: "自己写的", scopes: ["global"] },
    ]);
    expect(calls).toBe(0);
    // 模拟其他标签页写入
    await chrome.storage.local.set({
      [TEMP_KEY]: [
        {
          kind: "word",
          value: "远端词",
          scopes: ["home"],
          expiresAt: Date.now() + HOUR,
        },
      ],
    });
    expect(calls).toBe(1);
    expect(getTempEntries().map((e) => e.value)).toEqual(["远端词"]);
    expect(store[TEMP_KEY].length).toBe(1);
  });

  test("getEffectiveEntries：过期临时不参与合并", async () => {
    await initTempStore();
    await setTempEntries([
      {
        kind: "word",
        value: "新鲜",
        scopes: ["global"],
        expiresAt: Date.now() + HOUR,
      },
      {
        kind: "word",
        value: "过期",
        scopes: ["global"],
        expiresAt: Date.now() - 1000,
      },
    ]);
    const merged = getEffectiveEntries(
      [{ value: "持久", scopes: ["global"] }],
      "word",
    );
    expect(merged.map((e) => e.value)).toEqual(["持久", "新鲜"]);
    // 输出不带 kind/expiresAt 内部字段
    expect(merged[1].kind).toBeUndefined();
    expect(merged[1].expiresAt).toBeUndefined();
  });

  test("mergeTempEntries：words 与 durations 同时合并", async () => {
    await initTempStore();
    await addTempEntries([
      { kind: "word", value: "临", scopes: ["search"] },
      { kind: "duration", op: "gt", seconds: 7200, scopes: ["global"] },
    ]);
    const runtime = {
      enable: true,
      words: [{ value: "k", scopes: ["global"] }],
      durations: [{ op: "lt", seconds: 60, scopes: ["global"] }],
    };
    const merged = mergeTempEntries(runtime);
    expect(merged.words.map((e) => e.value)).toEqual(["k", "临"]);
    expect(merged.durations.map((e) => e.seconds)).toEqual([60, 7200]);
  });
});
