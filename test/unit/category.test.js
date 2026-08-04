import { describe, test, expect } from 'bun:test';
import { categoryFor } from '../../src/content/engine/category.js';

describe('categoryFor（URL → 页面分类，v5.2 精简）', () => {
  test('search 子域', () => {
    expect(categoryFor('https://search.bilibili.com/all?keyword=x')).toBe('search');
  });

  test('www 视频/番剧播放页', () => {
    expect(categoryFor('https://www.bilibili.com/video/BV1xx411c7mD')).toBe('video');
    expect(categoryFor('https://www.bilibili.com/bangumi/play/ss123')).toBe('video');
  });

  test('其余 www 均归 home', () => {
    expect(categoryFor('https://www.bilibili.com/')).toBe('home');
    expect(categoryFor('https://www.bilibili.com/?spm_id_from=333.999')).toBe('home');
    expect(categoryFor('https://www.bilibili.com/list/watchlater')).toBe('home');
    expect(categoryFor('https://www.bilibili.com/v/popular/all')).toBe('home');
    expect(categoryFor('https://www.bilibili.com/read/ranking')).toBe('home');
  });

  test('空间子域（v5.3 回归）', () => {
    expect(categoryFor('https://space.bilibili.com/123/video')).toBe('space');
  });

  test('动态（t 域 / opus）归 other（仅全局词条生效）', () => {
    expect(categoryFor('https://t.bilibili.com/')).toBe('other');
    expect(categoryFor('https://t.bilibili.com/123456')).toBe('other');
    expect(categoryFor('https://www.bilibili.com/opus/987654')).toBe('other');
  });

  test('扩展不注入的域名返回 null', () => {
    expect(categoryFor('https://live.bilibili.com/12345')).toBeNull();
    expect(categoryFor('https://h.bilibili.com/')).toBeNull();
    expect(categoryFor('https://example.com/')).toBeNull();
    expect(categoryFor('')).toBeNull();
    expect(categoryFor(null)).toBeNull();
  });
});
