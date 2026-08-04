import { describe, test, expect } from 'bun:test';
import { REGEX_LITERAL_RE, parseRegexLiteral, toRuntimeValue, toStorageValue } from '../../src/content/config/serialize.js';

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
    // pattern 内含斜杠：贪婪到最后一个 '/flags'
    expect(parseRegexLiteral('/a\\/b/i')).toEqual({ pattern: 'a\\/b', flags: 'i' });
  });

  test('非正则返回 null', () => {
    expect(parseRegexLiteral('abc')).toBeNull();
    expect(parseRegexLiteral(null)).toBeNull();
    expect(parseRegexLiteral(42)).toBeNull();
  });
});

describe('toRuntimeValue', () => {
  test('keywordArray/commentArray 中的正则字面量重建为 RegExp', () => {
    const result = toRuntimeValue(['广告', '/^直播.*预告$/i'], 'keywordArray');
    expect(result[0]).toBe('广告');
    expect(result[1]).toBeInstanceOf(RegExp);
    expect(result[1].test('直播明日预告')).toBe(true);
    expect(result[1].flags).toBe('i');
  });

  test('commentArray 同样转换', () => {
    const result = toRuntimeValue(['/xx+/'], 'commentArray');
    expect(result[0]).toBeInstanceOf(RegExp);
  });

  test('非转换 key 一律保持字符串（usernameArray 存的是用户名/勋章名）', () => {
    const result = toRuntimeValue(['/看着像正则/'], 'usernameArray');
    expect(result[0]).toBe('/看着像正则/');
    expect(result[0]).not.toBeInstanceOf(RegExp);
  });

  test('非法正则 console.error 后静默跳过（4.6.2 修复对等）', () => {
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      const result = toRuntimeValue(['/(/', '正常词'], 'keywordArray');
      expect(result).toEqual(['正常词']);
      expect(errors.length).toBe(1);
      expect(errors[0][0]).toBe('存在错误的正则表达式: ');
    } finally {
      console.error = original;
    }
  });

  test('返回新数组，不修改入参', () => {
    const input = ['/a/'];
    const result = toRuntimeValue(input, 'keywordArray');
    expect(result).not.toBe(input);
    expect(input[0]).toBe('/a/');
  });

  test('非数组输入返回空数组', () => {
    expect(toRuntimeValue(undefined, 'keywordArray')).toEqual([]);
    expect(toRuntimeValue(null, 'commentArray')).toEqual([]);
  });
});

describe('toStorageValue', () => {
  test('RegExp 实例序列化为 /source/flags 字符串', () => {
    expect(toStorageValue([new RegExp('abc', 'gi')])).toEqual(['/abc/gi']);
  });

  test('字符串原样通过', () => {
    expect(toStorageValue(['广告', '/x/i'])).toEqual(['广告', '/x/i']);
  });

  test('往返一致', () => {
    const runtime = toRuntimeValue(['/a,b/gi', '普通'], 'keywordArray');
    const storage = toStorageValue(runtime);
    expect(storage).toEqual(['/a,b/gi', '普通']);
  });

  test('非数组输入返回空数组', () => {
    expect(toStorageValue(undefined)).toEqual([]);
  });
});
