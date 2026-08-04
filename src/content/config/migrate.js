// 存储迁移：v1（含油猴原脚本形状）→ v2。纯函数；备份与写回由 store.loadConfig 负责。
// v1 丢弃项（不可逆，loadConfig 迁移前写 bilibili_config_v1_backup）：
//   commentArray/whitelistArray、全部评论/直播/相薄/消息中心开关、表情转换、按钮开关等。
import { CONFIG_VERSION, DEFAULT_MIN_SECONDS } from './defaults.js';

/**
 * @param {unknown} rawConfig
 * @returns {boolean} 已是 v2 形状
 */
export function isV2(rawConfig) {
  return Boolean(rawConfig) && rawConfig.version === CONFIG_VERSION;
}

/**
 * @param {unknown} list
 * @returns {Array<{ value: string, scopes: string[] }>}
 */
function toGlobalEntries(list) {
  const source = Array.isArray(list) ? list : [];
  const entries = [];
  for (const item of source) {
    if (typeof item === 'string' && item !== '') {
      entries.push({ value: item, scopes: ['global'] });
    }
  }
  return entries;
}

/**
 * v1 → v2 迁移（不修改入参）。v1 keywordArray 与 TM 旧键 regArray 合并为全局关键字词条。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {{ version: number, enable: boolean, duration: { enable: boolean, minSeconds: number }, usernames: Array<{ value: string, scopes: string[] }>, keywords: Array<{ value: string, scopes: string[] }>, rules: [] }}
 */
export function migrateV1toV2(rawConfig) {
  const source = rawConfig ?? {};
  const keywordSource = [
    ...(Array.isArray(source.keywordArray) ? source.keywordArray : []),
    ...(Array.isArray(source.regArray) ? source.regArray : []),
  ];
  return {
    version: CONFIG_VERSION,
    enable: source.functionEnable ?? true,
    duration: { enable: false, minSeconds: DEFAULT_MIN_SECONDS },
    usernames: toGlobalEntries(source.usernameArray),
    keywords: toGlobalEntries(keywordSource),
    rules: [],
  };
}
