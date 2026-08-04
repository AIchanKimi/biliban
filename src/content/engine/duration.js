// 时长按蔽（v5 新增）：解析卡片内形如 1:23 / 1:02:03 的时长文本。
// 性能防护：叶子节点过滤 + 严格正则首中即返 + WeakMap 只缓存正值
// （负值不缓存——时长文本常懒加载，下一轮 hideEvent 需重试）。

const DURATION_RE = /^\d{1,3}(:\d{2}){1,2}$/;

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
 * 在卡片子树中寻找首个叶子节点的时长文本。
 * @param {Element | null | undefined} card
 * @returns {number | null} 秒数；未找到返回 null
 */
export function findDurationSeconds(card) {
  if (!card || typeof card.querySelectorAll !== 'function') {
    return null;
  }
  if (durationCache.has(card)) {
    return durationCache.get(card);
  }
  let elements;
  try {
    elements = card.querySelectorAll('*');
  } catch {
    return null;
  }
  for (const el of elements) {
    if (el.childElementCount === 0) {
      const seconds = parseDuration(el.textContent);
      if (seconds != null) {
        durationCache.set(card, seconds);
        return seconds;
      }
    }
  }
  return null;
}

/** 测试辅助：重置缓存 */
export function clearDurationCache() {
  durationCache = new WeakMap();
}
