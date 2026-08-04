import { describe, test, expect } from 'bun:test';
import { decideText } from '../../src/content/matcher/decide-text.js';
import { DEFAULT_CONFIG } from '../../src/content/config/defaults.js';

// 构造运行时配置（keywordArray/commentArray 为 string|RegExp 混合数组）
const config = (overrides = {}) => ({
  ...DEFAULT_CONFIG,
  keywordArray: [],
  commentArray: [],
  whitelistArray: [],
  usernameArray: [],
  ...overrides,
});

describe('视频/通用标题路径', () => {
  test('关键字命中 includes → 屏蔽', () => {
    expect(decideText(config({ keywordArray: ['广告'] }), '这是一个广告视频')).toBe(true);
  });

  test('关键字未命中 → 不屏蔽', () => {
    expect(decideText(config({ keywordArray: ['广告'] }), '正常视频标题')).toBe(false);
  });

  test('正则（RegExp 实例）match 命中 → 屏蔽', () => {
    expect(decideText(config({ keywordArray: [/^直播.*预告$/i] }), '直播明日预告')).toBe(true);
    expect(decideText(config({ keywordArray: [/^直播.*预告$/i] }), '直播无关内容')).toBe(false);
  });

  test('quirk 钉死：string 未命中 includes 时落入 match（字符串被强转为正则）', () => {
    // 'a.c' 作为字符串：includes 不命中 'abc'，但 match('a.c') 把 '.' 当通配 → 命中
    expect(decideText(config({ keywordArray: ['a.c'] }), 'abc')).toBe(true);
  });

  test('keywordEnable 关闭 → 不判定', () => {
    expect(decideText(config({ keywordEnable: false, keywordArray: ['广告'] }), '广告视频')).toBe(false);
  });

  test('functionEnable 总开关关闭 → 不判定', () => {
    expect(decideText(config({ functionEnable: false, keywordArray: ['广告'] }), '广告视频')).toBe(false);
  });

  test('空关键字项（falsy）被跳过', () => {
    expect(decideText(config({ keywordArray: [''] }), '任意标题')).toBe(false);
  });

  test('非法 RegExp 安全返回 false 并 console.error', () => {
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      // 手工构造 source 非法的 RegExp（new RegExp 直接构造会抛，这里模拟运行时坏值）
      const bad = Object.create(RegExp.prototype);
      expect(decideText(config({ keywordArray: [bad] }), '任意标题')).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0][0]).toBe('存在错误的正则表达式: ');
    } finally {
      console.error = original;
    }
  });
});

describe('类型门控', () => {
  test('直播类型需 liveEnable', () => {
    const cfg = config({ keywordArray: ['广告'] });
    expect(decideText(cfg, '广告', { isLive: true })).toBe(false);
    expect(decideText(config({ ...cfg, liveEnable: true }), '广告', { isLive: true })).toBe(true);
  });

  test('相薄类型需 picEnable', () => {
    const cfg = config({ keywordArray: ['广告'] });
    expect(decideText(cfg, '广告', { isPic: true })).toBe(false);
    expect(decideText(config({ ...cfg, picEnable: true }), '广告', { isPic: true })).toBe(true);
  });

  test('消息中心回复需 commentEnable + messageReplyEnable', () => {
    const text = '广告';
    const base = config({ commentKeywordEnable: true, commentArray: ['广告'] });
    expect(decideText(base, text, { isComment: true, isMessageReply: true })).toBe(false);
    expect(
      decideText(config({ ...base, commentEnable: true }), text, { isComment: true, isMessageReply: true })
    ).toBe(false);
    expect(
      decideText(config({ ...base, commentEnable: true, messageReplyEnable: true }), text, {
        isComment: true,
        isMessageReply: true,
      })
    ).toBe(true);
  });
});

describe('评论路径（commentArray + sourceText 表情细节）', () => {
  test('评论关键字命中且无 sourceText → 屏蔽', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: ['垃圾'] });
    expect(decideText(cfg, '这是垃圾评论', { isComment: true })).toBe(true);
  });

  // 注意真实调用形状：sourceText = 原始 textContent（表情 <img> 不贡献文字），
  // textValue = 表情转换后文本（含 [xx] 标识）。
  test('评论命中但 sourceText 不含该词且非中括号词 → 不屏蔽（表情转换误报防护）', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: ['鸡腿'] });
    // 转换后文本含 '鸡腿'（来自 [鸡腿] 表情），原文 sourceText 里没有
    expect(decideText(cfg, '送你[鸡腿]', { isComment: true, sourceText: '送你' })).toBe(false);
  });

  test('中括号词 [鸡腿] 命中转换文本 → 屏蔽（表情匹配必须带完整中括号对）', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: ['[鸡腿]'] });
    expect(decideText(cfg, '送你[鸡腿]', { isComment: true, sourceText: '送你' })).toBe(true);
  });

  test('裸词不得命中纯表情内容，而完整中括号词可以（对照）', () => {
    const bare = config({ commentKeywordEnable: true, commentArray: ['鸡腿'] });
    const bracket = config({ commentKeywordEnable: true, commentArray: ['[鸡腿]'] });
    const textValue = '送你[鸡腿]';
    const options = { isComment: true, sourceText: '送你' };
    expect(decideText(bare, textValue, options)).toBe(false);
    expect(decideText(bracket, textValue, options)).toBe(true);
  });

  test('中括号词在 textValue 未命中但 sourceText 含 → 屏蔽', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: ['[tv_白眼]'] });
    expect(decideText(cfg, '无关文字', { isComment: true, sourceText: '哼[tv_白眼]' })).toBe(true);
  });

  test('评论正则命中 textValue 或 sourceText 均可', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: [/刷屏+/] });
    expect(decideText(cfg, '他在刷屏屏', { isComment: true, sourceText: '原文' })).toBe(true);
    expect(decideText(cfg, '正常评论', { isComment: true, sourceText: '其实他在刷屏' })).toBe(true);
  });

  test('评论正则 + sourceText 为 null → catch 路径安全返回 false（quirk 钉死）', () => {
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      const cfg = config({ commentKeywordEnable: true, commentArray: [/不存在的词/] });
      expect(decideText(cfg, '正常评论', { isComment: true })).toBe(false);
      expect(errors.length).toBe(1); // sourceText.match 抛 TypeError 被捕获
    } finally {
      console.error = original;
    }
  });

  test('commentKeywordEnable 关闭 → 不判定', () => {
    const cfg = config({ commentArray: ['垃圾'] });
    expect(decideText(cfg, '垃圾评论', { isComment: true })).toBe(false);
  });

  test('评论开关 commentEnable 不影响 decideText（由 hideHandler 上游控制）——isComment 且有 textValue 即进入评论路径', () => {
    const cfg = config({ commentKeywordEnable: true, commentArray: ['垃圾'], commentEnable: false });
    expect(decideText(cfg, '垃圾评论', { isComment: true })).toBe(true);
  });
});

describe('动态路径（无 textValue 时进入）', () => {
  test('动态视频标题命中 keywordArray（需 dynamicVideo 开关）', () => {
    const cfg = config({ dynamicVideo: true, keywordArray: ['广告'] });
    expect(decideText(cfg, null, { dynamicVideo: '广告视频标题' })).toBe(true);
    expect(decideText(config({ keywordArray: ['广告'] }), null, { dynamicVideo: '广告视频标题' })).toBe(false);
  });

  test('动态正文命中 commentArray（需 dynamicContent 开关）', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['垃圾'] });
    expect(decideText(cfg, null, { dynamic: { content: '垃圾内容' } })).toBe(true);
  });

  test('动态正文带 sourceContent 时沿用表情细节', () => {
    // 真实调用形状：dynamic 与 repost 总是同时传入（dynamics.js 保证）
    const shape = dynamic => ({ dynamic, repost: { content: null } });
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['鸡腿'] });
    // sourceContent 是原文 textContent（表情不贡献文字）→ 裸词误报被拦截
    expect(decideText(cfg, null, shape({ content: '送[鸡腿]', sourceContent: '送' }))).toBe(false);
    const cfg2 = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['[鸡腿]'] });
    expect(decideText(cfg2, null, shape({ content: '送[鸡腿]', sourceContent: '送' }))).toBe(true);
  });

  test('转发正文命中 commentArray（需 dynamicContent 开关）', () => {
    const cfg = config({ dynamicContent: true, commentKeywordEnable: true, commentArray: ['垃圾'] });
    // 真实调用形状：dynamic 与 repost 对象总是同时传入（内容可为 null）
    expect(decideText(cfg, null, { dynamic: { content: null }, repost: { content: '转发垃圾内容' } })).toBe(true);
  });

  test('标题优先级最高：标题命中后不再看正文', () => {
    const cfg = config({
      dynamicVideo: true,
      dynamicContent: true,
      keywordEnable: true,
      keywordArray: ['标题词'],
      commentKeywordEnable: true,
      commentArray: ['正文词'],
    });
    expect(decideText(cfg, null, { dynamicVideo: '含标题词', dynamic: { content: '无命中' } })).toBe(true);
  });

  test('有 textValue 时不进入动态路径', () => {
    const cfg = config({ dynamicVideo: true, keywordArray: ['广告'] });
    expect(decideText(cfg, '普通标题', { dynamicVideo: '广告视频' })).toBe(false);
  });
});
