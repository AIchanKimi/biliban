// 正则序列化 v5：存储中关键字一律为 '/pattern/flags' 字符串，读取时重建 RegExp。
// 仅屏蔽词词条参与转换（v5.1 起用户名已并入屏蔽词）。

// 正则字面量形式识别（Block_Obj 全局使用同一模式）
export const REGEX_LITERAL_RE = /^\/.+\/[a-z]*$/i;

/**
 * 从 '/pattern/flags' 字符串解析出 pattern 与 flags。
 * @param {string} text
 * @returns {{ pattern: string, flags: string } | null}
 */
export function parseRegexLiteral(text) {
  if (typeof text !== "string" || !REGEX_LITERAL_RE.test(text)) {
    return null;
  }
  const pattern = text.replace(/^\/|\/[a-z]*$/gi, "");
  const flags = text.replace(/^\/.*\/[^a-z]*/i, "");
  return { pattern, flags };
}

/**
 * 读取时转换：屏蔽词词条的正则字面量重建为 RegExp。
 * 非法正则 console.error 后跳过该词条（保留 v1 诊断文案与 4.6.2 修复语义）。
 * 返回新数组新对象，不修改入参。
 * @param {ReadonlyArray<{ value: string, scopes: ReadonlyArray<string> }>} entries
 * @returns {Array<{ value: string | RegExp, scopes: string[] }>}
 */
export function toRuntimeWordEntries(entries) {
  const source = Array.isArray(entries) ? entries : [];
  const result = [];
  for (const entry of source) {
    const parsed = parseRegexLiteral(entry.value);
    if (parsed) {
      try {
        result.push({
          value: new RegExp(parsed.pattern, parsed.flags),
          scopes: [...entry.scopes],
        });
      } catch (error) {
        console.error("存在错误的正则表达式: ", error);
      }
    } else {
      result.push({ value: entry.value, scopes: [...entry.scopes] });
    }
  }
  return result;
}

/**
 * 写入时转换：RegExp 实例 → '/source/flags' 字符串；字符串原样。返回新数组新对象。
 * @param {ReadonlyArray<{ value: string | RegExp, scopes: ReadonlyArray<string> }>} entries
 * @returns {Array<{ value: string, scopes: string[] }>}
 */
export function toStorageWordEntries(entries) {
  const source = Array.isArray(entries) ? entries : [];
  return source.map((entry) => ({
    value:
      entry.value instanceof RegExp
        ? `/${entry.value.source}/${entry.value.flags}`
        : entry.value,
    scopes: [...entry.scopes],
  }));
}
