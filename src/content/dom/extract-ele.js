// extractEle —— 按选择器（或选择器数组）在容器内取元素。
// 逐字移植 target.js 1130–1145。

/**
 * @param {Element} ele 容器元素
 * @param {string | string[] | null | undefined} selector 数组时取首个命中的选择器
 * @returns {Element | null}
 */
export function extractEle(ele, selector) {
  let result = null;
  if (selector) {
    if (Array.isArray(selector)) {
      for (const item of selector) {
        if (ele.querySelector(item)) {
          result = ele.querySelector(item);
          break;
        }
      }
    } else {
      result = ele.querySelector(selector);
    }
  }
  return result;
}
