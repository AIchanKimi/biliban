// hideOperation —— 元素隐藏/显示操作。逐字对等 Block_Obj.fn.hideOperation。
// method 0: class block_obj_none（display:none !important）
// method 1: class block_obj_hidden（visibility:hidden !important）
// method 2: inline display（原脚本未使用，完备性保留）
// method 3: inline visibility，无 !important —— 轮播图等 B 站自管节点依赖此行为
import { HIDE_HIDDEN_CLASS, HIDE_NONE_CLASS } from '../constants.js'

/**
 * @param {Element | null | undefined} node
 * @param {boolean} hideStatus true=隐藏 false=恢复
 * @param {0 | 1 | 2 | 3} method
 */
export function hideOperation(node, hideStatus, method = 0) {
  if (!(node instanceof HTMLElement)) {
    return
  }
  switch (method) {
    case 1:
      node.classList.toggle(HIDE_HIDDEN_CLASS, Boolean(hideStatus))
      break
    case 2:
      node.style.display = hideStatus ? 'none' : ''
      break
    case 3:
      node.style.visibility = hideStatus ? 'hidden' : ''
      break
    default:
      node.classList.toggle(HIDE_NONE_CLASS, Boolean(hideStatus))
  }
}
