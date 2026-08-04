import { describe, test, expect } from 'bun:test';
import { recoverListValues, truncateForDisplay } from '../../src/content/util/list-order.js';

describe('recoverListValues', () => {
  test('DOM 逆序恢复为数组原序', () => {
    // 数组 ['a','b','c'] 依次 afterbegin 插入后 DOM 序为 c,b,a
    const domOrder = [
      { title: 'c', textContent: 'c' },
      { title: 'b', textContent: 'b' },
      { title: 'a', textContent: 'a' },
    ];
    expect(recoverListValues(domOrder)).toEqual(['a', 'b', 'c']);
  });

  test('title 优先于 textContent（截断 chip 的真值机制）', () => {
    const domOrder = [{ title: '很长很长的关键字词', textContent: '很长很 ... 字词' }];
    expect(recoverListValues(domOrder)).toEqual(['很长很长的关键字词']);
  });

  test('title 为空时回退 textContent', () => {
    const domOrder = [{ title: '', textContent: '短词' }];
    expect(recoverListValues(domOrder)).toEqual(['短词']);
  });

  test('不修改入参顺序', () => {
    const domOrder = [
      { title: 'b', textContent: 'b' },
      { title: 'a', textContent: 'a' },
    ];
    recoverListValues(domOrder);
    expect(domOrder[0].title).toBe('b');
  });
});

describe('truncateForDisplay', () => {
  test('≤9 字符不截断', () => {
    expect(truncateForDisplay('123456789')).toBe('123456789');
    expect(truncateForDisplay('短')).toBe('短');
  });

  test('>9 字符截断为 abc ... xyz', () => {
    expect(truncateForDisplay('abcdefghij')).toBe('abc ... hij');
    expect(truncateForDisplay('很长很长的关键字词组')).toBe('很长很 ... 字词组');
  });
});
