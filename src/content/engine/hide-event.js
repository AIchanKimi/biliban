// hideEvent —— 屏蔽执行总编排（v5.2）。
// 实时页面分类 → 内置 + 自定义规则统一循环：
//   mode:'hide'  直接隐藏（禁用时解除）；resolve:'bv' 走异步查询；
//   mode:'match' 提取用户名/标题 → hideHandler（屏蔽词 + 时长词条）。
// 每轮记录命中统计（rule-stats）：选择器找到几个元素、最终隐藏几个。
import { BUILTIN_RULES } from '../rules/builtin-rules.js';
import { categoryFor } from './category.js';
import { recordRuleFound, recordRuleHidden as recordRuleHiddenDirect } from './rule-stats.js';
import { scopesApply } from '../config/scopes.js';
import { extractEle } from '../dom/extract-ele.js';
import { getBvNumber } from '../dom/bv.js';
import { hideOperation } from '../dom/hide-operation.js';

/**
 * @param {{
 *   getConfig: () => Readonly<Record<string, unknown>>,  // 运行时有效配置（含临时词条与自定义规则）
 *   hideHandler: (itemNode, username, textValue, method?, ruleId?) => void,
 *   resolveUsername: (bvNum, ele, textEle, ruleId?) => void,
 *   homeExtra: { run: () => void },
 * }} deps
 * @returns {() => void}
 */
export function createHideEvent(deps) {
  const { getConfig, hideHandler, resolveUsername, homeExtra } = deps;

  return function hideEvent() {
    const config = getConfig();
    const category = categoryFor(location.href);
    if (!category) {
      return;
    }
    const rules = [...BUILTIN_RULES, ...(config.rules ?? [])];
    for (const rule of rules) {
      const enabled = rule.enabled !== false;
      // mode:'hide' 禁用时仍需执行以解除已施加的隐藏
      if (!enabled && rule.mode !== 'hide') {
        continue;
      }
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
      recordRuleFound(rule.id, all.length);
      for (const ele of all) {
        try {
          if (rule.mode === 'hide') {
            hideOperation(ele, enabled, rule.method ?? 0);
            if (enabled) {
              recordRuleHiddenDirect(rule.id);
            }
            continue;
          }
          if (rule.resolve === 'bv') {
            const link = rule.bvSelector ? ele.querySelector(rule.bvSelector) : null;
            if (link) {
              resolveUsername(getBvNumber(link.href), ele, extractEle(ele, rule.titleSelector), rule.id);
            }
            continue;
          }
          let username = null;
          if (rule.userSelector) {
            const userEl = extractEle(ele, rule.userSelector);
            if (userEl) {
              username = rule.userReg ? userEl.textContent.replace(rule.userReg, '') : userEl;
            }
          }
          const titleEl = rule.titleSelector ? extractEle(ele, rule.titleSelector) : null;
          hideHandler(ele, username, titleEl, rule.method ?? 0, rule.id);
        } catch (e) {
          console.error('[bilibili_block] 元素处理失败: ', rule.selector, e);
        }
      }
    }
    if (category === 'home' || category === 'video') {
      homeExtra.run();
    }
  };
}
