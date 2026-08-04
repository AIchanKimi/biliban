// 列表 chip 渲染与真值提取。对等 Block_Obj createListItem / insertList / extractList：
//   - afterbegin 插入 ⇒ DOM 顺序 = 数组逆序
//   - 超过 9 字符截断显示 'abc ... xyz'，完整值仅此时写入 title（title 即真值）
//   - 正则字面量形式显绿色；每个 chip 带 'X' 删除钮
import { CHIP_CLASS, CHIP_TEXT_CLASS, CHIP_GREEN_CLASS, CHIP_DEL_CLASS, CHIP_TRUNCATE_LIMIT } from '../constants.js';
import { REGEX_LITERAL_RE } from '../config/serialize.js';
import { recoverListValues } from '../util/list-order.js';

/**
 * 创建单个 chip（对等 createListItem）。
 * @param {string} value
 * @returns {HTMLElement}
 */
export function createChip(value) {
  const childSpan = document.createElement('span');
  childSpan.className = CHIP_CLASS;
  const textSpan = document.createElement('span');
  textSpan.className = REGEX_LITERAL_RE.test(value) ? `${CHIP_TEXT_CLASS} ${CHIP_GREEN_CLASS}` : CHIP_TEXT_CLASS;
  textSpan.textContent =
    value.length > CHIP_TRUNCATE_LIMIT
      ? value.slice(0, 3) + ' ... ' + value.slice(-3)
      : value;
  if (value.length > CHIP_TRUNCATE_LIMIT) {
    textSpan.title = value;
  }
  const delSpan = document.createElement('span');
  delSpan.textContent = 'X';
  delSpan.title = '移除';
  delSpan.className = CHIP_DEL_CLASS;
  delSpan.addEventListener('click', () => childSpan.remove());
  childSpan.appendChild(textSpan);
  childSpan.appendChild(delSpan);
  return childSpan;
}

/**
 * 用数组顺序播种列表（依次 afterbegin ⇒ DOM 为逆序，对等 insertList）。
 * falsy 项跳过（对等 `item && insertAdjacentElement`）。
 * @param {HTMLElement} listEl
 * @param {ReadonlyArray<string>} values
 */
export function seedList(listEl, values) {
  for (const item of values ?? []) {
    if (item) {
      listEl.insertAdjacentElement('afterbegin', createChip(item));
    }
  }
}

/**
 * 从列表 DOM 恢复数组（保存时真值来源，对等 extractList：逆序 + title || textContent）。
 * @param {HTMLElement} listEl
 * @returns {string[]}
 */
export function extractListFromEl(listEl) {
  const textNodes = [...listEl.getElementsByClassName(CHIP_TEXT_CLASS)].map(el => ({
    title: el.title,
    textContent: el.textContent,
  }));
  return recoverListValues(textNodes);
}

/**
 * 去重前置插入（对等 addListItem 的 `!saveArr.includes(item) && insert`）。
 * @param {HTMLElement} listEl
 * @param {ReadonlyArray<string>} values
 */
export function prependUnique(listEl, values) {
  const existing = extractListFromEl(listEl);
  for (const item of values) {
    if (!existing.includes(item)) {
      listEl.insertAdjacentElement('afterbegin', createChip(item));
      existing.push(item);
    }
  }
}

/**
 * 按值删除 chip（对等 delListItem 的按索引删除——列表无重复，行为等价且更稳）。
 * @param {HTMLElement} listEl
 * @param {ReadonlyArray<string>} values
 * @returns {boolean} 是否删除了至少一项
 */
export function removeValues(listEl, values) {
  let removed = false;
  const chips = [...listEl.getElementsByClassName(CHIP_CLASS)];
  for (const chip of chips) {
    const textEl = chip.getElementsByClassName(CHIP_TEXT_CLASS)[0];
    if (!textEl) {
      continue;
    }
    const value = textEl.title || textEl.textContent;
    if (values.includes(value)) {
      chip.remove();
      removed = true;
    }
  }
  return removed;
}
