import { describe, test, expect } from 'bun:test';
import { isCurrentVersion, migrateToLatest } from '../../src/content/config/migrate.js';

const V4_EMPTY = {
  version: 4,
  enable: true,
  words: [],
  durations: [],
  rules: [],
};

describe('isCurrentVersion', () => {
  test('version===4 才算当前版本', () => {
    expect(isCurrentVersion({ version: 4 })).toBe(true);
    expect(isCurrentVersion({ version: 3 })).toBe(false);
    expect(isCurrentVersion({ version: 2 })).toBe(false);
    expect(isCurrentVersion({})).toBe(false);
    expect(isCurrentVersion(null)).toBe(false);
  });
});

describe('migrateToLatest：v1 → v4', () => {
  test('usernameArray 与 keywordArray 合并为全局 words（用户名在前）', () => {
    const result = migrateToLatest({ usernameArray: ['某UP'], keywordArray: ['广告', '/x/i'] });
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['global'] },
      { value: '/x/i', scopes: ['global'] },
    ]);
    expect(result.version).toBe(4);
    expect(result.durations).toEqual([]);
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
    });
    expect(result).toEqual(V4_EMPTY);
  });

  test('null / undefined 输入 → 默认 v4', () => {
    expect(migrateToLatest(null)).toEqual(V4_EMPTY);
  });

  test('不修改入参（不可变）', () => {
    const input = { keywordArray: ['a'] };
    migrateToLatest(input);
    expect(input).toEqual({ keywordArray: ['a'] });
  });
});

describe('migrateToLatest：v2 → v4', () => {
  test('usernames 与 keywords 合并，保留作用域', () => {
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
    expect(result.durations).toEqual([{ op: 'lt', seconds: 120, scopes: ['global'] }]);
    expect(result.rules.length).toBe(1);
  });
});

describe('migrateToLatest：v3 → v4', () => {
  test('全局 duration 开关转为「短于」词条', () => {
    const result = migrateToLatest({
      version: 3,
      enable: true,
      duration: { enable: true, minSeconds: 60 },
      words: [{ value: '广告', scopes: ['global'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide' }],
    });
    expect(result).toEqual({
      version: 4,
      enable: true,
      words: [{ value: '广告', scopes: ['global'] }],
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide' }],
    });
  });

  test('duration 关闭 → 无词条', () => {
    const result = migrateToLatest({ version: 3, duration: { enable: false, minSeconds: 60 }, words: [] });
    expect(result.durations).toEqual([]);
  });

  test('非法阈值 → 无词条', () => {
    const result = migrateToLatest({ version: 3, duration: { enable: true, minSeconds: -5 }, words: [] });
    expect(result.durations).toEqual([]);
  });

  test('words 去重与过滤', () => {
    const result = migrateToLatest({
      version: 3,
      words: [
        { value: 'a', scopes: ['global'] },
        { value: 'a', scopes: ['global'] },
        { value: '', scopes: ['global'] },
        { value: 'b', scopes: ['home'] },
      ],
    });
    expect(result.words).toEqual([
      { value: 'a', scopes: ['global'] },
      { value: 'b', scopes: ['home'] },
    ]);
  });
});
