import { describe, test, expect } from 'bun:test';
import { decideText } from '../../src/content/matcher/decide-text.js';
import { DEFAULT_CONFIG } from '../../src/content/config/defaults.js';

// 补充分支覆盖：评论正则的 sourceText 路径、动态三段中正则/中括号细节、相薄门控
const config = (overrides = {}) => ({
  ...DEFAULT_CONFIG,
  usernameArray: [],
  keywordArray: [],
  commentArray: [],
  whitelistArray: [],
  ...overrides,
});

describe('评论正则分支细节', () => {
  test('正则未命中 textValue 但命中 sourceText → 屏蔽', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: [/原文词/] });
    expect(decideText(cfg, '无关转换文本', { isComment: true, sourceText: '这是原文词所在' })).toBe(true);
  });

  test('正则两者均未命中 → 不屏蔽', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: [/不存在的模式/] });
    expect(decideText(cfg, '转换文本', { isComment: true, sourceText: '原文' })).toBe(false);
  });
});

describe('相薄类型门控', () => {
  test('picEnable 开启时按关键字屏蔽', () => {
    const cfg = config({ picEnable: true, keywordArray: ['广告'] });
    expect(decideText(cfg, '相薄广告', { isPic: true })).toBe(true);
  });
});

describe('动态路径的正则与中括号分支', () => {
  const shape = (dynamic, repost = { content: null }) => ({ dynamic, repost });

  test('标题经正则命中 keywordArray', () => {
    const cfg = config({ dynamicVideo: true, keywordEnable: true, keywordArray: [/标题正则/] });
    // 真实调用形状：dynamic/repost 对象总是同时传入
    expect(
      decideText(cfg, null, { dynamicVideo: '含标题正则的动态', dynamic: { content: null }, repost: { content: null } })
    ).toBe(true);
  });

  test('标题正则非法时安全跳过（catch 分支）', () => {
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      const bad = Object.create(RegExp.prototype);
      const cfg = config({ dynamicVideo: true, keywordEnable: true, keywordArray: [bad] });
      expect(
        decideText(cfg, null, { dynamicVideo: '任意标题', dynamic: { content: null }, repost: { content: null } })
      ).toBe(false);
      expect(errors.length).toBe(1);
    } finally {
      console.error = original;
    }
  });

  test('正文正则命中 content', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: [/正文正则/] });
    expect(decideText(cfg, null, shape({ content: '含正文正则' }))).toBe(true);
  });

  test('正文正则未命中 content 但命中 sourceContent', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: [/原文正则/] });
    expect(decideText(cfg, null, shape({ content: '转换文本', sourceContent: '原文正则在此' }))).toBe(true);
  });

  test('正文中括号词经 sourceContent 命中', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['[doge]'] });
    expect(decideText(cfg, null, shape({ content: '哈哈[doge]', sourceContent: '哈哈' }))).toBe(true);
  });

  test('转发正文字符串命中（无 sourceContent）', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['转发词'] });
    expect(decideText(cfg, null, shape({ content: null }, { content: '这是转发词' }))).toBe(true);
  });

  test('转发正文字符串命中但 sourceContent 不含且非中括号词 → 不屏蔽', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['鸡腿'] });
    expect(
      decideText(cfg, null, shape({ content: null }, { content: '送[鸡腿]', sourceContent: '送' }))
    ).toBe(false);
  });

  test('转发正文中括号词经 sourceContent 命中', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['[doge]'] });
    expect(
      decideText(cfg, null, shape({ content: null }, { content: '哈[doge]', sourceContent: '哈' }))
    ).toBe(true);
  });

  test('转发正文正则命中 content 或 sourceContent', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: [/转发正则/] });
    expect(decideText(cfg, null, shape({ content: null }, { content: '含转发正则' }))).toBe(true);
    const cfg2 = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: [/源正则/] });
    expect(
      decideText(cfg2, null, shape({ content: null }, { content: '转换', sourceContent: '源正则在此' }))
    ).toBe(true);
  });
});
