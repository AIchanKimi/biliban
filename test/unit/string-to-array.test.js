import { describe, test, expect } from 'bun:test';
import { stringToArray } from '../../src/content/util/string-to-array.js';

describe('stringToArray', () => {
  test('正则字面量整体作为单元素，绝不拆分（4.6.3 修复：正则内逗号）', () => {
    expect(stringToArray('/a,b/i')).toEqual(['/a,b/i']);
    expect(stringToArray('/直播,预告/')).toEqual(['/直播,预告/']);
  });

  test('v6.7 修复：多个正则逗号相连按逗号拆分（旧版整体误判为单个正则）', () => {
    expect(stringToArray('/^陈莴笋哦$/,/^YY的奇妙冒险$/')).toEqual(['/^陈莴笋哦$/', '/^YY的奇妙冒险$/']);
    expect(stringToArray('/a,b/,c')).toEqual(['/a,b/', 'c']);
  });

  test('正则内转义斜杠不提前闭合', () => {
    expect(stringToArray('/a\\/b,c')).toEqual(['/a\\/b', 'c']);
  });

  test('普通文本按逗号拆分', () => {
    expect(stringToArray('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  test('普通文本含斜杠（非段首）不进入正则模式', () => {
    expect(stringToArray('a/b,c')).toEqual(['a/b', 'c']);
  });

  test('不做 trim（对等原实现：" b" 原样保留）', () => {
    expect(stringToArray(' a ,b')).toEqual([' a ', 'b']);
  });

  test('去重保留首次出现', () => {
    expect(stringToArray('a,b,a,c,b')).toEqual(['a', 'b', 'c']);
  });

  test('单词输入为单元素', () => {
    expect(stringToArray('广告')).toEqual(['广告']);
  });

  test('空输入 → 单空串元素（输入侧由 campare 校验拦截）', () => {
    expect(stringToArray('')).toEqual(['']);
  });
});
