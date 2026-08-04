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

describe('normalize（v3 形状规范化）', () => {
  test('null 输入 → 默认 v3 配置（冻结）', () => {
    const result = normalize(null);
    expect(result).toEqual({
      version: 3,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      words: [],
      rules: [],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('v1 形状自动迁移为统一 words', () => {
    const result = normalize({ functionEnable: false, keywordArray: ['广告'], usernameArray: ['某UP'] });
    expect(result.version).toBe(3);
    expect(result.enable).toBe(false);
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['global'] },
    ]);
  });

  test('v2 形状自动合并 usernames/keywords', () => {
    const result = normalize({
      version: 2,
      enable: true,
      usernames: [{ value: 'u', scopes: ['global'] }],
      keywords: [{ value: 'k', scopes: ['search'] }],
    });
    expect(result.version).toBe(3);
    expect(result.words).toEqual([
      { value: 'u', scopes: ['global'] },
      { value: 'k', scopes: ['search'] },
    ]);
  });

  test('词条形状强制：value 非字符串/空串剔除，scopes 归一化', () => {
    const result = normalize({
      version: 3,
      words: [
        { value: 'ok', scopes: ['search'] },
        { value: '', scopes: ['search'] },
        { value: 42, scopes: [] },
        { value: 'bad-scope', scopes: ['live'] },
        '裸字符串',
      ],
    });
    expect(result.words).toEqual([
      { value: 'ok', scopes: ['search'] },
      { value: 'bad-scope', scopes: ['global'] },
    ]);
  });

  test('列表字段非数组时强制为 []', () => {
    const result = normalize({ version: 3, words: 'not-array', rules: null });
    expect(result.words).toEqual([]);
    expect(result.rules).toEqual([]);
  });

  test('duration 强制：非法阈值回落默认', () => {
    expect(normalize({ version: 3, duration: { enable: 1, minSeconds: '60' } }).duration).toEqual({
      enable: true,
      minSeconds: 60,
    });
    expect(normalize({ version: 3, duration: { enable: true, minSeconds: -5 } }).duration.minSeconds).toBe(300);
    expect(normalize({ version: 3, duration: 'bad' }).duration).toEqual({ enable: false, minSeconds: 300 });
  });

  test('规则规范化：selector 必填，mode 收敛，缺省补全', () => {
    const result = normalize({
      version: 3,
      rules: [
        { id: 'r1', selector: '.x', scopes: ['search'], mode: 'hide' },
        { id: 'r2', selector: '', scopes: ['home'], mode: 'match', titleSelector: '.t' },
        { id: 'r3', selector: '.y', scopes: ['bad'], mode: 'weird', titleSelector: '.t', enabled: false },
        { selector: '.z' },
        'not-object',
      ],
    });
    expect(result.rules).toEqual([
      { id: 'r1', selector: '.x', scopes: ['search'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true },
      { id: 'r3', selector: '.y', scopes: ['global'], mode: 'match', titleSelector: '.t', userSelector: '', enabled: false },
    ]);
  });

  test('不修改入参（不可变）', () => {
    const input = { version: 3, words: [{ value: 'a', scopes: ['home'] }] };
    normalize(input);
    expect(input.words[0].scopes).toEqual(['home']);
  });
});

describe('toRuntimeConfig / toStorageObject', () => {
  test('words 完成正则重建', () => {
    const result = toRuntimeConfig({
      version: 3,
      words: [{ value: '/x/i', scopes: ['global'] }, { value: '普通', scopes: ['home'] }],
    });
    expect(result.words[0].value).toBeInstanceOf(RegExp);
    expect(result.words[1].value).toBe('普通');
  });

  test('往返一致：toRuntimeConfig → toStorageObject → 原存储形状', () => {
    const raw = {
      version: 3,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      words: [{ value: '/a,b/gi', scopes: ['search'] }, { value: '广告', scopes: ['global'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true }],
    };
    expect(toStorageObject(toRuntimeConfig(raw))).toEqual(raw);
  });
});

describe('loadConfig（迁移写回与版本化备份）', () => {
  test('v1 存储 → 写回 v3 + v1 备份键', async () => {
    const store = mockChrome({ [CONFIG_KEY]: { functionEnable: true, keywordArray: ['广告'], commentArray: ['丢'] } });
    const config = await loadConfig();
    expect(config.version).toBe(3);
    expect(config.words).toEqual([{ value: '广告', scopes: ['global'] }]);
    expect(store[CONFIG_KEY].version).toBe(3);
    expect(store[backupKeyFor(1)]).toEqual({ functionEnable: true, keywordArray: ['广告'], commentArray: ['丢'] });
  });

  test('v2 存储 → 合并升级 v3 + v2 备份键', async () => {
    const v2 = { version: 2, enable: true, usernames: [{ value: 'u', scopes: ['global'] }], keywords: [], rules: [] };
    const store = mockChrome({ [CONFIG_KEY]: v2 });
    const config = await loadConfig();
    expect(config.version).toBe(3);
    expect(config.words).toEqual([{ value: 'u', scopes: ['global'] }]);
    expect(store[backupKeyFor(2)]).toEqual(v2);
    expect(store[backupKeyFor(1)]).toBeUndefined();
  });

  test('v3 存储直通，不写备份', async () => {
    const v3 = { version: 3, enable: true, duration: { enable: false, minSeconds: 300 }, words: [], rules: [] };
    const store = mockChrome({ [CONFIG_KEY]: v3 });
    await loadConfig();
    expect(store[backupKeyFor(1)]).toBeUndefined();
    expect(store[backupKeyFor(2)]).toBeUndefined();
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

    await saveConfig({ version: 3, enable: true, duration: { enable: false, minSeconds: 300 }, words: [{ value: '自己写的', scopes: ['global'] }], rules: [] });
    expect(received.length).toBe(0);

    // 模拟远端标签页写入（键序不同也不应误判——canonicalJson 键序无关）
    await chrome.storage.local.set({
      [CONFIG_KEY]: { version: 3, words: [{ scopes: ['search'], value: '远端词' }], rules: [], duration: { minSeconds: 300, enable: false }, enable: true },
    });
    expect(received.length).toBe(1);
    expect(received[0].words).toEqual([{ value: '远端词', scopes: ['search'] }]);

    unsubscribe();
    await chrome.storage.local.set({ [CONFIG_KEY]: { version: 3, enable: false, duration: { enable: false, minSeconds: 300 }, words: [], rules: [] } });
    expect(received.length).toBe(1);
  });

  test('非 local 区域与非配置键忽略', async () => {
    const received = [];
    subscribe(config => received.push(config));
    await chrome.storage.local.set({ other_key: 1 });
    expect(received.length).toBe(0);
  });
});
