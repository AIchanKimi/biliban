// 输入框解析（对等 Block_Obj stringToArray）：
//   - 整体为正则字面量 '/…/flags' 时 → 单元素数组，绝不拆分（正则内可含逗号，对等 4.6.3 修复）
//   - 否则按半角逗号拆分，不 trim（"a, b" → ["a", " b"]），去重保留首次出现
import { REGEX_LITERAL_RE } from '../config/serialize.js';

/**
 * @param {string} textString
 * @returns {string[]}
 */
export function stringToArray(textString) {
  const text = String(textString ?? '');
  if (REGEX_LITERAL_RE.test(text)) {
    return [text];
  }
  const result = [];
  for (const item of text.split(',')) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
