// www.bilibili.com 特殊逻辑。逐字移植 target.js 1181–1252。
// 轮播图三联隐藏（method 3 inline visibility）、排行榜、热门、播放器推荐、片尾推荐。
import { getBvNumber, extractDataBvid } from '../dom/bv.js';

/**
 * @param {{ hideHandler: Function, resolveUsername: Function }} deps
 * @returns {{ run: () => void }}
 */
export function createWwwPage(deps) {
  const { hideHandler, resolveUsername } = deps;

  function run() {
    try {
      const carouselModulePanel = document.querySelector('.carousel-module .panel');
      if (carouselModulePanel) {
        const carouselModulePanelTitle = carouselModulePanel.querySelectorAll('ul.title a');
        const carouselModulePanelPic = carouselModulePanel.querySelectorAll('ul.pic li');
        const carouselModulePanelTrig = carouselModulePanel.querySelectorAll('ul.trig span');
        for (let panelIndex = 0; panelIndex < carouselModulePanelTitle.length; panelIndex++) {
          hideHandler(
            [carouselModulePanelTitle[panelIndex], carouselModulePanelPic[panelIndex], carouselModulePanelTrig[panelIndex]],
            null,
            carouselModulePanelTitle[panelIndex],
            3
          );
        }
      }
    } catch (e) {
      console.error('bilibili_BLock: Variable carouselModulePanel is error.');
      console.error(e);
    }
    const rankItem = document.getElementsByClassName('rank-item');
    for (const rankItemEle of rankItem) {
      let textValue = '';
      if (rankItemEle.querySelector('p.ri-title')) {
        textValue = rankItemEle.querySelector('p.ri-title');
      }
      if (rankItemEle.querySelector('a.title')) {
        textValue = rankItemEle.querySelector('a.title');
      }
      if (rankItemEle.querySelector('.detail > a')) {
        hideHandler(rankItemEle, rankItemEle.querySelector('.detail > a'), textValue);
      } else if (rankItemEle.querySelector('a')) {
        const linkA = rankItemEle.querySelector('a');
        const bvNum = getBvNumber(linkA.href);
        resolveUsername(bvNum, rankItemEle, textValue);
      }
    }
    const recentHot = document.querySelectorAll('div#recent_hot li');
    for (const recentHotItem of recentHot) {
      const bvNum = getBvNumber(recentHotItem.querySelector('a').href);
      resolveUsername(bvNum, recentHotItem, recentHotItem.title);
    }
    const bilibiliPlayerRecommendVideo = document.getElementsByClassName('bilibili-player-recommend-video');
    for (const bilibiliPlayerRecommendVideoItem of bilibiliPlayerRecommendVideo) {
      const bvNum = getBvNumber(bilibiliPlayerRecommendVideoItem.href);
      resolveUsername(
        bvNum,
        bilibiliPlayerRecommendVideoItem,
        bilibiliPlayerRecommendVideoItem.querySelector('.bilibili-player-recommend-title')
      );
    }
    const bilibiliPlayerEndingPanelBoxRecommend = document.querySelectorAll('a.bilibili-player-ending-panel-box-recommend');
    for (const bilibiliPlayerEndingPanelBoxRecommendItem of bilibiliPlayerEndingPanelBoxRecommend) {
      let bvNum = extractDataBvid(bilibiliPlayerEndingPanelBoxRecommendItem.getAttribute('data-bvid'));
      if (!bvNum) {
        try {
          bvNum = getBvNumber(bilibiliPlayerEndingPanelBoxRecommendItem.href);
        } catch (e) {
          bvNum = null;
        }
      }
      resolveUsername(
        bvNum,
        bilibiliPlayerEndingPanelBoxRecommendItem,
        bilibiliPlayerEndingPanelBoxRecommendItem.querySelector('.bilibili-player-ending-panel-box-recommend-cover-title')
      );
    }
  }

  return { run };
}
