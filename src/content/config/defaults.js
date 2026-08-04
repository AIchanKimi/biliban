// 配置默认值与存储常量（v5.2 存储 v4 形状：words 屏蔽词 + durations 时长词条 + rules 自定义规则）。
// v3 的全局 duration 开关已由 migrate.js 转为一条时长词条。

export const CONFIG_KEY = 'bilibili_config';
// 临时词条独立存储（带过期时间，v5.5 起不再随页面刷新消失）
export const TEMP_KEY = 'bilibili_temp_entries';
export const CONFIG_VERSION = 5;
// 临时词条默认有效期：24 小时
export const TEMP_DEFAULT_HOURS = 1; // v6.5：临时词条固定 1 小时（移除可选有效期）
// 代码内置规则集版本：内置规则在首次载入时并入 rules 列表（与自定义规则同构）；
// 版本升级时仅按 id 补入新增的内置规则，不覆盖用户已有规则
export const BUILTIN_RULES_VERSION = 4;

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
  builtinVersion: BUILTIN_RULES_VERSION,
});
