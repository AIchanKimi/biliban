import { describe, test, expect } from 'bun:test';
import { REGEX_LITERAL_RE, parseRegexLiteral, toRuntimeWordEntries, toStorageWordEntries } from '../../src/content/config/serialize.js';

describe('REGEX_LITERAL_RE', () => {
  test('识别标准正则字面量', () => {
    expect(REGEX_LITERAL_RE.test('/abc/')).toBe(true);
    expect(REGEX_LITERAL_RE.test('/abc/gi')).toBe(true);
    expect(REGEX_LITERAL_RE.test('/a,b/')).toBe(true);
  });

  test('拒绝非正则字面量', () => {
    expect(REGEX_LITERAL_RE.test('abc')).toBe(false);
    expect(REGEX_LITERAL_RE.test('/abc')).toBe(false);
    expect(REGEX_LITERAL_RE.test('abc/')).toBe(false);
    expect(REGEX_LITERAL_RE.test('//')).toBe(false);
  });
});

describe('parseRegexLiteral', () => {
  test('拆分 pattern 与 flags', () => {
    expect(parseRegexLiteral('/abc/gi')).toEqual({ pattern: 'abc', flags: 'gi' });
    expect(parseRegexLiteral('/a,b/')).toEqual({ pattern: 'a,b', flags: '' });
    expect(parseRegexLiteral('/a\\/b/i')).toEqual({ pattern: 'a\\/b', flags: 'i' });
  });

  test('非正则返回 null', () => {
    expect(parseRegexLiteral('abc')).toBeNull();
    expect(parseRegexLiteral(null)).toBeNull();
    expect(parseRegexLiteral(42)).toBeNull();
  });
});

describe('toRuntimeWordEntries', () => {
  test('正则字面量 value 重建为 RegExp，scopes 保留', () => {
    const result = toRuntimeWordEntries([
      { value: '广告', scopes: ['global'] },
      { value: '/^直播.*预告$/i', scopes: ['search'] },
    ]);
    expect(result[0].value).toBe('广告');
    expect(result[1].value).toBeInstanceOf(RegExp);
    expect(result[1].value.test('直播明日预告')).toBe(true);
    expect(result[1].scopes).toEqual(['search']);
  });

  test('非法正则 console.error 后跳过该词条', () => {
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      const result = toRuntimeWordEntries([
        { value: '/(/', scopes: ['global'] },
        { value: '正常词', scopes: ['global'] },
      ]);
      expect(result.map(e => e.value)).toEqual(['正常词']);
      expect(errors.length).toBe(1);
      expect(errors[0][0]).toBe('存在错误的正则表达式: ');
    } finally {
      console.error = original;
    }
  });

  test('返回新数组新对象，不修改入参', () => {
    const input = [{ value: '/a/', scopes: ['global'] }];
    const result = toRuntimeWordEntries(input);
    expect(result).not.toBe(input);
    expect(input[0].value).toBe('/a/');
  });

  test('非数组输入返回空数组', () => {
    expect(toRuntimeWordEntries(undefined)).toEqual([]);
    expect(toRuntimeWordEntries(null)).toEqual([]);
  });
});

describe('toStorageWordEntries', () => {
  test('RegExp 实例序列化为 /source/flags 字符串', () => {
    const result = toStorageWordEntries([{ value: new RegExp('abc', 'gi'), scopes: ['global'] }]);
    expect(result).toEqual([{ value: '/abc/gi', scopes: ['global'] }]);
  });

  test('字符串原样通过', () => {
    expect(toStorageWordEntries([{ value: '广告', scopes: ['home'] }])).toEqual([
      { value: '广告', scopes: ['home'] },
    ]);
  });

  test('往返一致', () => {
    const storage = [{ value: '/a,b/gi', scopes: ['search'] }, { value: '普通', scopes: ['global'] }];
    expect(toStorageWordEntries(toRuntimeWordEntries(storage))).toEqual(storage);
  });

  test('非数组输入返回空数组', () => {
    expect(toStorageWordEntries(undefined)).toEqual([]);
  });
});
