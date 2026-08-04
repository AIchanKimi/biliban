// URL 门控（纯函数）。逐字对等 target.js 1150–1163 与页面分支顺序 1181→1334。
import { DYNAMIC_PAGES_RE, MESSAGE_REPLY_RE, LIVE_ROOM_RE } from '../constants.js';

/**
 * 规则是否作用于当前 URL。
 * 无 url 字段的规则仅在 www.bilibili.com 生效；数组 url 任一 indexOf 命中即可
 * （含裸 'bilibili.com' 匹配全部子域的语义）。
 * @param {Readonly<{ url?: string | string[] }>} rule
 * @param {string} oldUrl 页面加载时捕获的 location.href
 * @returns {boolean}
 */
export function ruleMatchesUrl(rule, oldUrl) {
  if (rule.url == null) {
    return oldUrl.indexOf('www.bilibili.com') !== -1;
  }
  const urls = Array.isArray(rule.url) ? rule.url : [rule.url];
  return urls.some(u => oldUrl.indexOf(u) !== -1);
}

/**
 * hideEvent 的页面特殊分支（顺序对等 target.js：www → 动态页 → 消息中心 → 直播间）。
 * @param {string} oldUrl
 * @returns {'www' | 'dynamics' | 'message' | 'live' | null}
 */
export function pageBranchFor(oldUrl) {
  if (oldUrl.indexOf('www.bilibili.com') !== -1) {
    return 'www';
  }
  if (DYNAMIC_PAGES_RE.test(oldUrl)) {
    return 'dynamics';
  }
  if (MESSAGE_REPLY_RE.test(oldUrl)) {
    return 'message';
  }
  if (LIVE_ROOM_RE.test(oldUrl)) {
    return 'live';
  }
  return null;
}
