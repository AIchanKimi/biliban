// 配置存储层 v3：chrome.storage.local 读写 + 旧版本迁移（版本化备份+写回）+ 多标签页同步订阅。
// 存储形状见 defaults.js；屏蔽词正则转换见 serialize.js；临时词条在 temp-store.js（不落盘）。
import { CONFIG_KEY, INFO_RECORD_KEY, DEFAULT_MIN_SECONDS, CONFIG_VERSION, backupKeyFor } from './defaults.js';
import { isCurrentVersion, migrateToLatest } from './migrate.js';
import { toRuntimeWordEntries, toStorageWordEntries } from './serialize.js';
import { normalizeScopes } from './scopes.js';
import { isRecordFresh } from '../util/date.js';

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
 * @param {unknown} entry
 * @returns {Readonly<{ value: string, scopes: ReadonlyArray<string> }> | null}
 */
function sanitizeEntry(entry) {
  if (!entry || typeof entry.value !== 'string' || entry.value === '') {
    return null;
  }
  return Object.freeze({ value: entry.value, scopes: Object.freeze(normalizeScopes(entry.scopes)) });
}

/**
 * @param {unknown} list
 * @returns {ReadonlyArray<Readonly<{ value: string, scopes: ReadonlyArray<string> }>>}
 */
function sanitizeEntries(list) {
  const source = Array.isArray(list) ? list : [];
  const result = [];
  for (const entry of source) {
    const sanitized = sanitizeEntry(entry);
    if (sanitized) {
      result.push(sanitized);
    }
  }
  return Object.freeze(result);
}

/**
 * @param {unknown} rule
 * @returns {Readonly<Record<string, unknown>> | null}
 */
function sanitizeRule(rule) {
  if (!rule || typeof rule !== 'object') {
    return null;
  }
  const selector = typeof rule.selector === 'string' ? rule.selector.trim() : '';
  const id = rule.id != null && String(rule.id) !== '' ? String(rule.id) : '';
  if (!selector || !id) {
    return null;
  }
  return Object.freeze({
    id,
    selector,
    scopes: Object.freeze(normalizeScopes(rule.scopes)),
    mode: rule.mode === 'hide' ? 'hide' : 'match',
    titleSelector: typeof rule.titleSelector === 'string' ? rule.titleSelector : '',
    userSelector: typeof rule.userSelector === 'string' ? rule.userSelector : '',
    enabled: rule.enabled !== false,
  });
}

/**
 * @param {unknown} duration
 * @returns {Readonly<{ enable: boolean, minSeconds: number }>}
 */
function sanitizeDuration(duration) {
  const source = duration !== null && typeof duration === 'object' ? duration : {};
  const min = Number(source.minSeconds);
  return Object.freeze({
    enable: Boolean(source.enable),
    minSeconds: Number.isFinite(min) && min > 0 ? min : DEFAULT_MIN_SECONDS,
  });
}

/**
 * 原始存储对象 → 规范化 v2 配置（纯函数）。
 * v1（含 TM 旧形状）自动迁移；v2 逐字段强制；深度冻结。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Readonly<Record<string, unknown>>} 存储形状（关键字为字符串）
 */
export function normalize(rawConfig) {
  const base = isCurrentVersion(rawConfig) ? rawConfig : migrateToLatest(rawConfig);
  const rules = [];
  for (const rule of Array.isArray(base.rules) ? base.rules : []) {
    const sanitized = sanitizeRule(rule);
    if (sanitized) {
      rules.push(sanitized);
    }
  }
  return Object.freeze({
    version: CONFIG_VERSION,
    enable: base.enable ?? true,
    duration: sanitizeDuration(base.duration),
    words: sanitizeEntries(base.words),
    rules: Object.freeze(rules),
  });
}

/**
 * 规范化 + 读取时关键字正则转换。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Readonly<Record<string, unknown>>} 运行时形状（keyword value 可为 RegExp）
 */
export function toRuntimeConfig(rawConfig) {
  const normalized = normalize(rawConfig);
  return Object.freeze({
    ...normalized,
    words: toRuntimeWordEntries(normalized.words),
  });
}

/**
 * 运行时配置 → 存储对象（关键字正则序列化为字符串，纯函数）。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Record<string, unknown>}
 */
export function toStorageObject(runtimeConfig) {
  return {
    ...runtimeConfig,
    words: toStorageWordEntries(runtimeConfig.words),
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
 * 读取并规范化配置；v1 形状先写备份键再写回迁移结果（幂等），空存储不落盘。
 * @returns {Promise<Readonly<Record<string, unknown>>>} 存储形状
 */
export async function loadConfig() {
  const { rawConfig } = await loadRaw();
  if (rawConfig === null) {
    return normalize(null);
  }
  if (isCurrentVersion(rawConfig)) {
    return normalize(rawConfig);
  }
  const migrated = normalize(rawConfig);
  lastSavedJson = canonicalJson(migrated);
  const backupKey = backupKeyFor(Number.isInteger(rawConfig.version) ? rawConfig.version : 1);
  await chrome.storage.local.set({ [backupKey]: rawConfig, [CONFIG_KEY]: migrated });
  return migrated;
}

/**
 * 保存存储形状配置。
 * @param {Record<string, unknown>} storageObject
 * @returns {Promise<void>}
 */
export async function saveConfig(storageObject) {
  lastSavedJson = canonicalJson(storageObject);
  await chrome.storage.local.set({ [CONFIG_KEY]: storageObject });
}

/**
 * 读取 BV→用户名缓存，过滤掉超过 3 天的条目。
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
 * 订阅远端标签页的配置变更（多标签页同步）。
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
