// decide —— 屏蔽词判定（v6.2 字段化匹配，纯函数）。
// 文字选择器提取的各段文本作为独立字段（trim 后）；每个屏蔽词逐字段判定，
// 任一字段命中即屏蔽（OR）：
//   普通词：字段包含该词
//   正则词 /pat/flags：字段 match —— 字段级精确用 /^词$/ 表达
import { scopesApply } from '../config/scopes.js';

/**
 * @param {Readonly<{ enable: boolean, words: ReadonlyArray<{ value: string | RegExp, scopes: ReadonlyArray<string> }> }>} config 运行时有效配置（含临时词条合并）
 * @param {string | null} category categoryFor 结果
 * @param {{ texts?: ReadonlyArray<string | null | undefined> }} fields 各文字选择器提取的原始文本
 * @returns {boolean}
 */
export function decide(config, category, fields = {}) {
  if (!config.enable) {
    return false;
  }
  const texts = (fields.texts ?? [])
    .map(text => (typeof text === 'string' ? text.trim() : ''))
    .filter(text => text !== '');
  if (texts.length === 0) {
    return false;
  }
  for (const entry of config.words) {
    if (!scopesApply(entry.scopes, category)) {
      continue;
    }
    if (entry.value instanceof RegExp) {
      // match 而非 test：规避 /g 标志的 lastIndex 状态污染
      if (texts.some(text => text.match(entry.value))) {
        return true;
      }
    } else if (typeof entry.value === 'string' && entry.value !== '') {
      if (texts.some(text => text.includes(entry.value))) {
        return true;
      }
    }
  }
  return false;
}
