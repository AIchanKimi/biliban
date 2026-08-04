import { describe, test, expect } from 'bun:test';
import { CONFIG_KEY, INFO_RECORD_KEY, CONFIG_VERSION, DEFAULT_CONFIG, backupKeyFor } from '../../src/content/config/defaults.js';

describe('v4 默认配置', () => {
  test('存储键与版本', () => {
    expect(CONFIG_KEY).toBe('bilibili_config');
    expect(INFO_RECORD_KEY).toBe('infoRecord');
    expect(CONFIG_VERSION).toBe(4);
  });

  test('版本化备份键', () => {
    expect(backupKeyFor(1)).toBe('bilibili_config_v1_backup');
    expect(backupKeyFor(3)).toBe('bilibili_config_v3_backup');
  });

  test('形状：总开关 + 屏蔽词 + 时长词条 + 规则', () => {
    expect(DEFAULT_CONFIG).toEqual({
      version: 4,
      enable: true,
      words: [],
      durations: [],
      rules: [],
    });
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
  });

  test('不再包含旧版本字段', () => {
    for (const legacyKey of ['functionEnable', 'duration', 'usernames', 'keywords', 'keywordArray', 'usernameArray']) {
      expect(DEFAULT_CONFIG[legacyKey]).toBeUndefined();
    }
  });
});
