// 消息中心「回复我的」特殊逻辑。逐字移植 target.js 1308–1333。
// 注意：此处表情转换使用它自己的贪婪正则（与 getConvertText 并存，对等要求不可合并）。
// 自动删除的簿记（click/计数/上屏）在 hideHandler 内完成。

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>>, hideHandler: Function }} deps
 * @returns {{ run: () => void }}
 */
export function createMessageReplyPage(deps) {
  const { getConfig, hideHandler } = deps;

  function run() {
    const replyItem = document.getElementsByClassName('reply-item');
    for (const replyItemEle of replyItem) {
      let nextNode = null;
      if (replyItemEle.nextElementSibling) {
        if (replyItemEle.nextElementSibling.classList.contains('divider')) {
          nextNode = replyItemEle.nextElementSibling;
        }
      }
      const textEl = replyItemEle.querySelector('.text');
      if (!textEl) {
        continue;
      }
      const sourceText = textEl.textContent;
      if (getConfig().convertEmojiEnable) {
        const spanEl = textEl.querySelector('span');
        const convertText = spanEl ? spanEl.innerHTML.replace(/<img.*alt="(.*)".*>/g, '$1') : sourceText;
        hideHandler([replyItemEle, nextNode], replyItemEle.querySelector('.name-field a'), convertText, 0, {
          comment: true,
          messageReply: true,
          sourceText: sourceText,
          delButton: replyItemEle.querySelector('.bl-button--primary'),
        });
      } else {
        hideHandler([replyItemEle, nextNode], replyItemEle.querySelector('.name-field a'), sourceText, 0, {
          comment: true,
          messageReply: true,
          delButton: replyItemEle.querySelector('.bl-button--primary'),
        });
      }
    }
  }

  return { run };
}
