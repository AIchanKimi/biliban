import { describe, test, expect } from 'bun:test';
import { getBvNumber, extractDataBvid } from '../../src/content/dom/bv.js';

describe('getBvNumber', () => {
  // 原正则 /\/video\/(?:av|bv)(\w+)/i：前缀 av/bv 被非捕获组消耗，捕获组为剩余部分。
  test('BV 号链接（捕获不含 BV 前缀，对等原实现）', () => {
    expect(getBvNumber('https://www.bilibili.com/video/BV1xx411c7mD')).toBe('1xx411c7mD');
    expect(getBvNumber('https://www.bilibili.com/video/BV1xx411c7mD/?spm=1')).toBe('1xx411c7mD');
  });

  test('av 号链接（捕获纯数字 → resolver 走 ?aid=）', () => {
    expect(getBvNumber('https://www.bilibili.com/video/av170001')).toBe('170001');
  });

  test('大小写不敏感', () => {
    expect(getBvNumber('https://www.bilibili.com/VIDEO/bv1xx411c7md')).toBe('1xx411c7md');
  });

  test('无匹配 → null（非视频链接）', () => {
    expect(getBvNumber('https://www.bilibili.com/read/cv123')).toBeNull();
    expect(getBvNumber('https://space.bilibili.com/123')).toBeNull();
  });

  test('非字符串输入 → null（exec 抛错被捕获）', () => {
    expect(getBvNumber(undefined)).toBeNull();
    expect(getBvNumber(null)).toBeNull();
  });
});

describe('extractDataBvid', () => {
  test('data-bvid 属性值', () => {
    expect(extractDataBvid('bvBV1xx411c7mD')).toBe('BV1xx411c7mD');
    expect(extractDataBvid('av170001')).toBe('170001');
  });

  test('无匹配/空输入 → null', () => {
    expect(extractDataBvid('nothing')).toBeNull();
    expect(extractDataBvid(null)).toBeNull();
    expect(extractDataBvid(undefined)).toBeNull();
  });
});
