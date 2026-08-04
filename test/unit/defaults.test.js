import { describe, test, expect } from 'bun:test';
import { CONFIG_KEY, V1_BACKUP_KEY, INFO_RECORD_KEY, CONFIG_VERSION, DEFAULT_CONFIG } from '../../src/content/config/defaults.js';

describe('v2 默认配置', () => {
  test('存储键与版本', () => {
    expect(CONFIG_KEY).toBe('bilibili_config');
    expect(V1_BACKUP_KEY).toBe('bilibili_config_v1_backup');
    expect(INFO_RECORD_KEY).toBe('infoRecord');
    expect(CONFIG_VERSION).toBe(2);
  });

  test('形状：总开关 + 时长 + 三个列表', () => {
    expect(DEFAULT_CONFIG).toEqual({
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [],
      keywords: [],
      rules: [],
    });
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_CONFIG.duration)).toBe(true);
  });

  test('不再包含 v1 废弃字段', () => {
    for (const legacyKey of [
      'functionEnable', 'whitelistEnable', 'commentEnable', 'commentKeywordEnable', 'commentFans',
      'convertEmojiEnable', 'showBlockUserBtnEnable', 'showBangBtnEnable', 'liveEnable', 'picEnable',
      'messageReplyEnable', 'messageReplyDelEnable', 'dynamicVideo', 'dynamicContent',
      'usernameArray', 'keywordArray', 'commentArray', 'whitelistArray',
    ]) {
      expect(DEFAULT_CONFIG[legacyKey]).toBeUndefined();
    }
  });
});
