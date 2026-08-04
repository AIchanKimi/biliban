import { describe, test, expect } from 'bun:test';
import { getConvertText } from '../../src/content/matcher/convert-text.js';

describe('getConvertText', () => {
  test('表情 <img alt="[xx]"> 转成标识文字', () => {
    expect(getConvertText('送你<img alt="[鸡腿]" src="xx.png">')).toBe('送你[鸡腿]');
    expect(getConvertText('<img data-src="a" alt="[tv_白眼]" class="e">哼')).toBe('[tv_白眼]哼');
  });

  test('链接转内文', () => {
    expect(getConvertText('看<a href="https://b23.tv/x" target="_blank">这个视频</a>')).toBe('看这个视频');
    expect(getConvertText('<a >多属性</ a>')).toBe('多属性');
  });

  test('&nbsp; 转空格', () => {
    expect(getConvertText('a&nbsp;b')).toBe('a b');
  });

  test('组合转换', () => {
    const html = '哈哈<img alt="[doge]">&nbsp;<a href="#">链接文字</a>';
    expect(getConvertText(html)).toBe('哈哈[doge] 链接文字');
  });

  test('纯文本原样返回', () => {
    expect(getConvertText('普通评论')).toBe('普通评论');
  });
});
