// decide —— 词条判定（v5 纯函数）。
// 用户名精确相等（trim 后，'/re/' 按字面串）；关键字字符串 includes；关键字 RegExp 走 match。
// 词条先按作用域过滤（global 或当前分类）。总开关关闭时全不屏蔽。

import { scopesApply } from '../config/scopes.js';

/**
 * @param {Readonly<{ enable: boolean, usernames: ReadonlyArray<{ value: string, scopes: ReadonlyArray<string> }>, keywords: ReadonlyArray<{ value: string | RegExp, scopes: ReadonlyArray<string> }> }>} config 运行时有效配置（含临时词条合并）
 * @param {string | null} category categoryFor 结果
 * @param {{ username?: string | null, title?: string | null }} text
 * @returns {boolean}
 */
export function decide(config, category, text = {}) {
  if (!config.enable) {
    return false;
  }
  const username = typeof text.username === 'string' ? text.username.trim() : '';
  if (username) {
    for (const entry of config.usernames) {
      if (scopesApply(entry.scopes, category) && entry.value === username) {
        return true;
      }
    }
  }
  const title = typeof text.title === 'string' ? text.title.trim() : '';
  if (title) {
    for (const entry of config.keywords) {
      if (!scopesApply(entry.scopes, category)) {
        continue;
      }
      if (entry.value instanceof RegExp) {
        // match 而非 test：规避 /g 标志的 lastIndex 状态污染
        if (title.match(entry.value)) {
          return true;
        }
      } else if (typeof entry.value === 'string' && entry.value !== '' && title.includes(entry.value)) {
        return true;
      }
    }
  }
  return false;
}
