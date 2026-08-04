import { describe, test, expect } from 'bun:test';
import { isV2, migrateV1toV2 } from '../../src/content/config/migrate.js';

describe('isV2', () => {
  test('version===2 才算 v2', () => {
    expect(isV2({ version: 2 })).toBe(true);
    expect(isV2({ version: 1 })).toBe(false);
    expect(isV2({})).toBe(false);
    expect(isV2(null)).toBe(false);
  });
});

describe('migrateV1toV2', () => {
  test('v1 列表 → 全局作用域词条对象', () => {
    const result = migrateV1toV2({ usernameArray: ['某UP'], keywordArray: ['广告', '/x/i'] });
    expect(result.usernames).toEqual([{ value: '某UP', scopes: ['global'] }]);
    expect(result.keywords).toEqual([
      { value: '广告', scopes: ['global'] },
      { value: '/x/i', scopes: ['global'] },
    ]);
  });

  test('TM 旧形状：regArray 并入 keywords', () => {
    const result = migrateV1toV2({ regArray: ['旧词'], keywordArray: ['新词'] });
    expect(result.keywords.map(e => e.value)).toEqual(['新词', '旧词']);
  });

  test('functionEnable 映射为 enable', () => {
    expect(migrateV1toV2({ functionEnable: false }).enable).toBe(false);
    expect(migrateV1toV2({}).enable).toBe(true);
    expect(migrateV1toV2(null).enable).toBe(true);
  });

  test('丢弃评论/白名单/各页面开关（不可逆，备份由 store 负责）', () => {
    const result = migrateV1toV2({
      commentArray: ['评论词'],
      whitelistArray: ['白名单'],
      commentEnable: true,
      liveEnable: true,
      messageReplyEnable: true,
    });
    expect(result).toEqual({
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [],
      keywords: [],
      rules: [],
    });
  });

  test('非字符串/空串词条被过滤', () => {
    const result = migrateV1toV2({ keywordArray: ['有效', '', null, 42, '  '] });
    expect(result.keywords.map(e => e.value)).toEqual(['有效', '  ']);
  });

  test('null / undefined 输入 → 默认 v2', () => {
    expect(migrateV1toV2(null)).toEqual({
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [],
      keywords: [],
      rules: [],
    });
  });

  test('不修改入参（不可变）', () => {
    const input = { keywordArray: ['a'] };
    migrateV1toV2(input);
    expect(input).toEqual({ keywordArray: ['a'] });
  });
});
