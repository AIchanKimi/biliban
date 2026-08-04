// 规则命中统计（v5.2）：按标签页内存记录每条规则「当前匹配几个元素 / 其中几个被屏蔽」。
// 每轮 hideEvent 覆盖写（不是累加）：数字反映当前页面状态，稳定不漂移。
// 页面刷新即清零（模块级状态）。

const stats = new Map();

/**
 * 覆盖写入某规则本轮的命中状态。
 * @param {string} ruleId
 * @param {number} found 选择器本轮匹配到的元素数
 * @param {number} hidden 其中被屏蔽的元素数
 */
export function setRuleStats(ruleId, found, hidden) {
  if (!ruleId) {
    return;
  }
  stats.set(ruleId, { found: Math.max(0, found), hidden: Math.max(0, hidden) });
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
