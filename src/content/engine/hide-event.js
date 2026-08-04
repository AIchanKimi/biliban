// hideEvent —— 屏蔽执行总编排。逐字对等 target.js 1146–1343。
// 结构：38 条规则循环（URL 门控）→ 页面特殊分支（www/动态/消息中心/直播间）。
// 文档化改进：每个元素的处理包 try/catch —— 单条坏选择器（如 '> a' 或 :has 不支持）
// 不中止其余元素与后续规则；原脚本会整体中断。
import { HANDLER_RULES } from '../rules/handler-table.js';
import { ruleMatchesUrl, pageBranchFor } from './url-gate.js';
import { extractEle } from '../dom/extract-ele.js';
import { getBvNumber } from '../dom/bv.js';

/**
 * @param {{
 *   oldUrl: string,
 *   hideHandler: Function,
 *   resolveUsername: Function,
 *   pages: { www?: {run():void}, dynamics?: {run():void}, messageReply?: {run():void}, liveChat?: {run():void}, hideComment: () => void },
 * }} deps
 * @returns {() => void}
 */
export function createHideEvent(deps) {
  const { oldUrl, hideHandler, resolveUsername, pages } = deps;

  return function hideEvent() {
    HANDLER_RULES.forEach(item => {
      const { c, index, user, text, method, type, userReg, url, comment, bv } = item;
      if (!ruleMatchesUrl(item, oldUrl)) {
        return;
      }
      let all;
      try {
        all = document.querySelectorAll(index);
      } catch (e) {
        console.error('[bilibili_block] 选择器执行失败: ', index, e);
        return;
      }
      for (const ele of all) {
        try {
          if (c == 1) {
            hideHandler(ele, extractEle(ele, user).textContent.replace(userReg, ''));
          } else if (c == 2) {
            const bvNum = getBvNumber(ele.querySelector(bv).href);
            resolveUsername(bvNum, ele, extractEle(ele, text));
          } else {
            hideHandler(ele, extractEle(ele, user), extractEle(ele, text), method, type);
          }
        } catch (e) {
          console.error('[bilibili_block] 元素处理失败: ', index, e);
        }
      }
      if (comment) {
        pages.hideComment();
      }
    });
    const branch = pageBranchFor(oldUrl);
    if (branch === 'www') {
      pages.www.run();
    } else if (branch === 'dynamics') {
      pages.dynamics.run();
    } else if (branch === 'message') {
      pages.messageReply.run();
    } else if (branch === 'live') {
      pages.liveChat.run();
    }
  };
}
