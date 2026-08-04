// getConvertText —— 表情转文字（对等 target.js 1452–1457）。
// 判定时将 b 站内置表情包 <img alt="[xx]"> 转成标识文字，链接转内文，&nbsp; 转空格。
// 注意：消息中心页面使用它自己的贪婪正则（pages/message-reply.js），两者并存，不可合并。

/**
 * @param {string} text HTML 片段
 * @returns {string}
 */
export function getConvertText(text) {
  return text
    .replace(/<img.*?alt="(.*?)".*?>/g, '$1')
    .replace(/<a.*?>(.*?)<\/\s*a>/g, '$1')
    .replace(/&nbsp;/g, ' ');
}
