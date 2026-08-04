import { describe, test, expect } from 'bun:test';
import { decideUsername } from '../../src/content/matcher/decide-username.js';
import { DEFAULT_CONFIG } from '../../src/content/config/defaults.js';

const config = (overrides = {}) => ({
  ...DEFAULT_CONFIG,
  usernameArray: ['讨厌的UP'],
  keywordArray: [],
  commentArray: [],
  whitelistArray: [],
  ...overrides,
});

describe('视频用户名路径', () => {
  test('黑名单用户名 + usernameEnable（默认开）→ 屏蔽', () => {
    expect(decideUsername(config(), '讨厌的UP')).toBe(true);
  });

  test('usernameEnable 关闭 → 不屏蔽', () => {
    expect(decideUsername(config({ usernameEnable: false }), '讨厌的UP')).toBe(false);
  });

  test('functionEnable 关闭 → 不屏蔽', () => {
    expect(decideUsername(config({ functionEnable: false }), '讨厌的UP')).toBe(false);
  });

  test('username 为空 → 不屏蔽', () => {
    expect(decideUsername(config(), '')).toBe(false);
    expect(decideUsername(config(), null)).toBe(false);
  });

  test('不在黑名单 → 不屏蔽', () => {
    expect(decideUsername(config(), '正常UP')).toBe(false);
  });
});

describe('类型门控矩阵', () => {
  test('评论按用户名：需 commentEnable', () => {
    expect(decideUsername(config(), '讨厌的UP', { isComment: true })).toBe(false);
    expect(decideUsername(config({ commentEnable: true }), '讨厌的UP', { isComment: true })).toBe(true);
  });

  test('消息中心回复：需 commentEnable + messageReplyEnable', () => {
    const opts = { isComment: true, isMessageReply: true };
    expect(decideUsername(config({ commentEnable: true }), '讨厌的UP', opts)).toBe(false);
    expect(
      decideUsername(config({ commentEnable: true, messageReplyEnable: true }), '讨厌的UP', opts)
    ).toBe(true);
  });

  test('直播：需 liveEnable + usernameEnable', () => {
    expect(decideUsername(config(), '讨厌的UP', { isLive: true })).toBe(false);
    expect(decideUsername(config({ liveEnable: true }), '讨厌的UP', { isLive: true })).toBe(true);
    expect(
      decideUsername(config({ liveEnable: true, usernameEnable: false }), '讨厌的UP', { isLive: true })
    ).toBe(false);
  });

  test('相薄：需 picEnable + usernameEnable', () => {
    expect(decideUsername(config(), '讨厌的UP', { isPic: true })).toBe(false);
    expect(decideUsername(config({ picEnable: true }), '讨厌的UP', { isPic: true })).toBe(true);
    expect(
      decideUsername(config({ picEnable: true, usernameEnable: false }), '讨厌的UP', { isPic: true })
    ).toBe(false);
  });
});

describe('粉丝勋章路径（trueLove）', () => {
  test('commentFans 开启且勋章名在黑名单 → 屏蔽（与用户名无关）', () => {
    const cfg = config({ commentFans: true, usernameArray: ['某勋章'] });
    expect(decideUsername(cfg, null, { trueLove: '某勋章' })).toBe(true);
  });

  test('commentFans 关闭 → 勋章不生效', () => {
    const cfg = config({ usernameArray: ['某勋章'] });
    expect(decideUsername(cfg, null, { trueLove: '某勋章' })).toBe(false);
  });

  test('functionEnable 关闭 → 勋章不生效', () => {
    const cfg = config({ commentFans: true, functionEnable: false, usernameArray: ['某勋章'] });
    expect(decideUsername(cfg, null, { trueLove: '某勋章' })).toBe(false);
  });
});

describe('转发原作者路径（repostUser）', () => {
  test('dynamicVideo 开启且转发者在黑名单 → 屏蔽', () => {
    const cfg = config({ dynamicVideo: true });
    expect(decideUsername(cfg, null, { repostUser: '讨厌的UP' })).toBe(true);
  });

  test('dynamicVideo 关闭 → 转发者不生效', () => {
    expect(decideUsername(config(), null, { repostUser: '讨厌的UP' })).toBe(false);
  });
});
