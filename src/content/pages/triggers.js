// 页面交互触发器（v5 精简）：仅留首页轮播「换一换」/ 翻页按钮点击后延时重跑。
// 实时分类判定（SPA 友好）；轮播切换只改类名不改子树，MutationObserver 覆盖不到。
import { HOMEPAGE_CLICK_DELAY_MS } from '../constants.js';
import { categoryFor } from '../engine/category.js';

/**
 * @param {{ hideEvent: () => void }} deps
 */
export function initPageTriggers(deps) {
  const { hideEvent } = deps;
  if (categoryFor(location.href) !== 'home') {
    return;
  }
  for (const selector of ['.btn.next', '.btn.prev']) {
    const button = document.querySelector(selector);
    if (button) {
      button.addEventListener('click', () => {
        setTimeout(() => {
          hideEvent();
        }, HOMEPAGE_CLICK_DELAY_MS);
      });
    }
  }
}
