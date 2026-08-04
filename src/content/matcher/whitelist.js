// isWhitelist —— 白名单判定。逐字移植 target.js 1067–1074。
// 白名单优先级最高：hideHandler 判定阶梯中先于用户名与文本判定。

/**
 * @param {Readonly<Record<string, unknown>>} config
 * @param {string | null | undefined} username
 * @returns {boolean}
 */
export function isWhitelist(config, username) {
  if (username && config.functionEnable && config.whitelistEnable) {
    if (config.whitelistArray.includes(username)) {
      return true;
    }
  }
  return false;
}
