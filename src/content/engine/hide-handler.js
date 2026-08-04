// hideHandler —— 单卡片判定与隐藏执行。逐字移植 target.js 1075–1129 + displayDel 785–794。
// 判定阶梯：白名单（永远不屏蔽）→ 用户名 → 文本。
// 自动删除：消息中心被屏蔽的回复通知可代点删除按钮（一次性、计数上屏）。
import { isWhitelist } from '../matcher/whitelist.js';
import { decideUsername } from '../matcher/decide-username.js';
import { decideText } from '../matcher/decide-text.js';
import { hideOperation } from '../dom/hide-operation.js';

const MESSAGE_DEL_PANEL_ID = 'messageDelPanel';

/**
 * displayDel —— 消息中心顶部删除计数提示（对等 target.js 785–794）。
 * @param {string} panelId
 * @param {number} num
 */
export function displayDel(panelId, num) {
  if (document.getElementById(panelId)) {
    document.getElementById(panelId).textContent = ' (自动删除了 ' + num + ' 条通知)';
  } else {
    const delPanel = document.createElement('span');
    delPanel.id = panelId;
    delPanel.textContent = ' (自动删除了 ' + num + ' 条通知)';
    document.querySelector('.space-right-top .title').appendChild(delPanel);
  }
}

/**
 * @param {{ getConfig: () => Readonly<Record<string, unknown>> }} deps
 * @returns {(itemNode, username, textValue, method?, type?) => void}
 */
export function createHideHandler(deps) {
  const recordButton = new Set();
  let delNum = 0;

  return function hideHandler(itemNode, username, textValue, method = 0, type = {}) {
    if (username) {
      if (typeof username === 'object') {
        username = username.textContent;
      }
      username = username.trim();
    }
    if (textValue) {
      if (typeof textValue === 'object') {
        textValue = textValue.textContent;
      }
      textValue = textValue.trim();
    }
    const isComment = type.comment ? true : false;
    const isMessageReply = type.messageReply ? true : false;
    const delButton = type.delButton ? type.delButton : null;
    const isLive = type.live ? true : false;
    const isPic = type.pic ? true : false;
    const trueLove = type.trueLove ? type.trueLove.trim() : null;
    const dynamic = type.dynamic != null && typeof type.dynamic === 'object' ? type.dynamic : null;
    const dynamicVideo = type.dynamicVideo ? type.dynamicVideo.trim() : null;
    const repost = type.repost != null && typeof type.repost === 'object' ? type.repost : null;
    const repostUser = type.repostUser ? type.repostUser.trim() : null;
    const sourceText = type.sourceText ? type.sourceText : null;
    const config = deps.getConfig();
    let hideStatus = false;
    if (isWhitelist(config, username)) {
      hideStatus = false;
    } else if (
      decideUsername(config, username, { isComment, isLive, isPic, isMessageReply, trueLove, repostUser })
    ) {
      hideStatus = true;
    } else if (
      decideText(config, textValue, { isComment, isLive, isPic, sourceText, isMessageReply, dynamicVideo, dynamic, repost })
    ) {
      hideStatus = true;
    } else {
      hideStatus = false;
    }
    if (Array.isArray(itemNode)) {
      for (const eleNode of itemNode) {
        if (eleNode) {
          hideOperation(eleNode, hideStatus, method);
        }
      }
    } else {
      hideOperation(itemNode, hideStatus, method);
    }
    if (hideStatus) {
      if (delButton) {
        if (config.messageReplyDelEnable && !recordButton.has(delButton)) {
          recordButton.add(delButton);
          delButton.click();
          console.info('%c自动删除通知:', 'color: purple;', '\n用户名:', username, '\n评论内容:', textValue);
          delNum++;
          displayDel(MESSAGE_DEL_PANEL_ID, delNum);
        }
      }
    }
  };
}
