// 输入框解析（v6.7：逐字符扫描，只拆分正则字面量之外的逗号）：
//   - 段首 '/' 视为正则字面量开始，扫描至闭合 '/' 及修饰符（支持 \/ 转义），期间逗号不拆分
//     （对等 4.6.3 修复：正则内逗号；v6.7 修复：多个正则逗号相连被整体误判为单个正则）
//   - 其余按半角逗号拆分，不 trim（"a, b" → ["a", " b"]），去重保留首次出现

const FLAG_RE = /[a-z]/i;

/**
 * @param {string} textString
 * @returns {string[]}
 */
export function stringToArray(textString) {
  const text = String(textString ?? "");
  const parts = [];
  let current = "";
  let inRegex = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inRegex) {
      current += ch;
      if (ch === "\\") {
        if (i + 1 < text.length) {
          current += text[++i];
        }
      } else if (ch === "/") {
        inRegex = false;
        while (i + 1 < text.length && FLAG_RE.test(text[i + 1])) {
          current += text[++i]; // 闭合 / 后的修饰符（i/g/m…）
        }
      }
      continue;
    }
    if (ch === "/" && current.trim() === "") {
      inRegex = true;
      current += ch;
      continue;
    }
    if (ch === ",") {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);

  const result = [];
  for (const item of parts) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
