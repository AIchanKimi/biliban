// 配置存储层：chrome.storage.local 读写 + 多标签页同步订阅。
// 存储 key 与形状对等 Tampermonkey（bilibili_config 单对象），支持手动导入导出迁移。
import { CONFIG_KEY, INFO_RECORD_KEY, DEFAULT_CONFIG } from './defaults.js';
import { applyMigrations } from './migrate.js';
import { toRuntimeValue, toStorageValue } from './serialize.js';
import { isRecordFresh } from '../util/date.js';

const LIST_KEYS = ['usernameArray', 'keywordArray', 'commentArray', 'whitelistArray'];

// 自身写入回显过滤：storage.onChanged 对本标签页的写入也会触发。
// 用键序无关的规范 JSON 比对——存储往返不保证键顺序不变。
let lastSavedJson = '';

/**
 * 键序无关的规范 JSON（递归排序对象键）。
 * @param {unknown} value
 * @returns {unknown}
 */
export function sortKeysForCanonicalJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysForCanonicalJson);
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysForCanonicalJson(value[key]);
    }
    return sorted;
  }
  return value;
}

/** @param {unknown} value @returns {string} */
export function canonicalJson(value) {
  return JSON.stringify(sortKeysForCanonicalJson(value));
}

/**
 * 原始存储对象 → 规范化配置（纯函数，可单测）。
 * 迁移旧 key → 与默认值合并 → 列表字段强制为数组 → 冻结。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Readonly<Record<string, unknown>>}
 */
export function normalize(rawConfig) {
  const migrated = applyMigrations(rawConfig);
  const merged = { ...DEFAULT_CONFIG, ...migrated };
  for (const key of LIST_KEYS) {
    if (!Array.isArray(merged[key])) {
      merged[key] = [];
    }
  }
  return Object.freeze(merged);
}

/**
 * 规范化 + 读取时正则转换（keywordArray/commentArray 变为 string|RegExp 混合）。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Readonly<Record<string, unknown>>}
 */
export function toRuntimeConfig(rawConfig) {
  const normalized = normalize(rawConfig);
  return Object.freeze({
    ...normalized,
    keywordArray: toRuntimeValue(normalized.keywordArray, 'keywordArray'),
    commentArray: toRuntimeValue(normalized.commentArray, 'commentArray'),
  });
}

/**
 * 运行时配置 → 存储对象（正则序列化为字符串，纯函数，可单测）。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Record<string, unknown>}
 */
export function toStorageObject(runtimeConfig) {
  return {
    ...runtimeConfig,
    usernameArray: toStorageValue(runtimeConfig.usernameArray),
    keywordArray: toStorageValue(runtimeConfig.keywordArray),
    commentArray: toStorageValue(runtimeConfig.commentArray),
    whitelistArray: toStorageValue(runtimeConfig.whitelistArray),
  };
}

/**
 * 读取原始存储（未规范化）。
 * @returns {Promise<{ rawConfig: Record<string, unknown> | null, infoRecord: Array<Record<string, unknown>> }>}
 */
export async function loadRaw() {
  const stored = await chrome.storage.local.get([CONFIG_KEY, INFO_RECORD_KEY]);
  const rawConfig = stored[CONFIG_KEY] ?? null;
  const infoRecord = Array.isArray(stored[INFO_RECORD_KEY]) ? stored[INFO_RECORD_KEY] : [];
  return { rawConfig, infoRecord };
}

/**
 * 保存运行时配置到存储。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Promise<void>}
 */
export async function saveConfig(runtimeConfig) {
  const storageObject = toStorageObject(runtimeConfig);
  lastSavedJson = canonicalJson(storageObject);
  await chrome.storage.local.set({ [CONFIG_KEY]: storageObject });
}

/**
 * 读取 BV→用户名缓存，过滤掉超过 3 天的条目（对等 target.js 437–442）。
 * @returns {Promise<Array<{ bv: string, user: string, time: string }>>}
 */
export async function loadInfoRecord() {
  const { infoRecord } = await loadRaw();
  const now = Date.now();
  return infoRecord.filter(record => isRecordFresh(now, record));
}

/**
 * @param {Array<{ bv: string, user: string, time: string }>} records
 * @returns {Promise<void>}
 */
export async function saveInfoRecord(records) {
  await chrome.storage.local.set({ [INFO_RECORD_KEY]: records });
}

/**
 * 订阅远端标签页的配置变更（多标签页同步，对等 GM_addValueChangeListener）。
 * 自身写入回显被过滤；远端变更回调收到规范化后的存储值（未做正则转换）。
 * @param {(normalizedConfig: Readonly<Record<string, unknown>>) => void} onRemoteChange
 * @returns {() => void} unsubscribe
 */
export function subscribe(onRemoteChange) {
  const listener = (changes, areaName) => {
    if (areaName !== 'local' || !changes[CONFIG_KEY]) {
      return;
    }
    const newValue = changes[CONFIG_KEY].newValue;
    if (canonicalJson(newValue) === lastSavedJson) {
      return;
    }
    onRemoteChange(normalize(newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
