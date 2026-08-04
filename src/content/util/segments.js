// 大爆炸按钮的纯核心（对等 Block_Obj injectionBigBangPanel / getSelectedText）：
//   - 去除空白（含 &nbsp;）后逐字符拆分，保留原始位置 index
//   - 选中字符按 DOM 顺序收集：连续 index 连接成段，断点处以半角逗号分段
const STRIP_RE = /\s|&nbsp;/gi;

/**
 * @param {string} value 原始文本
 * @returns {Array<{ char: string, index: number }>} index 为去除空白后序列中的位置
 */
export function splitToChars(value) {
  return String(value ?? '')
    .replace(STRIP_RE, '')
    .split('')
    .map((char, index) => ({ char, index }));
}

/**
 * 将选中项连接成屏蔽词：连续 index 连成一段，段间以 ',' 连接。
 * 例：选中 index [0,1,2,5,6]（字符对应 abc…fg）→ 'abc,fg'。
 * @param {Array<{ char: string, index: number }>} selected 任意顺序均可
 * @returns {string}
 */
export function joinSelected(selected) {
  const sorted = [...selected].sort((a, b) => a.index - b.index);
  const segments = [];
  let current = '';
  let previousIndex = Number.NaN;
  for (const { char, index } of sorted) {
    if (current && index !== previousIndex + 1) {
      segments.push(current);
      current = '';
    }
    current += char;
    previousIndex = index;
  }
  if (current) {
    segments.push(current);
  }
  return segments.join(',');
}
