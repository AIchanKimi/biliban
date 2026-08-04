// 配置默认值与存储常量（v5.2 存储 v4 形状：words 屏蔽词 + durations 时长词条 + rules 自定义规则）。
// v3 的全局 duration 开关已由 migrate.js 转为一条时长词条。

export const CONFIG_KEY = 'bilibili_config';
// 临时词条独立存储（带过期时间，v5.5 起不再随页面刷新消失）
export const TEMP_KEY = 'bilibili_temp_entries';
export const CONFIG_VERSION = 4;
// 临时词条默认有效期：24 小时
export const TEMP_DEFAULT_HOURS = 24;
// 代码内置规则集版本：升级内置集时 +1，用户已固化的旧版 builtinRules 自动失效回落新集
export const BUILTIN_RULES_VERSION = 2;

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
