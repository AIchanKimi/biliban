import { describe, test, expect } from 'bun:test';
import { isWhitelist } from '../../src/content/matcher/whitelist.js';
import { DEFAULT_CONFIG } from '../../src/content/config/defaults.js';

const config = (overrides = {}) => ({
  ...DEFAULT_CONFIG,
  whitelistArray: ['好UP'],
  usernameArray: ['好UP'], // 同时在黑名单，用于验证白名单优先（优先级在 hideHandler 阶梯）
  keywordArray: [],
  commentArray: [],
  ...overrides,
});

describe('isWhitelist', () => {
  test('whitelistEnable 开启且命中 → true', () => {
    expect(isWhitelist(config({ whitelistEnable: true }), '好UP')).toBe(true);
  });

  test('whitelistEnable 默认关闭 → false', () => {
    expect(isWhitelist(config(), '好UP')).toBe(false);
  });

  test('functionEnable 关闭 → false', () => {
    expect(isWhitelist(config({ whitelistEnable: true, functionEnable: false }), '好UP')).toBe(false);
  });

  test('username 为空 → false', () => {
    expect(isWhitelist(config({ whitelistEnable: true }), '')).toBe(false);
    expect(isWhitelist(config({ whitelistEnable: true }), null)).toBe(false);
  });

  test('不在白名单 → false', () => {
    expect(isWhitelist(config({ whitelistEnable: true }), '路人')).toBe(false);
  });
});
