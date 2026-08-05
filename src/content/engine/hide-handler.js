// hideHandler —— 单卡片判定与隐藏执行（v6.2 字段化匹配，v6.8 判定上下文参数化）。
// 契约 (itemNode, texts, method, durationSelector, contextCategory?)。
// contextCategory 为词条判定的作用域上下文（未匹配页面为 'global'，v6.8）；
// 缺省时按当前 URL 现算（向后兼容）。
// 判定：enable 门控 → 屏蔽词 decide（字段化文本）→ 时长词条兜底 → hideOperation（false 时解除）。
// 返回 hideStatus，供 hide-event 按轮统计命中数。
import { decide } from "./decide.js";
import { categoryFor } from "./category.js";
import { findDurationSeconds, decideDurationEntries } from "./duration.js";
import { hideOperation } from "../dom/hide-operation.js";

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>> }} deps
 * @returns {(itemNode, texts: ReadonlyArray<string>, method?: number, durationSelector?: string, contextCategory?: string | null) => boolean}
 */
export function createHideHandler(deps) {
  return function hideHandler(
    itemNode,
    texts,
    method = 0,
    durationSelector = "",
    contextCategory,
  ) {
    const config = deps.getConfig();
    const category = contextCategory ?? categoryFor(location.href);
    let hideStatus = false;
    if (config.enable) {
      hideStatus = decide(config, category, { texts });
      if (!hideStatus && config.durations.length > 0) {
        const probe = Array.isArray(itemNode)
          ? itemNode.find(Boolean)
          : itemNode;
        hideStatus = decideDurationEntries(
          config.durations,
          findDurationSeconds(probe, durationSelector),
          category,
        );
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
