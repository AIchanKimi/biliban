// 配置默认值与存储常量（v5 存储 v2 形状）。
// v4 及更早字段（functionEnable/commentArray/whitelistArray 等）已由 config/migrate.js 迁移丢弃。

export const CONFIG_KEY = 'bilibili_config';
export const V1_BACKUP_KEY = 'bilibili_config_v1_backup';
export const INFO_RECORD_KEY = 'infoRecord';
export const CONFIG_VERSION = 2;

// 时长按蔽默认阈值（秒）：5 分钟
export const DEFAULT_MIN_SECONDS = 300;

export const DEFAULT_DURATION = Object.freeze({
  enable: false,
  minSeconds: DEFAULT_MIN_SECONDS,
});

export const DEFAULT_CONFIG = Object.freeze({
  version: CONFIG_VERSION,
  enable: true,
  duration: DEFAULT_DURATION,
  usernames: [],
  keywords: [],
  rules: [],
});
