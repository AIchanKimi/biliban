import { describe, test, expect } from 'bun:test';
import { isCurrentVersion, migrateToLatest } from '../../src/content/config/migrate.js';

const V3_EMPTY = {
  version: 3,
  enable: true,
  duration: { enable: false, minSeconds: 300 },
  words: [],
  rules: [],
};

describe('isCurrentVersion', () => {
  test('version===3 才算当前版本', () => {
    expect(isCurrentVersion({ version: 3 })).toBe(true);
    expect(isCurrentVersion({ version: 2 })).toBe(false);
    expect(isCurrentVersion({ version: 1 })).toBe(false);
    expect(isCurrentVersion({})).toBe(false);
    expect(isCurrentVersion(null)).toBe(false);
  });
});

describe('migrateToLatest：v1 → v3', () => {
  test('usernameArray 与 keywordArray 合并为全局 words（用户名在前）', () => {
    const result = migrateToLatest({ usernameArray: ['某UP'], keywordArray: ['广告', '/x/i'] });
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['global'] },
      { value: '/x/i', scopes: ['global'] },
    ]);
    expect(result.version).toBe(3);
  });

  test('TM 旧形状：regArray 并入', () => {
    const result = migrateToLatest({ regArray: ['旧词'], keywordArray: ['新词'] });
    expect(result.words.map(e => e.value)).toEqual(['新词', '旧词']);
  });

  test('functionEnable 映射为 enable', () => {
    expect(migrateToLatest({ functionEnable: false }).enable).toBe(false);
    expect(migrateToLatest({}).enable).toBe(true);
    expect(migrateToLatest(null).enable).toBe(true);
  });

  test('丢弃评论/白名单/各页面开关（备份由 store 负责）', () => {
    const result = migrateToLatest({
      commentArray: ['评论词'],
      whitelistArray: ['白名单'],
      commentEnable: true,
      liveEnable: true,
      messageReplyEnable: true,
    });
    expect(result).toEqual(V3_EMPTY);
  });

  test('同值去重（值+作用域）', () => {
    const result = migrateToLatest({ usernameArray: ['dup'], keywordArray: ['dup'] });
    expect(result.words).toEqual([{ value: 'dup', scopes: ['global'] }]);
  });

  test('非字符串/空串词条被过滤', () => {
    const result = migrateToLatest({ keywordArray: ['有效', '', null, 42, '  '] });
    expect(result.words.map(e => e.value)).toEqual(['有效', '  ']);
  });

  test('null / undefined 输入 → 默认 v3', () => {
    expect(migrateToLatest(null)).toEqual(V3_EMPTY);
    expect(migrateToLatest(undefined)).toEqual(V3_EMPTY);
  });

  test('不修改入参（不可变）', () => {
    const input = { keywordArray: ['a'] };
    migrateToLatest(input);
    expect(input).toEqual({ keywordArray: ['a'] });
  });
});

describe('migrateToLatest：v2 → v3', () => {
  test('usernames 与 keywords 合并为 words，保留作用域', () => {
    const result = migrateToLatest({
      version: 2,
      enable: true,
      duration: { enable: true, minSeconds: 120 },
      usernames: [{ value: '某UP', scopes: ['global'] }],
      keywords: [{ value: '广告', scopes: ['search'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide' }],
    });
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['search'] },
    ]);
    expect(result.duration).toEqual({ enable: true, minSeconds: 120 });
    expect(result.rules.length).toBe(1);
  });

  test('跨列表同值同作用域去重', () => {
    const result = migrateToLatest({
      version: 2,
      usernames: [{ value: 'dup', scopes: ['global'] }],
      keywords: [{ value: 'dup', scopes: ['global'] }, { value: 'dup', scopes: ['home'] }],
    });
    expect(result.words).toEqual([
      { value: 'dup', scopes: ['global'] },
      { value: 'dup', scopes: ['home'] },
    ]);
  });

  test('非法词条对象被过滤', () => {
    const result = migrateToLatest({
      version: 2,
      usernames: [{ value: '', scopes: ['global'] }, null, { value: 42 }],
      keywords: [{ value: 'ok', scopes: ['home'] }],
    });
    expect(result.words).toEqual([{ value: 'ok', scopes: ['home'] }]);
  });

  test('缺失字段回落默认', () => {
    const result = migrateToLatest({ version: 2 });
    expect(result.enable).toBe(true);
    expect(result.words).toEqual([]);
    expect(result.rules).toEqual([]);
  });
});
