// 临时词条（v5 新增）：仅存标签页内存，不落盘、不参与多标签同步，刷新即失。
// 单一真源：面板临时 chip 的增删一律经此模块；rebuild 时从此处重新渲染。
import { normalizeScopes } from './scopes.js';

const TEMP_TYPES = ['keyword', 'username'];

let tempEntries = [];

/** 词条身份键：值 + 类型 + 作用域集合（序无关） */
function entryKey(entry) {
  return JSON.stringify([entry.value, entry.type, [...entry.scopes].sort()]);
}

/** @returns {Array<{ value: string, type: string, scopes: string[] }>} 副本 */
export function getTempEntries() {
  return tempEntries.map(entry => ({ ...entry, scopes: [...entry.scopes] }));
}

/**
 * 添加临时词条：非法项（空值/坏类型）过滤，重复项跳过。
 * @param {ReadonlyArray<{ value: unknown, type: unknown, scopes?: unknown }>} items
 */
export function addTempEntries(items) {
  const next = [...tempEntries];
  for (const item of items ?? []) {
    if (!item || typeof item.value !== 'string' || item.value === '' || !TEMP_TYPES.includes(item.type)) {
      continue;
    }
    const candidate = { value: item.value, type: item.type, scopes: normalizeScopes(item.scopes) };
    if (!next.some(existing => entryKey(existing) === entryKey(candidate))) {
      next.push(candidate);
    }
  }
  tempEntries = next;
}

/**
 * 按 值+类型+作用域 精确移除。
 * @param {{ value: string, type: string, scopes: ReadonlyArray<string> }} item
 */
export function removeTempEntry(item) {
  const key = entryKey({ value: item.value, type: item.type, scopes: item.scopes });
  tempEntries = tempEntries.filter(entry => entryKey(entry) !== key);
}

export function clearTempEntries() {
  tempEntries = [];
}

/**
 * 持久词条 + 指定类型的临时词条合并（临时排后；同值同作用域持久优先去重）。
 * @param {ReadonlyArray<{ value: unknown, scopes: ReadonlyArray<string> }>} persistentEntries
 * @param {'keyword' | 'username'} type
 * @returns {Array<{ value: unknown, scopes: string[] }>}
 */
export function getEffectiveEntries(persistentEntries, type) {
  const persistent = (Array.isArray(persistentEntries) ? persistentEntries : []).map(entry => ({
    value: entry.value,
    scopes: [...entry.scopes],
  }));
  const seen = new Set(persistent.map(entry => JSON.stringify([entry.value, [...entry.scopes].sort()])));
  const merged = [...persistent];
  for (const entry of tempEntries) {
    if (entry.type !== type) {
      continue;
    }
    const key = JSON.stringify([entry.value, [...entry.scopes].sort()]);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ value: entry.value, scopes: [...entry.scopes] });
    }
  }
  return merged;
}
