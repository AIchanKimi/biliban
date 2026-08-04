// hideHandler —— 单卡片判定与隐藏执行（v5.2）。
// 契约 (itemNode, username, textValue, method)：resolver 与首页特殊逻辑依赖。
// 判定：enable 门控 → 屏蔽词 decide → 时长词条兜底 → hideOperation（false 时解除）。
// 返回 hideStatus，供 hide-event 按轮统计命中数。
import { decide } from './decide.js';
import { categoryFor } from './category.js';
import { findDurationSeconds, decideDurationEntries } from './duration.js';
import { hideOperation } from '../dom/hide-operation.js';

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>> }} deps
 * @returns {(itemNode, username, textValue, method?: number) => boolean}
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
    const category = categoryFor(location.href);
    let hideStatus = false;
    if (config.enable) {
      hideStatus = decide(config, category, { username, title: textValue });
      if (!hideStatus && config.durations.length > 0) {
        const probe = Array.isArray(itemNode) ? itemNode.find(Boolean) : itemNode;
        hideStatus = decideDurationEntries(config.durations, findDurationSeconds(probe), category);
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
    return hideStatus;
  };
}
