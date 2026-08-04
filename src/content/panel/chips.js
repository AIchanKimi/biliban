// 词条 chip 渲染与真值提取（v5：作用域 + 临时徽标）。
// 保留 v4 真值机制：afterbegin 插入（DOM 序=数组逆序）、>9 字符截断、title 存全值、正则绿色。
// chip 根节点 data-scopes（逗号分隔）与 data-temp 承载收集语义；title 仍为值的唯一真值。
import {
  CHIP_CLASS,
  CHIP_TEXT_CLASS,
  CHIP_GREEN_CLASS,
  CHIP_DEL_CLASS,
  CHIP_TRUNCATE_LIMIT,
  CHIP_BADGE_CLASS,
  CHIP_TEMP_BADGE_CLASS,
} from '../constants.js';
import { REGEX_LITERAL_RE } from '../config/serialize.js';
import { scopeLabel } from '../config/scopes.js';

/**
 * @typedef {{ value: string, scopes: string[], temp?: boolean }} ChipEntry
 */

/**
 * 创建单个 chip。
 * @param {ChipEntry} entry
 * @returns {HTMLElement}
 */
export function createChip(entry) {
  const { value, scopes, temp = false } = entry;
  const childSpan = document.createElement('span');
  childSpan.className = CHIP_CLASS;
  childSpan.dataset.scopes = scopes.join(',');
  childSpan.dataset.temp = temp ? '1' : '0';

  const textSpan = document.createElement('span');
  textSpan.className = REGEX_LITERAL_RE.test(value) ? `${CHIP_TEXT_CLASS} ${CHIP_GREEN_CLASS}` : CHIP_TEXT_CLASS;
  textSpan.textContent =
    value.length > CHIP_TRUNCATE_LIMIT ? value.slice(0, 3) + ' ... ' + value.slice(-3) : value;
  if (value.length > CHIP_TRUNCATE_LIMIT) {
    textSpan.title = value;
  }
  childSpan.appendChild(textSpan);

  const isGlobalOnly = scopes.length === 1 && scopes[0] === 'global';
  if (!isGlobalOnly) {
    const scopeBadge = document.createElement('span');
    scopeBadge.className = CHIP_BADGE_CLASS;
    scopeBadge.textContent = scopes.map(scopeLabel).join('·');
    scopeBadge.title = '仅作用于：' + scopeBadge.textContent;
    childSpan.appendChild(scopeBadge);
  }
  if (temp) {
    const tempBadge = document.createElement('span');
    tempBadge.className = CHIP_TEMP_BADGE_CLASS;
    tempBadge.textContent = '临时';
    tempBadge.title = '仅本标签页生效，刷新页面后失效';
    childSpan.appendChild(tempBadge);
  }

  const delSpan = document.createElement('span');
  delSpan.textContent = 'X';
  delSpan.title = '移除';
  delSpan.className = CHIP_DEL_CLASS;
  delSpan.addEventListener('click', () => childSpan.remove());
  childSpan.appendChild(delSpan);
  return childSpan;
}

/** chip 根节点 → 词条对象 */
function chipToEntry(chip) {
  const textEl = chip.getElementsByClassName(CHIP_TEXT_CLASS)[0];
  if (!textEl) {
    return null;
  }
  const scopes = typeof chip.dataset.scopes === 'string' && chip.dataset.scopes !== ''
    ? chip.dataset.scopes.split(',')
    : ['global'];
  return {
    value: textEl.title || textEl.textContent,
    scopes,
    temp: chip.dataset.temp === '1',
  };
}

/**
 * 从列表 DOM 恢复词条（保存时真值来源：DOM 逆序 = 数组正序）。
 * @param {HTMLElement} listEl
 * @returns {{ persistent: Array<{ value: string, scopes: string[] }>, temp: Array<{ value: string, scopes: string[] }> }}
 */
export function extractEntriesFromEl(listEl) {
  const chips = [...listEl.getElementsByClassName(CHIP_CLASS)].reverse();
  const persistent = [];
  const temp = [];
  for (const chip of chips) {
    const entry = chipToEntry(chip);
    if (!entry) {
      continue;
    }
    const scoped = { value: entry.value, scopes: entry.scopes };
    if (entry.temp) {
      temp.push(scoped);
    } else {
      persistent.push(scoped);
    }
  }
  return { persistent, temp };
}

/** 列表内是否已有同值同作用域 chip（不区分临时与否） */
function hasEntry(listEl, value, scopes) {
  for (const chip of listEl.getElementsByClassName(CHIP_CLASS)) {
    const entry = chipToEntry(chip);
    if (entry && entry.value === value && [...entry.scopes].sort().join(',') === [...scopes].sort().join(',')) {
      return true;
    }
  }
  return false;
}

/**
 * 去重前置插入单个词条。
 * @param {HTMLElement} listEl
 * @param {ChipEntry} entry
 * @returns {boolean} 是否插入
 */
export function prependEntry(listEl, entry) {
  if (hasEntry(listEl, entry.value, entry.scopes)) {
    return false;
  }
  listEl.insertAdjacentElement('afterbegin', createChip(entry));
  return true;
}

/**
 * 用持久 + 临时词条播种列表（临时词条排在视觉前端，橙色徽标区分）。
 * @param {HTMLElement} listEl
 * @param {ReadonlyArray<{ value: string, scopes: string[] }>} persistentEntries
 * @param {ReadonlyArray<{ value: string, scopes: string[] }>} tempEntries
 */
export function seedEntries(listEl, persistentEntries, tempEntries) {
  for (const entry of persistentEntries ?? []) {
    if (entry && entry.value) {
      listEl.insertAdjacentElement('afterbegin', createChip({ ...entry, temp: false }));
    }
  }
  for (const entry of tempEntries ?? []) {
    if (entry && entry.value) {
      listEl.insertAdjacentElement('afterbegin', createChip({ ...entry, temp: true }));
    }
  }
}

/**
 * 按值删除 chip（忽略作用域/临时差异）。
 * @param {HTMLElement} listEl
 * @param {ReadonlyArray<string>} values
 * @returns {boolean} 是否删除了至少一项
 */
export function removeValues(listEl, values) {
  let removed = false;
  for (const chip of [...listEl.getElementsByClassName(CHIP_CLASS)]) {
    const entry = chipToEntry(chip);
    if (entry && values.includes(entry.value)) {
      chip.remove();
      removed = true;
    }
  }
  return removed;
}

/**
 * 移除全部临时 chip（「清空临时词」DOM 侧）。
 * @param {HTMLElement} listEl
 */
export function removeTempChips(listEl) {
  for (const chip of [...listEl.getElementsByClassName(CHIP_CLASS)]) {
    if (chip.dataset.temp === '1') {
      chip.remove();
    }
  }
}
