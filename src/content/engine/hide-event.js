// hideEvent —— 屏蔽执行总编排（v6.1 纯文字匹配）。
// 实时页面分类 → 规则统一循环（内置已在存储层并入 config.rules）：
//   mode:'hide'  直接隐藏（禁用时解除）；
//   mode:'match' 文字选择器提取文本 → hideHandler（屏蔽词 + 时长词条）。
// 命中统计（rule-stats）按轮覆盖写：每条规则记录本轮「匹配到几个 / 屏蔽了几个」，
// 面板徽标因此反映当前页面状态，稳定不累加。
import { categoryFor } from './category.js';
import { setRuleStats } from './rule-stats.js';
import { scopesApply } from '../config/scopes.js';
import { extractEle } from '../dom/extract-ele.js';
import { hideOperation } from '../dom/hide-operation.js';

/**
 * @param {{
 *   getConfig: () => Readonly<Record<string, unknown>>,  // 运行时有效配置（含临时词条与自定义规则）
 *   hideHandler: (itemNode, username, textValue, method?) => boolean,
 * }} deps
 * @returns {() => void}
 */
export function createHideEvent(deps) {
  const { getConfig, hideHandler } = deps;

  return function hideEvent() {
    const config = getConfig();
    const category = categoryFor(location.href);
    if (!category) {
      return;
    }
    // 内置规则优先取用户持久化版本（面板编辑/删除后写回）；从未编辑过则用代码默认
    // v6.1：内置规则已在存储层并入 config.rules（normalize/migrate 播种与合并）
    for (const rule of config.rules ?? []) {
      const enabled = rule.enabled !== false;
      if (!scopesApply(rule.scopes, category)) {
        continue;
      }
      let all;
      try {
        all = document.querySelectorAll(rule.selector);
      } catch (e) {
        console.error('[bilibili_block] 选择器执行失败: ', rule.selector, e);
        continue;
      }
      let hiddenCount = 0;
      for (const ele of all) {
        try {
          if (rule.mode === 'hide') {
            hideOperation(ele, enabled, rule.method ?? 0);
            if (enabled) {
              hiddenCount++;
            }
            continue;
          }
          // 禁用的 match 规则：跳过判定，但须解除其已施加的隐藏（保存后立即生效，无需刷新）
          if (!enabled) {
            hideOperation(ele, false, rule.method ?? 0);
            continue;
          }
          // 文字选择器数组逐个提取，拼接后交给屏蔽词匹配
          const texts = [];
          for (const textSelector of rule.textSelectors ?? []) {
            const textEl = extractEle(ele, textSelector);
            if (textEl) {
              texts.push(textEl.textContent);
            }
          }
          const joined = texts.length > 0 ? texts.join('\n') : null;
          if (hideHandler(ele, null, joined, rule.method ?? 0, rule.durationSelector ?? '')) {
            hiddenCount++;
          }
        } catch (e) {
          console.error('[bilibili_block] 元素处理失败: ', rule.selector, e);
        }
      }
      setRuleStats(rule.id, all.length, hiddenCount);
    }
  };
}
