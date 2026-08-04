// extractList 的纯核心（对等 Block_Obj 列表真值机制）：
//   - chip 以 afterbegin 插入 ⇒ DOM 顺序 = 数组逆序，恢复时需反转
//   - 超过 9 字符的 chip 显示被截断，完整值保存在 title 属性 ⇒ title 是真值
/**
 * @param {Array<{ title: string, textContent: string }>} chipTextNodes 按 DOM 顺序
 * @returns {string[]} 原始数组顺序的完整值
 */
export function recoverListValues(chipTextNodes) {
  return [...chipTextNodes].reverse().map(node => node.title || node.textContent);
}

/**
 * chip 显示文本：超过 9 字符截断为 'abc ... xyz'（完整值另行存 title）。
 * @param {string} value
 * @returns {string}
 */
export function truncateForDisplay(value) {
  return value.length > 9 ? `${value.slice(0, 3)} ... ${value.slice(-3)}` : value;
}
