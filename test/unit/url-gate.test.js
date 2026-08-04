import { describe, test, expect } from 'bun:test';
import { ruleMatchesUrl, pageBranchFor } from '../../src/content/engine/url-gate.js';

describe('ruleMatchesUrl', () => {
  test('无 url 规则仅 www.bilibili.com 生效', () => {
    const rule = { index: '.x' };
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/video/BV1')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://search.bilibili.com/all?keyword=x')).toBe(false);
    expect(ruleMatchesUrl(rule, 'https://t.bilibili.com/')).toBe(false);
  });

  test('字符串 url：indexOf 匹配', () => {
    const rule = { index: '.x', url: 'search.bilibili.com' };
    expect(ruleMatchesUrl(rule, 'https://search.bilibili.com/all?keyword=x')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/')).toBe(false);
  });

  test('数组 url：任一命中', () => {
    const rule = { index: '.x', url: ['www.bilibili.com/video/', 'www.bilibili.com/bangumi/'] };
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/video/BV1')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/bangumi/play/ep1')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/read/cv1')).toBe(false);
  });

  test("裸 'bilibili.com' 匹配全部子域（indexOf 语义）", () => {
    const rule = { index: '.video-card', url: ['search.bilibili.com', 't.bilibili.com', 'space.bilibili.com', 'bilibili.com'] };
    expect(ruleMatchesUrl(rule, 'https://manga.bilibili.com/')).toBe(true);
    expect(ruleMatchesUrl(rule, 'https://www.bilibili.com/')).toBe(true);
  });
});

describe('pageBranchFor', () => {
  test('www 优先', () => {
    expect(pageBranchFor('https://www.bilibili.com/')).toBe('www');
    expect(pageBranchFor('https://www.bilibili.com/video/BV1')).toBe('www');
  });

  test('动态页：t / manga / space', () => {
    expect(pageBranchFor('https://t.bilibili.com/')).toBe('dynamics');
    expect(pageBranchFor('https://manga.bilibili.com/detail/mc1')).toBe('dynamics');
    expect(pageBranchFor('https://space.bilibili.com/123/dynamic')).toBe('dynamics');
  });

  test('消息中心回复页（hash 路由）', () => {
    expect(pageBranchFor('https://message.bilibili.com/#/reply')).toBe('message');
    expect(pageBranchFor('https://message.bilibili.com/#/reply?type=1')).toBe('message');
  });

  test('直播间（数字房间号）', () => {
    expect(pageBranchFor('https://live.bilibili.com/12345')).toBe('live');
  });

  test('其他子站无分支', () => {
    expect(pageBranchFor('https://search.bilibili.com/all')).toBeNull();
    expect(pageBranchFor('https://h.bilibili.com/')).toBeNull();
    // live/all 不匹配 /\d+/ → 无分支（对等：all 页只有触发器，无弹幕屏蔽）
    expect(pageBranchFor('https://live.bilibili.com/all')).toBeNull();
  });
});
