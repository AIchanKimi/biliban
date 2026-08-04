// www.bilibili.com 特殊逻辑（v5.5 纯文字匹配）：轮播三联（method 3）+ 排行榜。
// BV→用户名反查已移除：仅有链接、无文字信息的推荐位不再处理。

/**
 * @param {{ hideHandler: (itemNode, username, textValue, method?) => boolean }} deps
 * @returns {{ run: () => void }}
 */
export function createWwwPage(deps) {
  const { hideHandler } = deps;

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
            3 // 轮播三联用 inline visibility（不覆盖 B 站自管样式）
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
      }
    }
  }

  return { run };
}
