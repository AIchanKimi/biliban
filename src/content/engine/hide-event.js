// hideEvent —— 屏蔽执行总编排（v5）。
// 实时页面分类（SPA 修复）→ 内置 + 自定义规则统一循环：
//   mode:'hide'  直接隐藏（禁用时解除）；resolve:'bv' 走异步查询；
//   mode:'match' 提取用户名/标题 → hideHandler（词条判定 + 时长兜底）。
import { BUILTIN_RULES } from '../rules/builtin-rules.js';
import { categoryFor } from './category.js';
import { scopesApply } from '../config/scopes.js';
import { extractEle } from '../dom/extract-ele.js';
import { getBvNumber } from '../dom/bv.js';
import { hideOperation } from '../dom/hide-operation.js';

/**
 * @param {{
 *   getConfig: () => Readonly<Record<string, unknown>>,  // 运行时有效配置（含临时词条与自定义规则）
 *   hideHandler: (itemNode, username, textValue, method?) => void,
 *   resolveUsername: (bvNum: string | null, ele: Element, textEle: Element | null) => void,
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
      for (const ele of all) {
        try {
          if (rule.mode === 'hide') {
            hideOperation(ele, enabled, rule.method ?? 0);
            continue;
          }
          if (rule.resolve === 'bv') {
            const link = rule.bvSelector ? ele.querySelector(rule.bvSelector) : null;
            if (link) {
              resolveUsername(getBvNumber(link.href), ele, extractEle(ele, rule.titleSelector));
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
          hideHandler(ele, username, titleEl, rule.method ?? 0);
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
