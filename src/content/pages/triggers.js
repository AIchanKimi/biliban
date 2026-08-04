// 页面交互触发器。逐字移植 target.js 723–783。
// 首页轮播「换一换」/ 漫画面板切换 / 直播全部页 tab 点击后延时重跑 hideEvent。
import { WWW_HOME_RE, LIVE_ALL_RE, HOMEPAGE_CLICK_DELAY_MS, PANEL_TRIGGER_DELAY_MS } from '../constants.js';
import { arrive } from '../dom/arrive.js';

/**
 * @param {{ oldUrl: string, hideEvent: () => void }} deps
 */
export function initPageTriggers(deps) {
  const { oldUrl, hideEvent } = deps;

  if (WWW_HOME_RE.test(oldUrl)) {
    const nextBtn = document.querySelector('.btn.next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        setTimeout(() => {
          hideEvent();
        }, HOMEPAGE_CLICK_DELAY_MS);
      });
    }
    const prevBtn = document.querySelector('.btn.prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        setTimeout(() => {
          hideEvent();
        }, HOMEPAGE_CLICK_DELAY_MS);
      });
    }
    arrive(
      document.body,
      '.manga-panel .btn-change',
      { fireOnAttributesModification: true, onceOnly: true, existing: true },
      item => {
        item.addEventListener('click', () => {
          setTimeout(() => {
            hideEvent();
          }, PANEL_TRIGGER_DELAY_MS);
        });
      }
    );
    arrive(
      document.body,
      '.manga-panel .tab-switch-item',
      { fireOnAttributesModification: true, onceOnly: true, existing: true },
      item => {
        item.addEventListener('click', () => {
          setTimeout(() => {
            hideEvent();
          }, PANEL_TRIGGER_DELAY_MS);
        });
      }
    );
  }
  if (LIVE_ALL_RE.test(oldUrl)) {
    arrive(
      document.body,
      '.content-panel h1.title > span',
      { fireOnAttributesModification: true, onceOnly: true, existing: true },
      item => {
        item.addEventListener('click', () => {
          setTimeout(() => {
            hideEvent();
          }, PANEL_TRIGGER_DELAY_MS);
        });
      }
    );
  }
}
