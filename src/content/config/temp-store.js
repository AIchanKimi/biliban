// 临时词条（v5 新增）：仅存标签页内存，不落盘、不参与多标签同步，刷新即失。
// 单一真源：面板临时 chip 的增删一律经此模块；rebuild 时从此处重新渲染。
import { normalizeScopes } from './scopes.js';

let tempEntries = [];

/** 词条身份键：值 + 作用域集合（序无关） */
function entryKey(entry) {
  return JSON.stringify([entry.value, [...entry.scopes].sort()]);
}

/** @returns {Array<{ value: string, scopes: string[] }>} 副本 */
export function getTempEntries() {
  return tempEntries.map(entry => ({ ...entry, scopes: [...entry.scopes] }));
}

/**
 * 添加临时词条：非法项（空值）过滤，重复项跳过。
 * @param {ReadonlyArray<{ value: unknown, scopes?: unknown }>} items
 */
export function addTempEntries(items) {
  const next = [...tempEntries];
  for (const item of items ?? []) {
    if (!item || typeof item.value !== 'string' || item.value === '') {
      continue;
    }
    const candidate = { value: item.value, scopes: normalizeScopes(item.scopes) };
    if (!next.some(existing => entryKey(existing) === entryKey(candidate))) {
      next.push(candidate);
    }
  }
  tempEntries = next;
}

/**
 * 按 值+作用域 精确移除。
 * @param {{ value: string, scopes: ReadonlyArray<string> }} item
 */
export function removeTempEntry(item) {
  const key = entryKey({ value: item.value, scopes: item.scopes });
  tempEntries = tempEntries.filter(entry => entryKey(entry) !== key);
}

export function clearTempEntries() {
  tempEntries = [];
}

/**
 * 整体替换（面板保存时以 DOM 收集结果为准）。非法项同样被过滤。
 * @param {ReadonlyArray<{ value: unknown, scopes?: unknown }>} items
 */
export function setTempEntries(items) {
  clearTempEntries();
  addTempEntries(items);
}

/**
 * 按作用域清空（面板标签页内的「清空临时词」）。
 * @param {string} scope
 */
export function removeTempEntriesByScope(scope) {
  tempEntries = tempEntries.filter(entry => !entry.scopes.includes(scope));
}

/**
 * 持久词条 + 临时词条合并（临时排后；同值同作用域持久优先去重）。
 * @param {ReadonlyArray<{ value: unknown, scopes: ReadonlyArray<string> }>} persistentEntries
 * @returns {Array<{ value: unknown, scopes: string[] }>}
 */
export function getEffectiveEntries(persistentEntries) {
  const persistent = (Array.isArray(persistentEntries) ? persistentEntries : []).map(entry => ({
    value: entry.value,
    scopes: [...entry.scopes],
  }));
  const seen = new Set(persistent.map(entry => JSON.stringify([entry.value, [...entry.scopes].sort()])));
  const merged = [...persistent];
  for (const entry of tempEntries) {
    const key = JSON.stringify([entry.value, [...entry.scopes].sort()]);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ value: entry.value, scopes: [...entry.scopes] });
    }
  }
  return merged;
}

/**
 * 运行时配置 + 临时词条合并（每次 getConfig 调用时现算，temp-store 恒为最新）。
 * @param {Readonly<Record<string, unknown>>} runtimeConfig
 * @returns {Readonly<Record<string, unknown>>}
 */
export function mergeTempEntries(runtimeConfig) {
  return {
    ...runtimeConfig,
    words: getEffectiveEntries(runtimeConfig.words),
  };
}
