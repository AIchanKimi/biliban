// 配置默认值与存储常量（存储 v5 形状：words 屏蔽词 + durations 时长词条 + rules 内置+自定义规则）。
// 扩展旧版本（v2–v4）由 migrate.js 自动迁移（含 v3 全局 duration 开关 → 时长词条）。
// DEFAULT_CONFIG 是「从未保存过配置」时的种子；由 migrate.buildSeedConfig 并入内置规则。
// 修改这里即可调整新装默认数据；已存在的 chrome.storage 配置不会被覆盖。

export const CONFIG_KEY = 'bilibili_config'
// 临时词条独立存储（带过期时间，v5.5 起不再随页面刷新消失）
export const TEMP_KEY = 'bilibili_temp_entries'
export const CONFIG_VERSION = 5
export const TEMP_DEFAULT_HOURS = 1 // v6.5：临时词条固定 1 小时（移除可选有效期）
// 代码内置规则集版本：内置规则在首次载入时并入 rules 列表（与自定义规则同构）；
// 当前版用户配置不回灌；旧版本迁移按 id 合并。
export const BUILTIN_RULES_VERSION = 5

// 破坏性迁移前按原版本号备份：bilibili_config_v2_backup … bilibili_config_v4_backup
export function backupKeyFor(version) {
  return `bilibili_config_v${version}_backup`
}

export const DEFAULT_CONFIG = Object.freeze({
  version: CONFIG_VERSION,
  enable: true,
  words: [],
  durations: [],
  rules: [],
  builtinVersion: BUILTIN_RULES_VERSION,
})
