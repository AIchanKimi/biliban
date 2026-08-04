import { describe, test, expect } from 'bun:test';
import { CONFIG_KEY, INFO_RECORD_KEY, CONFIG_VERSION, DEFAULT_CONFIG, backupKeyFor } from '../../src/content/config/defaults.js';

describe('v3 默认配置', () => {
  test('存储键与版本', () => {
    expect(CONFIG_KEY).toBe('bilibili_config');
    expect(INFO_RECORD_KEY).toBe('infoRecord');
    expect(CONFIG_VERSION).toBe(3);
  });

  test('版本化备份键', () => {
    expect(backupKeyFor(1)).toBe('bilibili_config_v1_backup');
    expect(backupKeyFor(2)).toBe('bilibili_config_v2_backup');
  });

  test('形状：总开关 + 时长 + 统一屏蔽词 + 规则', () => {
    expect(DEFAULT_CONFIG).toEqual({
      version: 3,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      words: [],
      rules: [],
    });
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_CONFIG.duration)).toBe(true);
  });

  test('不再包含 v1/v2 废弃字段', () => {
    for (const legacyKey of [
      'functionEnable', 'whitelistEnable', 'commentEnable', 'commentKeywordEnable', 'commentFans',
      'convertEmojiEnable', 'showBlockUserBtnEnable', 'showBangBtnEnable', 'liveEnable', 'picEnable',
      'messageReplyEnable', 'messageReplyDelEnable', 'dynamicVideo', 'dynamicContent',
      'usernameArray', 'keywordArray', 'commentArray', 'whitelistArray', 'usernames', 'keywords',
    ]) {
      expect(DEFAULT_CONFIG[legacyKey]).toBeUndefined();
    }
  });
});
