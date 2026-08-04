// 配置默认值与存储常量（v5.1 存储 v3 形状：统一屏蔽词列表 words）。
// v2 的 usernames/keywords 双列表已合并为 words（判定对标题与 UP主名同时生效）。
// 更早字段（commentArray/whitelistArray 等）由 config/migrate.js 迁移丢弃。

export const CONFIG_KEY = 'bilibili_config';
export const INFO_RECORD_KEY = 'infoRecord';
export const CONFIG_VERSION = 3;

// 破坏性迁移前按原版本号备份：bilibili_config_v1_backup / bilibili_config_v2_backup
export function backupKeyFor(version) {
  return `bilibili_config_v${version}_backup`;
}

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
  words: [],
  rules: [],
});
