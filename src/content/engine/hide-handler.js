// hideHandler —— 单卡片判定与隐藏执行（v5 精简）。
// 契约保持 (itemNode, username, textValue, method)：resolver 与首页特殊逻辑依赖。
// 判定：enable 门控 → decide（词条 + 作用域 + 临时词）→ 时长兜底 → hideOperation（false 时解除）。
import { decide } from './decide.js';
import { categoryFor } from './category.js';
import { findDurationSeconds } from './duration.js';
import { hideOperation } from '../dom/hide-operation.js';

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>> }} deps
 * @returns {(itemNode: Element | Element[] | null, username: Element | string | null, textValue: Element | string | null, method?: number) => void}
 */
export function createHideHandler(deps) {
  return function hideHandler(itemNode, username, textValue, method = 0) {
    if (username && typeof username === 'object') {
      username = username.textContent;
    }
    if (textValue && typeof textValue === 'object') {
      textValue = textValue.textContent;
    }
    const config = deps.getConfig();
    let hideStatus = false;
    if (config.enable) {
      const category = categoryFor(location.href);
      hideStatus = decide(config, category, { username, title: textValue });
      if (!hideStatus && config.duration.enable) {
        const probe = Array.isArray(itemNode) ? itemNode.find(Boolean) : itemNode;
        const seconds = findDurationSeconds(probe);
        if (seconds != null && seconds < config.duration.minSeconds) {
          hideStatus = true;
        }
      }
    }
    if (Array.isArray(itemNode)) {
      for (const node of itemNode) {
        if (node) {
          hideOperation(node, hideStatus, method);
        }
      }
    } else {
      hideOperation(itemNode, hideStatus, method);
    }
  };
}
