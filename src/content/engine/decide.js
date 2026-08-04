// decide —— 屏蔽词判定（v5.1 统一词条，纯函数）。
// 每个词条同时过标题与 UP主名：
//   普通字符串：标题「包含」匹配；UP主名「精确」匹配（防短词误伤用户名）
//   正则（/pat/flags）：标题与 UP主名都尝试匹配
// 词条先按作用域过滤（global 或当前分类）。总开关关闭时全不屏蔽。

import { scopesApply } from '../config/scopes.js';

/**
 * @param {Readonly<{ enable: boolean, words: ReadonlyArray<{ value: string | RegExp, scopes: ReadonlyArray<string> }> }>} config 运行时有效配置（含临时词条合并）
 * @param {string | null} category categoryFor 结果
 * @param {{ username?: string | null, title?: string | null }} text
 * @returns {boolean}
 */
export function decide(config, category, text = {}) {
  if (!config.enable) {
    return false;
  }
  const username = typeof text.username === 'string' ? text.username.trim() : '';
  const title = typeof text.title === 'string' ? text.title.trim() : '';
  if (!username && !title) {
    return false;
  }
  for (const entry of config.words) {
    if (!scopesApply(entry.scopes, category)) {
      continue;
    }
    if (entry.value instanceof RegExp) {
      // match 而非 test：规避 /g 标志的 lastIndex 状态污染
      if (title && title.match(entry.value)) {
        return true;
      }
      if (username && username.match(entry.value)) {
        return true;
      }
    } else if (typeof entry.value === 'string' && entry.value !== '') {
      if (title && title.includes(entry.value)) {
        return true;
      }
      if (username && username === entry.value) {
        return true;
      }
    }
  }
  return false;
}
