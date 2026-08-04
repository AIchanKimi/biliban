// 评论区屏蔽 + 注入按钮。逐字移植 target.js 1344–1451。
// 主评论（.reply-list .reply-item）与子回复（.sub-reply-item）：
//   - 按用户名/内容/粉丝勋章屏蔽
//   - showBlockUserBtnEnable：在回复按钮后注入「屏蔽」按钮（点击秒屏蔽该用户）
//   - showBangBtnEnable：注入「爆炸」按钮（拆字选择屏蔽）
//   - 开关关闭时移除已注入按钮
// 锚点顺序：block 按钮存在则 bang 挂其后，否则挂回复按钮后。
import { getConvertText } from '../matcher/convert-text.js';
import {
  COMMENT_BLOCK_BTN_CLASS,
  REPLY_BLOCK_BTN_CLASS,
  COMMENT_BANG_BTN_CLASS,
  REPLY_BANG_BTN_CLASS,
} from '../constants.js';

/**
 * @param {{
 *   getConfig: () => Readonly<Record<string, unknown>>,
 *   hideHandler: Function,
 *   createBlockBtn: Function,
 *   createBigBangBtn: Function,
 * }} deps
 * @returns {() => void}
 */
export function createHideComment(deps) {
  const { getConfig, hideHandler, createBlockBtn, createBigBangBtn } = deps;

  return function hideComment() {
    const commentList = document.querySelectorAll('.reply-list .reply-item');
    for (const commentListItem of commentList) {
      const replyContent = commentListItem.querySelector('.reply-content');
      if (!replyContent) {
        continue;
      }
      const sourceText = replyContent.textContent;
      let trueLove = commentListItem.querySelector('.badge-name-wrap');
      trueLove = trueLove ? trueLove.firstChild.textContent : null;
      if (getConfig().convertEmojiEnable) {
        const convertText = getConvertText(replyContent.innerHTML);
        hideHandler(commentListItem, commentListItem.querySelector('.user-name'), convertText, 0, {
          comment: true,
          sourceText: sourceText,
          trueLove,
        });
      } else {
        hideHandler(commentListItem, commentListItem.querySelector('.user-name'), sourceText, 0, {
          comment: true,
          trueLove,
        });
      }
      const commentReplyBtn = commentListItem.querySelector('.reply-btn');
      if (getConfig().showBlockUserBtnEnable) {
        const userNameEl = commentListItem.querySelector('.user-name');
        commentReplyBtn &&
          !commentListItem.querySelector('.' + COMMENT_BLOCK_BTN_CLASS) &&
          userNameEl &&
          commentReplyBtn.after(
            createBlockBtn(
              userNameEl.textContent,
              'usernameArray',
              COMMENT_BLOCK_BTN_CLASS,
              'span',
              '屏蔽',
              '屏蔽该用户'
            )
          );
      } else {
        commentListItem.querySelector('.' + COMMENT_BLOCK_BTN_CLASS) &&
          commentListItem.querySelector('.' + COMMENT_BLOCK_BTN_CLASS).remove();
      }
      if (getConfig().showBangBtnEnable) {
        const commentBtn = commentListItem.querySelector('.' + COMMENT_BLOCK_BTN_CLASS) || commentReplyBtn;
        commentBtn &&
          !commentListItem.querySelector('.' + COMMENT_BANG_BTN_CLASS) &&
          commentBtn.after(
            createBigBangBtn(
              sourceText,
              'commentArray',
              COMMENT_BANG_BTN_CLASS,
              'span',
              '爆炸',
              '拆分并选择文本内容进行屏蔽'
            )
          );
      } else {
        commentListItem.querySelector('.' + COMMENT_BANG_BTN_CLASS) &&
          commentListItem.querySelector('.' + COMMENT_BANG_BTN_CLASS).remove();
      }
    }
    const replyCommentList = document.querySelectorAll('.reply-item .sub-reply-item');
    for (const replyCommentListItem of replyCommentList) {
      const replyContent = replyCommentListItem.querySelector('.reply-content');
      if (!replyContent) {
        continue;
      }
      const replySourceText = replyContent.textContent;
      if (getConfig().convertEmojiEnable) {
        const replyConvertText = getConvertText(replyContent.innerHTML);
        hideHandler(replyCommentListItem, replyCommentListItem.querySelector('.sub-user-name'), replyConvertText, 0, {
          comment: true,
          sourceText: replySourceText,
        });
      } else {
        hideHandler(replyCommentListItem, replyCommentListItem.querySelector('.sub-user-name'), replySourceText, 0, {
          comment: true,
        });
      }
      const replyBtn = replyCommentListItem.querySelector('.sub-reply-btn');
      if (getConfig().showBlockUserBtnEnable) {
        const subUserNameEl = replyCommentListItem.querySelector('.sub-user-name');
        replyBtn &&
          !replyCommentListItem.querySelector('.' + REPLY_BLOCK_BTN_CLASS) &&
          subUserNameEl &&
          replyBtn.after(
            createBlockBtn(
              subUserNameEl.textContent,
              'usernameArray',
              REPLY_BLOCK_BTN_CLASS,
              'span',
              '屏蔽',
              '屏蔽该用户'
            )
          );
      } else {
        replyCommentListItem.querySelector('.' + REPLY_BLOCK_BTN_CLASS) &&
          replyCommentListItem.querySelector('.' + REPLY_BLOCK_BTN_CLASS).remove();
      }
      if (getConfig().showBangBtnEnable) {
        const pBtn = replyCommentListItem.querySelector('.' + REPLY_BLOCK_BTN_CLASS) || replyBtn;
        pBtn &&
          !replyCommentListItem.querySelector('.' + REPLY_BANG_BTN_CLASS) &&
          pBtn.after(
            createBigBangBtn(
              replySourceText,
              'commentArray',
              REPLY_BANG_BTN_CLASS,
              'span',
              '爆炸',
              '拆分并选择文本内容进行屏蔽'
            )
          );
      } else {
        replyCommentListItem.querySelector('.' + REPLY_BANG_BTN_CLASS) &&
          replyCommentListItem.querySelector('.' + REPLY_BANG_BTN_CLASS).remove();
      }
    }
  };
}
