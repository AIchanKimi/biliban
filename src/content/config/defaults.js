// 配置默认值与存储常量（v5.2 存储 v4 形状：words 屏蔽词 + durations 时长词条 + rules 自定义规则）。
// v3 的全局 duration 开关已由 migrate.js 转为一条时长词条。

export const CONFIG_KEY = 'bilibili_config';
export const INFO_RECORD_KEY = 'infoRecord';
export const CONFIG_VERSION = 4;

// 破坏性迁移前按原版本号备份：bilibili_config_v1_backup … bilibili_config_v3_backup
export function backupKeyFor(version) {
  return `bilibili_config_v${version}_backup`;
}

export const DEFAULT_CONFIG = Object.freeze({
  version: CONFIG_VERSION,
  enable: true,
  words: [],
  durations: [],
  rules: [],
});
