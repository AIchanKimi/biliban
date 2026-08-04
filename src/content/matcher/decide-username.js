// decideUsername —— 按用户名判定是否屏蔽。
// 逐字移植 target.js 1009–1066。
// 要点：
//   - 评论按用户名屏蔽走 commentEnable（消息回复再叠 messageReplyEnable）
//   - 直播/相薄各需 liveEnable/picEnable + usernameEnable
//   - trueLove（粉丝勋章）路径仅由 commentFans 门控，独立于上面的 isDecide
//   - repostUser（转发原作者）路径仅由 dynamicVideo 门控

/**
 * @param {Readonly<Record<string, unknown>>} config
 * @param {string | null | undefined} username
 * @param {{
 *   isComment?: boolean, isLive?: boolean, isPic?: boolean,
 *   isMessageReply?: boolean, trueLove?: string | null, repostUser?: string | null,
 * }} options
 * @returns {boolean}
 */
export function decideUsername(config, username, options = {}) {
  const {
    isComment = false,
    isLive = false,
    isPic = false,
    isMessageReply = false,
    trueLove = null,
    repostUser = null,
  } = options;

  let isDecide = false;
  if (config.functionEnable && username) {
    if (isComment) {
      if (config.commentEnable) {
        if (isMessageReply) {
          if (config.messageReplyEnable) {
            isDecide = true;
          }
        } else {
          isDecide = true;
        }
      }
    } else if (isLive) {
      if (config.liveEnable) {
        if (config.usernameEnable) {
          isDecide = true;
        }
      }
    } else if (isPic) {
      if (config.picEnable) {
        if (config.usernameEnable) {
          isDecide = true;
        }
      }
    } else {
      if (config.usernameEnable) {
        isDecide = true;
      }
    }
  }
  if (isDecide) {
    if (config.usernameArray.includes(username)) {
      return true;
    }
  }
  if (config.functionEnable) {
    if (config.commentFans && trueLove) {
      if (config.usernameArray.includes(trueLove)) {
        return true;
      }
    }
    if (config.dynamicVideo && repostUser) {
      if (config.usernameArray.includes(repostUser)) {
        return true;
      }
    }
  }
  return false;
}
