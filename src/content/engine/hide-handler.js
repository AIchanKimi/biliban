// hideHandler —— 单卡片判定与隐藏执行（v6.2 字段化匹配）。
// 契约 (itemNode, texts, method, durationSelector)。
// 判定：enable 门控 → 屏蔽词 decide（字段化文本）→ 时长词条兜底 → hideOperation（false 时解除）。
// 返回 hideStatus，供 hide-event 按轮统计命中数。
import { decide } from "./decide.js";
import { categoryFor } from "./category.js";
import { findDurationSeconds, decideDurationEntries } from "./duration.js";
import { hideOperation } from "../dom/hide-operation.js";

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>> }} deps
 * @returns {(itemNode, texts: ReadonlyArray<string>, method?: number, durationSelector?: string) => boolean}
 */
export function createHideHandler(deps) {
  return function hideHandler(
    itemNode,
    texts,
    method = 0,
    durationSelector = "",
  ) {
    const config = deps.getConfig();
    const category = categoryFor(location.href);
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
