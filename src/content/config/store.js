// 配置存储层：chrome.storage.local 读写 + 旧版本迁移（版本化备份+写回）+ 多标签页同步订阅。
// 存储形状见 defaults.js；屏蔽词正则转换见 serialize.js；临时词条在 temp-store.js（独立存储键，同样落盘）。
import {
  CONFIG_KEY,
  CONFIG_VERSION,
  BUILTIN_RULES_VERSION,
  backupKeyFor,
} from "./defaults.js";
import { isCurrentVersion, migrateToLatest } from "./migrate.js";
import { toRuntimeWordEntries, toStorageWordEntries } from "./serialize.js";
import { normalizeScopes } from "./scopes.js";

// 自身写入回显过滤：storage.onChanged 对本标签页的写入也会触发。
// 用键序无关的规范 JSON 比对——存储往返不保证键顺序不变。
let lastSavedJson = "";

/**
 * 键序无关的规范 JSON（递归排序对象键）。
 * @param {unknown} value
 * @returns {unknown}
 */
export function sortKeysForCanonicalJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysForCanonicalJson);
  }
  if (value !== null && typeof value === "object") {
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
  if (!entry || typeof entry.value !== "string") {
    return null;
  }
  // v6.2：存量归一 trim（旧数据载入即清理）
  const value = entry.value.trim();
  if (value === "") {
    return null;
  }
  return Object.freeze({
    value,
    scopes: Object.freeze(normalizeScopes(entry.scopes)),
  });
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
  if (!rule || typeof rule !== "object") {
    return null;
  }
  const selector =
    typeof rule.selector === "string" ? rule.selector.trim() : "";
  const id = rule.id != null && String(rule.id) !== "" ? String(rule.id) : "";
  if (!selector || !id) {
    return null;
  }
  // v5.5 规则选择器模型：卡片选择器 + 文字选择器数组（可多个）+ 时长选择器（可选）。
  // 旧形状（titleSelector/userSelector 单字段）自动并入 textSelectors。
  let textSelectors = [];
  if (Array.isArray(rule.textSelectors)) {
    textSelectors = rule.textSelectors.filter(
      (item) => typeof item === "string" && item.trim() !== "",
    );
  } else {
    textSelectors = [rule.titleSelector, rule.userSelector].filter(
      (item) => typeof item === "string" && item.trim() !== "",
    );
  }
  return Object.freeze({
    id,
    selector,
    scopes: Object.freeze(normalizeScopes(rule.scopes)),
    mode: rule.mode === "hide" ? "hide" : "match",
    textSelectors: Object.freeze(textSelectors),
    durationSelector:
      typeof rule.durationSelector === "string" ? rule.durationSelector : "",
    enabled: rule.enabled !== false,
  });
}

/**
 * @param {unknown} entry
 * @returns {Readonly<{ op: 'lt' | 'gt', seconds: number, scopes: ReadonlyArray<string> }> | null}
 */
function sanitizeDurationEntry(entry) {
  if (!entry || (entry.op !== "lt" && entry.op !== "gt")) {
    return null;
  }
  const seconds = Number(entry.seconds);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return Object.freeze({
    op: entry.op,
    seconds,
    scopes: Object.freeze(normalizeScopes(entry.scopes)),
  });
}

/**
 * @param {unknown} list
 * @returns {ReadonlyArray<Readonly<{ op: 'lt' | 'gt', seconds: number, scopes: ReadonlyArray<string> }>>}
 */
function sanitizeDurations(list) {
  const source = Array.isArray(list) ? list : [];
  const result = [];
  for (const entry of source) {
    const sanitized = sanitizeDurationEntry(entry);
    if (sanitized) {
      result.push(sanitized);
    }
  }
  return Object.freeze(result);
}

/**
 * 原始存储对象 → 规范化最新版配置（纯函数）。
 * 旧版本（v1–v4，含 TM 旧形状）自动迁移；逐字段强制；深度冻结。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Readonly<Record<string, unknown>>} 存储形状（关键字为字符串）
 */
export function normalize(rawConfig) {
  const base = isCurrentVersion(rawConfig)
    ? rawConfig
    : migrateToLatest(rawConfig);
  const sanitizeRuleList = (list) => {
    const result = [];
    for (const rule of Array.isArray(list) ? list : []) {
      const sanitized = sanitizeRule(rule);
      if (sanitized) {
        result.push(sanitized);
      }
    }
    return Object.freeze(result);
  };
  // v5：内置规则已由 migrate.mergeRulesWithBuiltins 并入 rules（与自定义规则同构）
  return Object.freeze({
    version: CONFIG_VERSION,
    enable: base.enable ?? true,
    words: sanitizeEntries(base.words),
    durations: sanitizeDurations(base.durations),
    rules: sanitizeRuleList(base.rules),
    builtinVersion: BUILTIN_RULES_VERSION,
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
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function loadRaw() {
  const stored = await chrome.storage.local.get([CONFIG_KEY]);
  return stored[CONFIG_KEY] ?? null;
}

/**
 * 读取并规范化配置；旧形状先写备份键再写回迁移结果（幂等），空存储不落盘。
 * @returns {Promise<Readonly<Record<string, unknown>>>} 存储形状
 */
export async function loadConfig() {
  const rawConfig = await loadRaw();
  if (rawConfig === null) {
    return normalize(null);
  }
  if (isCurrentVersion(rawConfig)) {
    return normalize(rawConfig);
  }
  const migrated = normalize(rawConfig);
  lastSavedJson = canonicalJson(migrated);
  const backupKey = backupKeyFor(
    Number.isInteger(rawConfig.version) ? rawConfig.version : 1,
  );
  await chrome.storage.local.set({
    [backupKey]: rawConfig,
    [CONFIG_KEY]: migrated,
  });
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
 * 订阅远端标签页的配置变更（多标签页同步）。
 * 自身写入回显被过滤；远端变更回调收到规范化后的存储值（未做正则转换）。
 * @param {(normalizedConfig: Readonly<Record<string, unknown>>) => void} onRemoteChange
 * @returns {() => void} unsubscribe
 */
export function subscribe(onRemoteChange) {
  const listener = (changes, areaName) => {
    if (areaName !== "local" || !changes[CONFIG_KEY]) {
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
