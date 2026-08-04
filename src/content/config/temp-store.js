// 临时词条（v5.5 过期制）：独立存储键 TEMP_KEY，带 expiresAt 过期时间（v6.5 起固定 1 小时）。
// 刷新不丢、跨标签页同步（storage.onChanged）；到期自动清除。
// 词条分 kind：'word'（屏蔽词 {value}）与 'duration'（时长词条 {op, seconds}）。
import { TEMP_KEY, TEMP_DEFAULT_HOURS } from "./defaults.js";
import { normalizeScopes } from "./scopes.js";
import { canonicalJson } from "./store.js";

const KINDS = ["word", "duration"];

let tempEntries = []; // 内存镜像（含未过期与已到期的，读取时过滤）
let lastSavedJson = "";

/** 词条身份键：kind + 内容 + 作用域集合（序无关） */
function entryKey(entry) {
  const payload =
    entry.kind === "duration" ? [entry.op, entry.seconds] : [entry.value];
  return JSON.stringify([entry.kind, ...payload, [...entry.scopes].sort()]);
}

/**
 * @param {unknown} item
 * @returns {{ kind: string, value?: string, op?: string, seconds?: number, scopes: string[], expiresAt?: number } | null}
 */
function sanitizeItem(item) {
  if (!item || !KINDS.includes(item.kind)) {
    return null;
  }
  let base = null;
  if (item.kind === "word") {
    if (typeof item.value !== "string" || item.value === "") {
      return null;
    }
    base = { kind: "word", value: item.value };
  } else {
    const seconds = Number(item.seconds);
    if (
      (item.op !== "lt" && item.op !== "gt") ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    ) {
      return null;
    }
    base = { kind: "duration", op: item.op, seconds };
  }
  const result = { ...base, scopes: normalizeScopes(item.scopes) };
  const expiresAt = Number(item.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    result.expiresAt = expiresAt;
  }
  return result;
}

function isFresh(entry, now) {
  return typeof entry.expiresAt !== "number" || entry.expiresAt > now;
}

async function persist(entries) {
  lastSavedJson = canonicalJson(entries);
  await chrome.storage.local.set({ [TEMP_KEY]: entries });
}

/** 启动时从存储载入并清掉过期项。 */
export async function initTempStore() {
  const stored = await chrome.storage.local.get(TEMP_KEY);
  const list = Array.isArray(stored[TEMP_KEY]) ? stored[TEMP_KEY] : [];
  tempEntries = list.map(sanitizeItem).filter(Boolean);
  await pruneExpired();
}

/** 清除过期词条；有变更时写回。 @returns {Promise<number>} 清除条数 */
export async function pruneExpired() {
  const now = Date.now();
  const fresh = tempEntries.filter((entry) => isFresh(entry, now));
  const removed = tempEntries.length - fresh.length;
  tempEntries = fresh;
  if (removed > 0) {
    await persist(fresh);
  }
  return removed;
}

/** @returns {Array<object>} 未过期词条的副本 */
export function getTempEntries() {
  const now = Date.now();
  return tempEntries
    .filter((entry) => isFresh(entry, now))
    .map((entry) => ({ ...entry, scopes: [...entry.scopes] }));
}

/**
 * 添加临时词条：非法项过滤，重复项（身份相同）跳过；expiresAt 缺省为 now + defaultHours。
 * @param {ReadonlyArray<object>} items
 * @param {number} [hours]
 */
export async function addTempEntries(items, hours = TEMP_DEFAULT_HOURS) {
  const now = Date.now();
  const next = [...tempEntries.filter((entry) => isFresh(entry, now))];
  for (const item of items ?? []) {
    const candidate = sanitizeItem(item);
    if (!candidate) {
      continue;
    }
    if (!candidate.expiresAt) {
      candidate.expiresAt = now + hours * 3600_000;
    }
    if (!next.some((existing) => entryKey(existing) === entryKey(candidate))) {
      next.push(candidate);
    }
  }
  tempEntries = next;
  await persist(next);
}

/**
 * 整体替换（面板保存时以 DOM 收集结果为准）。
 * 词条自带 expiresAt 时保留（续存原有到期时间），否则按 hours 计算。
 * @param {ReadonlyArray<object>} items
 * @param {number} [hours]
 */
export async function setTempEntries(items, hours = TEMP_DEFAULT_HOURS) {
  const now = Date.now();
  const next = [];
  for (const item of items ?? []) {
    const candidate = sanitizeItem(item);
    if (!candidate) {
      continue;
    }
    if (!candidate.expiresAt) {
      candidate.expiresAt = now + hours * 3600_000;
    }
    if (!next.some((existing) => entryKey(existing) === entryKey(candidate))) {
      next.push(candidate);
    }
  }
  tempEntries = next;
  await persist(next);
}

/**
 * 订阅临时词条的远端变更（其他标签页增删）。自身写入回显被过滤。
 * @param {() => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeTemp(onChange) {
  const listener = (changes, areaName) => {
    if (areaName !== "local" || !changes[TEMP_KEY]) {
      return;
    }
    const newValue = changes[TEMP_KEY].newValue;
    if (canonicalJson(newValue) === lastSavedJson) {
      return;
    }
    tempEntries = (Array.isArray(newValue) ? newValue : [])
      .map(sanitizeItem)
      .filter(Boolean);
    onChange();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/**
 * 持久 + 未过期临时词条合并（临时排后；同身份持久优先去重）。
 * @param {ReadonlyArray<object>} persistentEntries
 * @param {'word' | 'duration'} kind
 * @returns {Array<object>}
 */
export function getEffectiveEntries(persistentEntries, kind) {
  const now = Date.now();
  const keyOf = (entry) =>
    JSON.stringify(
      kind === "duration"
        ? [entry.op, entry.seconds, [...entry.scopes].sort()]
        : [entry.value, [...entry.scopes].sort()],
    );
  const persistent = (
    Array.isArray(persistentEntries) ? persistentEntries : []
  ).map((entry) => ({ ...entry, scopes: [...entry.scopes] }));
  const seen = new Set(persistent.map(keyOf));
  const merged = [...persistent];
  for (const entry of tempEntries) {
    if (entry.kind !== kind || !isFresh(entry, now)) {
      continue;
    }
    const key = keyOf(entry);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...entry, scopes: [...entry.scopes] });
    }
  }
  return merged.map((entry) => {
    const copy = { ...entry };
    delete copy.kind;
    delete copy.expiresAt;
    return copy;
  });
}

/**
 * 运行时配置 + 临时词条合并（每次 getConfig 调用时现算）。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Readonly<Record<string, unknown>>}
 */
export function mergeTempEntries(runtimeConfig) {
  return {
    ...runtimeConfig,
    words: getEffectiveEntries(runtimeConfig.words, "word"),
    durations: getEffectiveEntries(runtimeConfig.durations, "duration"),
  };
}
