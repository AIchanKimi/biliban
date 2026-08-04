import { describe, test, expect } from 'bun:test';
import { splitToChars, joinSelected } from '../../src/content/util/segments.js';

describe('splitToChars', () => {
  test('逐字符拆分并保留 index', () => {
    expect(splitToChars('abc')).toEqual([
      { char: 'a', index: 0 },
      { char: 'b', index: 1 },
      { char: 'c', index: 2 },
    ]);
  });

  test('去除全部空白与 &nbsp; 后重排 index', () => {
    expect(splitToChars('a b c')).toEqual([
      { char: 'a', index: 0 },
      { char: 'b', index: 1 },
      { char: 'c', index: 2 },
    ]);
    expect(splitToChars('a&nbsp;b')).toEqual([
      { char: 'a', index: 0 },
      { char: 'b', index: 1 },
    ]);
  });

  test('空值安全', () => {
    expect(splitToChars('')).toEqual([]);
    expect(splitToChars(null)).toEqual([]);
  });
});

describe('joinSelected', () => {
  test('连续 index 连接成单段', () => {
    const selected = [
      { char: 'a', index: 0 },
      { char: 'b', index: 1 },
      { char: 'c', index: 2 },
    ];
    expect(joinSelected(selected)).toBe('abc');
  });

  test('断点分段，段间逗号连接', () => {
    const selected = [
      { char: 'f', index: 5 },
      { char: 'a', index: 0 },
      { char: 'g', index: 6 },
      { char: 'b', index: 1 },
      { char: 'c', index: 2 },
    ];
    expect(joinSelected(selected)).toBe('abc,fg');
  });

  test('多个孤立字符各成一段', () => {
    const selected = [
      { char: 'x', index: 0 },
      { char: 'y', index: 3 },
      { char: 'z', index: 7 },
    ];
    expect(joinSelected(selected)).toBe('x,y,z');
  });

  test('空选择 → 空串', () => {
    expect(joinSelected([])).toBe('');
  });
});
