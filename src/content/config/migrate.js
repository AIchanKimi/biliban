// 存储迁移：v1（含油猴原脚本形状）/ v2 → v3（当前）。纯函数；备份与写回由 store.loadConfig 负责。
// v1 丢弃项（不可逆，loadConfig 迁移前写 bilibili_config_v1_backup）：
//   commentArray/whitelistArray、全部评论/直播/相薄/消息中心开关等。
// v2 → v3：usernames 与 keywords 合并为 words（顺序保留、按 值+作用域 去重），无信息丢失之外的风险。
import { CONFIG_VERSION, DEFAULT_MIN_SECONDS } from './defaults.js';

/**
 * @param {unknown} rawConfig
 * @returns {boolean} 已是当前版本形状
 */
export function isCurrentVersion(rawConfig) {
  return Boolean(rawConfig) && rawConfig.version === CONFIG_VERSION;
}

/**
 * 字符串数组 → 全局作用域词条（过滤非字符串/空串）。
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
 * 词条列表按 值+作用域集合 去重（首次出现保留）。
 * @param {Array<{ value: unknown, scopes?: unknown }>} entries
 * @returns {Array<{ value: unknown, scopes: unknown }>}
 */
function dedupeEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries) {
    const scopes = Array.isArray(entry.scopes) ? entry.scopes : ['global'];
    const key = JSON.stringify([entry.value, [...scopes].sort()]);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ value: entry.value, scopes });
    }
  }
  return result;
}

/** v2 词条对象数组 → 词条（宽松强制，normalize 再精修） */
function fromV2List(list) {
  const source = Array.isArray(list) ? list : [];
  return source.filter(entry => entry && typeof entry.value === 'string' && entry.value !== '');
}

/**
 * 任意旧形状 → v3（不修改入参）。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {{ version: number, enable: boolean, duration: { enable: boolean, minSeconds: number }, words: Array<{ value: string, scopes: string[] }>, rules: unknown[] }}
 */
export function migrateToLatest(rawConfig) {
  const source = rawConfig ?? {};
  if (source.version === 2) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      duration: source.duration ?? { enable: false, minSeconds: DEFAULT_MIN_SECONDS },
      words: dedupeEntries([...fromV2List(source.usernames), ...fromV2List(source.keywords)]),
      rules: Array.isArray(source.rules) ? source.rules : [],
    };
  }
  // v1（含 Tampermonkey 原形状）
  const keywordSource = [
    ...(Array.isArray(source.keywordArray) ? source.keywordArray : []),
    ...(Array.isArray(source.regArray) ? source.regArray : []),
  ];
  const words = dedupeEntries([
    ...toGlobalEntries(source.usernameArray),
    ...toGlobalEntries(keywordSource),
  ]);
  return {
    version: CONFIG_VERSION,
    enable: source.functionEnable ?? true,
    duration: { enable: false, minSeconds: DEFAULT_MIN_SECONDS },
    words,
    rules: [],
  };
}
