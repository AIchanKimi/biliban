// t / manga / space 动态页特殊逻辑。逐字移植 target.js 1253–1307。
// div.card 动态卡片：正文、标题（视频标题）、转发作者、转发正文；表情转换双分支。
import { getConvertText } from '../matcher/convert-text.js';

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>>, hideHandler: Function, hideComment: () => void }} deps
 * @returns {{ run: () => void }}
 */
export function createDynamicsPage(deps) {
  const { getConfig, hideHandler, hideComment } = deps;

  function run() {
    const card = document.querySelectorAll('div.card');
    for (const cardItem of card) {
      const contentFull = cardItem.querySelector('.content-full');
      let sourceContent = null;
      let convertText = null;
      if (contentFull && !contentFull.closest('.repost')) {
        sourceContent = contentFull.textContent;
        if (getConfig().convertEmojiEnable) {
          convertText = getConvertText(contentFull.innerHTML);
        }
      }
      const title = cardItem.querySelector('.title');
      let titleText = null;
      if (title) {
        titleText = title.textContent;
      }
      let repostUser = cardItem.querySelector('.repost .username');
      repostUser = repostUser ? repostUser.textContent : null;
      let repostSourceText = null;
      let repostConvertText = null;
      const repostContent = cardItem.querySelector('.repost .content-full');
      if (repostContent) {
        repostSourceText = repostContent.textContent;
        if (getConfig().convertEmojiEnable) {
          repostConvertText = getConvertText(repostContent.innerHTML);
        }
      }
      if (getConfig().convertEmojiEnable) {
        hideHandler(cardItem, null, null, 0, {
          dynamicVideo: titleText,
          dynamic: {
            content: convertText,
            sourceContent: sourceContent,
          },
          repostUser,
          repost: {
            content: repostConvertText,
            sourceContent: repostSourceText,
          },
        });
      } else {
        hideHandler(cardItem, null, null, 0, {
          dynamicVideo: titleText,
          dynamic: {
            content: sourceContent,
          },
          repostUser,
          repost: {
            content: repostSourceText,
          },
        });
      }
    }
    hideComment();
  }

  return { run };
}
