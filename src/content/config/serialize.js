// 正则序列化：存储中一律为 '/pattern/flags' 字符串，读取时按需重建 RegExp。
// 对等 Block_Obj v3.0.3 getConfig()/convertArray 行为。
import { REG_CONVERSION_KEYS } from './defaults.js';

// 正则字面量形式识别（Block_Obj 全局使用同一模式）
export const REGEX_LITERAL_RE = /^\/.+\/[a-z]*$/i;

/**
 * 从 '/pattern/flags' 字符串解析出 pattern 与 flags。
 * @param {string} text
 * @returns {{ pattern: string, flags: string } | null}
 */
export function parseRegexLiteral(text) {
  if (typeof text !== 'string' || !REGEX_LITERAL_RE.test(text)) {
    return null;
  }
  const pattern = text.replace(/^\/|\/[a-z]*$/gi, '');
  const flags = text.replace(/^\/.*\/[^a-z]*/i, '');
  return { pattern, flags };
}

/**
 * 读取时转换：仅对 REG_CONVERSION_KEYS 中的 key，将正则字面量字符串重建为 RegExp。
 * 非法正则 console.error 后静默跳过（对等 Block_Obj 行为与脚本 4.6.2 修复）。
 * 返回新数组（string | RegExp 混合），不修改入参。
 * @param {ReadonlyArray<string>} list
 * @param {string} key 配置字段名
 * @returns {Array<string | RegExp>}
 */
export function toRuntimeValue(list, key) {
  const source = Array.isArray(list) ? list : [];
  if (!REG_CONVERSION_KEYS.includes(key)) {
    return [...source];
  }
  const result = [];
  for (const item of source) {
    const parsed = parseRegexLiteral(item);
    if (parsed) {
      try {
        result.push(new RegExp(parsed.pattern, parsed.flags));
      } catch (error) {
        console.error('存在错误的正则表达式: ', error);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * 写入时转换：RegExp 实例 → '/source/flags' 字符串；字符串原样。返回新数组。
 * @param {ReadonlyArray<string | RegExp>} list
 * @returns {string[]}
 */
export function toStorageValue(list) {
  const source = Array.isArray(list) ? list : [];
  return source.map(item => (item instanceof RegExp ? `/${item.source}/${item.flags}` : item));
}
