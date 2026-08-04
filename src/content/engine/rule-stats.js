// 规则命中统计（v5.2）：按标签页内存记录每条规则「找到几个元素 / 隐藏几个」。
// 面板打开时读取并高亮，帮助用户识别失效/无用规则。页面刷新即清零（模块级状态）。

const stats = new Map();

/**
 * @param {string} ruleId
 * @param {number} count
 */
export function recordRuleFound(ruleId, count) {
  if (!ruleId || count <= 0) {
    return;
  }
  const entry = stats.get(ruleId) ?? { found: 0, hidden: 0 };
  entry.found += count;
  stats.set(ruleId, entry);
}

/**
 * @param {string} ruleId
 * @param {number} count
 */
export function recordRuleHidden(ruleId, count = 1) {
  if (!ruleId || count <= 0) {
    return;
  }
  const entry = stats.get(ruleId) ?? { found: 0, hidden: 0 };
  entry.hidden += count;
  stats.set(ruleId, entry);
}

/** @returns {Record<string, { found: number, hidden: number }>} 副本 */
export function getRuleStats() {
  const result = {};
  for (const [ruleId, entry] of stats) {
    result[ruleId] = { ...entry };
  }
  return result;
}

/** 测试辅助 */
export function clearRuleStats() {
  stats.clear();
}
