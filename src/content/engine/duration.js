// 时长按蔽（v5.2 词条化，v5.3 规则级时长选择器）：解析卡片内形如 1:23 / 1:02:03 的时长文本，
// 与任意生效的时长词条（短于/长于 N 秒）比较。
// 时长文本定位：规则可选 durationSelector 精确定位；缺省时启发式扫描叶子节点。
// 性能防护：叶子节点过滤 + 严格正则首中即返 + WeakMap 只缓存正值
// （负值不缓存——时长文本常懒加载，下一轮 hideEvent 需重试）。

import { scopesApply } from '../config/scopes.js';

const DURATION_RE = /^\d{1,3}(:\d{2}){1,2}$/;

// 缓存键：卡片元素 → （选择器标识 → 秒数）。选择器标识 '' 表示启发式扫描。
let durationCache = new WeakMap();

/**
 * @param {unknown} text
 * @returns {number | null} 秒数；非时长文本返回 null
 */
export function parseDuration(text) {
  if (typeof text !== 'string') {
    return null;
  }
  const trimmed = text.trim();
  if (!DURATION_RE.test(trimmed)) {
    return null;
  }
  const parts = trimmed.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

/**
 * 寻找卡片的时长秒数。
 * durationSelector 存在时精确定位（规则扩展点）；否则启发式扫描首个形似时长的叶子节点。
 * @param {Element | null | undefined} card
 * @param {string} [durationSelector] 卡片内时长元素选择器（可选）
 * @returns {number | null} 秒数；未找到返回 null
 */
export function findDurationSeconds(card, durationSelector = '') {
  if (!card || typeof card.querySelectorAll !== 'function') {
    return null;
  }
  const cacheKey = durationSelector || '';
  const bySelector = durationCache.get(card);
  if (bySelector && bySelector.has(cacheKey)) {
    return bySelector.get(cacheKey);
  }
  let seconds = null;
  if (cacheKey) {
    try {
      const el = card.querySelector(cacheKey);
      if (el) {
        // 用户明确指定了时长元素：宽松提取（textContent 内首个时长模式，容忍混入的角标等）
        const matched = typeof el.textContent === 'string' ? el.textContent.match(/\d{1,3}(?::\d{2}){1,2}/) : null;
        seconds = matched ? parseDuration(matched[0]) : null;
      }
    } catch {
      seconds = null; // 选择器非法：按未找到处理（面板添加时已试编译校验）
    }
  } else {
    let elements;
    try {
      elements = card.querySelectorAll('*');
    } catch {
      return null;
    }
    for (const el of elements) {
      if (el.childElementCount === 0) {
        seconds = parseDuration(el.textContent);
        if (seconds != null) {
          break;
        }
      }
    }
  }
  if (seconds != null) {
    const map = bySelector ?? new Map();
    map.set(cacheKey, seconds);
    durationCache.set(card, map);
  }
  return seconds;
}

/**
 * 时长词条判定（纯函数）：任一生效词条命中即屏蔽。
 * @param {ReadonlyArray<{ op: 'lt' | 'gt', seconds: number, scopes: ReadonlyArray<string> }>} entries
 * @param {number | null} cardSeconds 卡片时长（null=未找到 → 不处理）
 * @param {string | null} category
 * @returns {boolean}
 */
export function decideDurationEntries(entries, cardSeconds, category) {
  if (cardSeconds == null) {
    return false;
  }
  for (const entry of entries ?? []) {
    if (!scopesApply(entry.scopes, category)) {
      continue;
    }
    if (entry.op === 'lt' && cardSeconds < entry.seconds) {
      return true;
    }
    if (entry.op === 'gt' && cardSeconds > entry.seconds) {
      return true;
    }
  }
  return false;
}

/** 测试辅助：重置缓存 */
export function clearDurationCache() {
  durationCache = new WeakMap();
}
