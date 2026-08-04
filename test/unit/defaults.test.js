import { describe, test, expect } from 'bun:test';
import { DEFAULT_CONFIG, REG_CONVERSION_KEYS, LEGACY_MIGRATIONS, CONFIG_KEY, INFO_RECORD_KEY } from '../../src/content/config/defaults.js';

describe('config/defaults', () => {
  test('CONFIG_KEY 与 INFO_RECORD_KEY 对等原脚本存储 key', () => {
    expect(CONFIG_KEY).toBe('bilibili_config');
    expect(INFO_RECORD_KEY).toBe('infoRecord');
  });

  test('DEFAULT_CONFIG 包含全部 16 个开关与 4 个列表，默认值对等 target.js 414–435', () => {
    expect(DEFAULT_CONFIG.functionEnable).toBe(true);
    expect(DEFAULT_CONFIG.usernameEnable).toBe(true);
    expect(DEFAULT_CONFIG.keywordEnable).toBe(true);
    expect(DEFAULT_CONFIG.whitelistEnable).toBe(false);
    expect(DEFAULT_CONFIG.commentEnable).toBe(false);
    expect(DEFAULT_CONFIG.commentKeywordEnable).toBe(false);
    expect(DEFAULT_CONFIG.commentFans).toBe(false);
    expect(DEFAULT_CONFIG.convertEmojiEnable).toBe(false);
    expect(DEFAULT_CONFIG.showBlockUserBtnEnable).toBe(false);
    expect(DEFAULT_CONFIG.showBangBtnEnable).toBe(false);
    expect(DEFAULT_CONFIG.liveEnable).toBe(false);
    expect(DEFAULT_CONFIG.picEnable).toBe(false);
    expect(DEFAULT_CONFIG.messageReplyEnable).toBe(false);
    expect(DEFAULT_CONFIG.messageReplyDelEnable).toBe(false);
    expect(DEFAULT_CONFIG.dynamicVideo).toBe(false);
    expect(DEFAULT_CONFIG.dynamicContent).toBe(false);
    expect(DEFAULT_CONFIG.usernameArray).toEqual([]);
    expect(DEFAULT_CONFIG.keywordArray).toEqual([]);
    expect(DEFAULT_CONFIG.commentArray).toEqual([]);
    expect(DEFAULT_CONFIG.whitelistArray).toEqual([]);
  });

  test('DEFAULT_CONFIG 被冻结（不可变）', () => {
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
  });

  test('REG_CONVERSION_KEYS 仅含 keywordArray 与 commentArray', () => {
    expect([...REG_CONVERSION_KEYS]).toEqual(['keywordArray', 'commentArray']);
  });

  test('LEGACY_MIGRATIONS 对等旧 key 迁移映射', () => {
    expect(LEGACY_MIGRATIONS.map(m => ({ key: m.key, ori: m.ori }))).toEqual([
      { key: 'keywordArray', ori: 'regArray' },
      { key: 'commentArray', ori: 'commentRegArray' },
    ]);
  });
});
