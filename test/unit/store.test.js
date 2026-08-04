import { describe, test, expect } from 'bun:test';
import { normalize, toRuntimeConfig, toStorageObject } from '../../src/content/config/store.js';

describe('normalize', () => {
  test('null 输入 → 默认配置', () => {
    const result = normalize(null);
    expect(result.functionEnable).toBe(true);
    expect(result.keywordArray).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('已有值覆盖默认值', () => {
    const result = normalize({ functionEnable: false, keywordArray: ['广告'] });
    expect(result.functionEnable).toBe(false);
    expect(result.keywordArray).toEqual(['广告']);
    expect(result.usernameEnable).toBe(true); // 未覆盖的保持默认
  });

  test('旧 key 迁移生效', () => {
    const result = normalize({ regArray: ['旧词'] });
    expect(result.keywordArray).toEqual(['旧词']);
  });

  test('列表字段非数组时强制为 []', () => {
    const result = normalize({ keywordArray: 'not-array', usernameArray: null });
    expect(result.keywordArray).toEqual([]);
    expect(result.usernameArray).toEqual([]);
  });

  test('不修改入参', () => {
    const input = { regArray: ['旧词'] };
    normalize(input);
    expect(input.regArray).toEqual(['旧词']);
  });
});

describe('toRuntimeConfig', () => {
  test('keywordArray/commentArray 完成正则重建', () => {
    const result = toRuntimeConfig({ keywordArray: ['/x/i', '普通'], commentArray: ['/y/'] });
    expect(result.keywordArray[0]).toBeInstanceOf(RegExp);
    expect(result.keywordArray[1]).toBe('普通');
    expect(result.commentArray[0]).toBeInstanceOf(RegExp);
  });

  test('usernameArray/whitelistArray 不做正则转换', () => {
    const result = toRuntimeConfig({ usernameArray: ['/看似正则/'] });
    expect(result.usernameArray[0]).toBe('/看似正则/');
  });
});

describe('toStorageObject', () => {
  test('RegExp 序列化回字符串', () => {
    const storage = toStorageObject({
      usernameArray: ['用户'],
      keywordArray: [new RegExp('x', 'i'), '普通'],
      commentArray: [],
      whitelistArray: [],
    });
    expect(storage.keywordArray).toEqual(['/x/i', '普通']);
  });

  test('往返一致：toRuntimeConfig → toStorageObject → 原存储形状', () => {
    const raw = { keywordArray: ['/a,b/gi', '广告'], commentArray: [], usernameArray: [], whitelistArray: [] };
    const runtime = toRuntimeConfig(raw);
    const storage = toStorageObject(runtime);
    expect(storage.keywordArray).toEqual(raw.keywordArray);
  });
});
