// 临时词条（v5 新增）：仅存标签页内存，不落盘、不参与多标签同步，刷新即失。
// 单一真源：面板临时 chip 的增删一律经此模块；rebuild 时从此处重新渲染。
// 词条分 kind：'word'（屏蔽词 {value}）与 'duration'（时长词条 {op, seconds}）。
import { normalizeScopes } from './scopes.js';

const KINDS = ['word', 'duration'];

let tempEntries = [];

/** 词条身份键：kind + 内容 + 作用域集合（序无关） */
function entryKey(entry) {
  const payload = entry.kind === 'duration' ? [entry.op, entry.seconds] : [entry.value];
  return JSON.stringify([entry.kind, ...payload, [...entry.scopes].sort()]);
}

/** @param {unknown} item @returns {{ kind: string, value?: string, op?: string, seconds?: number, scopes: string[] } | null} */
function sanitizeItem(item) {
  if (!item || !KINDS.includes(item.kind)) {
    return null;
  }
  if (item.kind === 'word') {
    if (typeof item.value !== 'string' || item.value === '') {
      return null;
    }
    return { kind: 'word', value: item.value, scopes: normalizeScopes(item.scopes) };
  }
  const seconds = Number(item.seconds);
  if ((item.op !== 'lt' && item.op !== 'gt') || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return { kind: 'duration', op: item.op, seconds, scopes: normalizeScopes(item.scopes) };
}

/** @returns {Array<object>} 副本 */
export function getTempEntries() {
  return tempEntries.map(entry => ({ ...entry, scopes: [...entry.scopes] }));
}

/**
 * 添加临时词条：非法项过滤，重复项跳过。
 * @param {ReadonlyArray<object>} items
 */
export function addTempEntries(items) {
  const next = [...tempEntries];
  for (const item of items ?? []) {
    const candidate = sanitizeItem(item);
    if (candidate && !next.some(existing => entryKey(existing) === entryKey(candidate))) {
      next.push(candidate);
    }
  }
  tempEntries = next;
}

/**
 * 按身份精确移除。
 * @param {object} item
 */
export function removeTempEntry(item) {
  const candidate = sanitizeItem(item);
  if (!candidate) {
    return;
  }
  const key = entryKey(candidate);
  tempEntries = tempEntries.filter(entry => entryKey(entry) !== key);
}

export function clearTempEntries() {
  tempEntries = [];
}

/**
 * 整体替换（面板保存时以 DOM 收集结果为准）。非法项同样被过滤。
 * @param {ReadonlyArray<object>} items
 */
export function setTempEntries(items) {
  clearTempEntries();
  addTempEntries(items);
}

/**
 * 按作用域清空（面板标签页内的「清空临时词」：屏蔽词与时长词条一起清）。
 * @param {string} scope
 */
export function removeTempEntriesByScope(scope) {
  tempEntries = tempEntries.filter(entry => !entry.scopes.includes(scope));
}

/**
 * 持久 + 指定 kind 的临时词条合并（临时排后；同身份持久优先去重）。
 * @param {ReadonlyArray<object>} persistentEntries
 * @param {'word' | 'duration'} kind
 * @returns {Array<object>}
 */
export function getEffectiveEntries(persistentEntries, kind) {
  const keyOf = entry => JSON.stringify(
    kind === 'duration' ? [entry.op, entry.seconds, [...entry.scopes].sort()] : [entry.value, [...entry.scopes].sort()]
  );
  const persistent = (Array.isArray(persistentEntries) ? persistentEntries : []).map(entry => ({ ...entry, scopes: [...entry.scopes] }));
  const seen = new Set(persistent.map(keyOf));
  const merged = [...persistent];
  for (const entry of tempEntries) {
    if (entry.kind !== kind) {
      continue;
    }
    const key = keyOf(entry);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...entry, scopes: [...entry.scopes] });
    }
  }
  return merged.map(entry => {
    const copy = { ...entry };
    delete copy.kind;
    return copy;
  });
}

/**
 * 运行时配置 + 临时词条合并（每次 getConfig 调用时现算，temp-store 恒为最新）。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Readonly<Record<string, unknown>>}
 */
export function mergeTempEntries(runtimeConfig) {
  return {
    ...runtimeConfig,
    words: getEffectiveEntries(runtimeConfig.words, 'word'),
    durations: getEffectiveEntries(runtimeConfig.durations, 'duration'),
  };
}
