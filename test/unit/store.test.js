import { describe, test, expect, beforeEach } from 'bun:test';
import {
  normalize,
  toRuntimeConfig,
  toStorageObject,
  loadConfig,
  saveConfig,
  subscribe,
} from '../../src/content/config/store.js';
import { CONFIG_KEY, backupKeyFor } from '../../src/content/config/defaults.js';

// ---------- chrome.storage.local 内存 mock ----------
function mockChrome(initial = {}) {
  const store = { ...initial };
  const listeners = [];
  globalThis.chrome = {
    storage: {
      local: {
        get: async keys => {
          const out = {};
          for (const key of keys) {
            if (key in store) {
              out[key] = store[key];
            }
          }
          return out;
        },
        set: async obj => {
          const changes = {};
          for (const [key, value] of Object.entries(obj)) {
            store[key] = value;
            changes[key] = { newValue: value };
          }
          for (const listener of listeners) {
            listener(changes, 'local');
          }
        },
      },
      onChanged: {
        addListener: listener => listeners.push(listener),
        removeListener: listener => {
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

describe('normalize（v4 形状规范化）', () => {
  test('null 输入 → 默认 v4 配置（冻结）', () => {
    const result = normalize(null);
    expect(result).toEqual({
      version: 4,
      enable: true,
      words: [],
      durations: [],
      rules: [],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('v1 形状自动迁移为统一 words', () => {
    const result = normalize({ functionEnable: false, keywordArray: ['广告'], usernameArray: ['某UP'] });
    expect(result.version).toBe(4);
    expect(result.enable).toBe(false);
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['global'] },
    ]);
  });

  test('v2 形状自动合并 usernames/keywords，duration 转词条', () => {
    const result = normalize({
      version: 2,
      enable: true,
      duration: { enable: true, minSeconds: 90 },
      usernames: [{ value: 'u', scopes: ['global'] }],
      keywords: [{ value: 'k', scopes: ['search'] }],
    });
    expect(result.version).toBe(4);
    expect(result.words).toEqual([
      { value: 'u', scopes: ['global'] },
      { value: 'k', scopes: ['search'] },
    ]);
    expect(result.durations).toEqual([{ op: 'lt', seconds: 90, scopes: ['global'] }]);
  });

  test('v3 形状：全局 duration 转「短于」词条', () => {
    const result = normalize({
      version: 3,
      enable: true,
      duration: { enable: true, minSeconds: 60 },
      words: [{ value: '广告', scopes: ['global'] }],
    });
    expect(result.durations).toEqual([{ op: 'lt', seconds: 60, scopes: ['global'] }]);
  });

  test('词条形状强制：value 非字符串/空串剔除，scopes 归一化（废弃分类回落 global）', () => {
    const result = normalize({
      version: 4,
      words: [
        { value: 'ok', scopes: ['search'] },
        { value: '', scopes: ['search'] },
        { value: 42, scopes: [] },
        { value: 'legacy', scopes: ['dynamics'] },
        '裸字符串',
      ],
    });
    expect(result.words).toEqual([
      { value: 'ok', scopes: ['search'] },
      { value: 'legacy', scopes: ['global'] },
    ]);
  });

  test('列表字段非数组时强制为 []', () => {
    const result = normalize({ version: 4, words: 'not-array', rules: null, durations: null });
    expect(result.words).toEqual([]);
    expect(result.rules).toEqual([]);
    expect(result.durations).toEqual([]);
  });

  test('时长词条强制：非法项剔除', () => {
    const result = normalize({
      version: 4,
      durations: [
        { op: 'lt', seconds: 60, scopes: ['global'] },
        { op: 'bad', seconds: 60, scopes: ['global'] },
        { op: 'gt', seconds: -1, scopes: ['global'] },
        { op: 'gt', seconds: '120', scopes: ['bad'] },
        'not-object',
      ],
    });
    expect(result.durations).toEqual([
      { op: 'lt', seconds: 60, scopes: ['global'] },
      { op: 'gt', seconds: 120, scopes: ['global'] },
    ]);
  });

  test('规则规范化：selector 必填，mode 收敛，缺省补全，durationSelector 可选', () => {
    const result = normalize({
      version: 4,
      rules: [
        { id: 'r1', selector: '.x', scopes: ['search'], mode: 'hide' },
        { id: 'r2', selector: '', scopes: ['home'], mode: 'match', titleSelector: '.t' },
        { id: 'r3', selector: '.y', scopes: ['bad'], mode: 'weird', titleSelector: '.t', durationSelector: '.dur', enabled: false },
        { selector: '.z' },
        'not-object',
      ],
    });
    expect(result.rules).toEqual([
      { id: 'r1', selector: '.x', scopes: ['search'], mode: 'hide', titleSelector: '', userSelector: '', durationSelector: '', enabled: true },
      { id: 'r3', selector: '.y', scopes: ['global'], mode: 'match', titleSelector: '.t', userSelector: '', durationSelector: '.dur', enabled: false },
    ]);
  });

  test('builtinRules：数组时持久化通过，缺省时省略（引擎回落代码默认）', () => {
    const withBuiltins = normalize({
      version: 4,
      builtinRules: [{ id: 'builtin-x', selector: '.x', scopes: ['home'], mode: 'match', titleSelector: '.t' }],
    });
    expect(withBuiltins.builtinRules).toEqual([
      { id: 'builtin-x', selector: '.x', scopes: ['home'], mode: 'match', titleSelector: '.t', userSelector: '', durationSelector: '', enabled: true },
    ]);
    const withoutBuiltins = normalize({ version: 4 });
    expect('builtinRules' in withoutBuiltins).toBe(false);
    // 空数组合法（用户删除了全部内置规则）
    expect(normalize({ version: 4, builtinRules: [] }).builtinRules).toEqual([]);
  });

  test('不修改入参（不可变）', () => {
    const input = { version: 4, words: [{ value: 'a', scopes: ['home'] }] };
    normalize(input);
    expect(input.words[0].scopes).toEqual(['home']);
  });
});

describe('toRuntimeConfig / toStorageObject', () => {
  test('words 完成正则重建，durations 原样', () => {
    const result = toRuntimeConfig({
      version: 4,
      words: [{ value: '/x/i', scopes: ['global'] }, { value: '普通', scopes: ['home'] }],
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
    });
    expect(result.words[0].value).toBeInstanceOf(RegExp);
    expect(result.words[1].value).toBe('普通');
    expect(result.durations).toEqual([{ op: 'lt', seconds: 60, scopes: ['global'] }]);
  });

  test('往返一致：toRuntimeConfig → toStorageObject → 原存储形状', () => {
    const raw = {
      version: 4,
      enable: true,
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
      words: [{ value: '/a,b/gi', scopes: ['search'] }, { value: '广告', scopes: ['global'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide', titleSelector: '', userSelector: '', durationSelector: '', enabled: true }],
    };
    expect(toStorageObject(toRuntimeConfig(raw))).toEqual(raw);
  });
});

describe('loadConfig（迁移写回与版本化备份）', () => {
  test('v1 存储 → 写回 v4 + v1 备份键', async () => {
    const store = mockChrome({ [CONFIG_KEY]: { functionEnable: true, keywordArray: ['广告'], commentArray: ['丢'] } });
    const config = await loadConfig();
    expect(config.version).toBe(4);
    expect(config.words).toEqual([{ value: '广告', scopes: ['global'] }]);
    expect(store[CONFIG_KEY].version).toBe(4);
    expect(store[backupKeyFor(1)]).toEqual({ functionEnable: true, keywordArray: ['广告'], commentArray: ['丢'] });
  });

  test('v3 存储 → 升级 v4 + v3 备份键', async () => {
    const v3 = { version: 3, enable: true, duration: { enable: true, minSeconds: 60 }, words: [], rules: [] };
    const store = mockChrome({ [CONFIG_KEY]: v3 });
    const config = await loadConfig();
    expect(config.version).toBe(4);
    expect(config.durations).toEqual([{ op: 'lt', seconds: 60, scopes: ['global'] }]);
    expect(store[backupKeyFor(3)]).toEqual(v3);
  });

  test('v4 存储直通，不写备份', async () => {
    const v4 = { version: 4, enable: true, words: [], durations: [], rules: [] };
    const store = mockChrome({ [CONFIG_KEY]: v4 });
    await loadConfig();
    expect(store[backupKeyFor(1)]).toBeUndefined();
    expect(store[backupKeyFor(3)]).toBeUndefined();
  });

  test('空存储 → 默认配置，不落盘', async () => {
    const store = mockChrome({});
    const config = await loadConfig();
    expect(config.enable).toBe(true);
    expect(store[CONFIG_KEY]).toBeUndefined();
  });
});

describe('saveConfig + subscribe（回显过滤）', () => {
  beforeEach(() => mockChrome({}));

  test('自身写入的回显被过滤，远端变更被送达（规范化后）', async () => {
    const received = [];
    const unsubscribe = subscribe(config => received.push(config));

    await saveConfig({ version: 4, enable: true, words: [{ value: '自己写的', scopes: ['global'] }], durations: [], rules: [] });
    expect(received.length).toBe(0);

    // 模拟远端标签页写入（键序不同也不应误判——canonicalJson 键序无关）
    await chrome.storage.local.set({
      [CONFIG_KEY]: { version: 4, words: [{ scopes: ['search'], value: '远端词' }], rules: [], durations: [], enable: true },
    });
    expect(received.length).toBe(1);
    expect(received[0].words).toEqual([{ value: '远端词', scopes: ['search'] }]);

    unsubscribe();
    await chrome.storage.local.set({ [CONFIG_KEY]: { version: 4, enable: false, words: [], durations: [], rules: [] } });
    expect(received.length).toBe(1);
  });

  test('非 local 区域与非配置键忽略', async () => {
    const received = [];
    subscribe(config => received.push(config));
    await chrome.storage.local.set({ other_key: 1 });
    expect(received.length).toBe(0);
  });
});
