// 存储迁移：v1（含油猴原脚本形状）/ v2 / v3 → v4（当前）。纯函数；备份与写回由 store.loadConfig 负责。
// v1 丢弃项（不可逆，loadConfig 迁移前写版本化备份键）：commentArray/whitelistArray、各废弃开关。
// v2 → v3 语义：usernames 与 keywords 合并为 words。
// v3 → v4：全局 duration 开关转为一条时长词条 {op:'lt', seconds, scopes:['global']}（关闭则无）。
import { CONFIG_VERSION } from './defaults.js';

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

/** v2/v3 词条对象数组 → 词条（宽松强制，normalize 再精修） */
function fromObjectList(list) {
  const source = Array.isArray(list) ? list : [];
  return source.filter(entry => entry && typeof entry.value === 'string' && entry.value !== '');
}

/** v3 的全局 duration 开关 → 时长词条数组 */
function durationFromV3(duration) {
  if (!duration || typeof duration !== 'object' || !duration.enable) {
    return [];
  }
  const min = Number(duration.minSeconds);
  if (!Number.isFinite(min) || min <= 0) {
    return [];
  }
  return [{ op: 'lt', seconds: min, scopes: ['global'] }];
}

/**
 * 任意旧形状 → v4（不修改入参）。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {{ version: number, enable: boolean, words: Array<object>, durations: Array<object>, rules: unknown[] }}
 */
export function migrateToLatest(rawConfig) {
  const source = rawConfig ?? {};
  if (source.version === 3) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      words: dedupeEntries(fromObjectList(source.words)),
      durations: durationFromV3(source.duration),
      rules: Array.isArray(source.rules) ? source.rules : [],
    };
  }
  if (source.version === 2) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      words: dedupeEntries([...fromObjectList(source.usernames), ...fromObjectList(source.keywords)]),
      durations: durationFromV3(source.duration),
      rules: Array.isArray(source.rules) ? source.rules : [],
    };
  }
  // v1（含 Tampermonkey 原形状）
  const keywordSource = [
    ...(Array.isArray(source.keywordArray) ? source.keywordArray : []),
    ...(Array.isArray(source.regArray) ? source.regArray : []),
  ];
  return {
    version: CONFIG_VERSION,
    enable: source.functionEnable ?? true,
    words: dedupeEntries([
      ...toGlobalEntries(source.usernameArray),
      ...toGlobalEntries(keywordSource),
    ]),
    durations: [],
    rules: [],
  };
}
