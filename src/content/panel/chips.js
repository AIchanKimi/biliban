// 词条 chip 渲染与真值提取（v5：作用域 + 临时徽标）。
// 保留 v4 真值机制：afterbegin 插入（DOM 序=数组逆序）、>9 字符截断、title 存全值、正则绿色。
// chip 根节点 data-scopes（逗号分隔）与 data-temp 承载收集语义；title 仍为值的唯一真值。
import {
  CHIP_CLASS,
  CHIP_TEXT_CLASS,
  CHIP_GREEN_CLASS,
  CHIP_DEL_CLASS,
  CHIP_TRUNCATE_LIMIT,
  CHIP_TEMP_BADGE_CLASS,
} from '../constants.js';
import { REGEX_LITERAL_RE } from '../config/serialize.js';

/**
 * @typedef {{ value: string, scopes: string[], temp?: boolean, label?: string, dataset?: Record<string, string> }} ChipEntry
 */

/**
 * 创建单个 chip。value 为收集真值；label 可选（显示文本与 value 不同时，如时长词条）。
 * dataset 可选，合并到 chip 根节点（如时长词条的 op/seconds）。
 * @param {ChipEntry} entry
 * @returns {HTMLElement}
 */
export function createChip(entry) {
  const { value, scopes, temp = false, label, dataset } = entry;
  const childSpan = document.createElement('span');
  childSpan.className = CHIP_CLASS;
  childSpan.dataset.scopes = scopes.join(',');
  childSpan.dataset.temp = temp ? '1' : '0';
  for (const [key, val] of Object.entries(dataset ?? {})) {
    childSpan.dataset[key] = val;
  }

  const display = label ?? value;
  const textSpan = document.createElement('span');
  textSpan.className = REGEX_LITERAL_RE.test(value) ? `${CHIP_TEXT_CLASS} ${CHIP_GREEN_CLASS}` : CHIP_TEXT_CLASS;
  textSpan.textContent =
    display.length > CHIP_TRUNCATE_LIMIT ? display.slice(0, 3) + ' ... ' + display.slice(-3) : display;
  if (display.length > CHIP_TRUNCATE_LIMIT) {
    textSpan.title = display;
  }
  childSpan.appendChild(textSpan);

  // 作用域由所在标签页表达，chip 不再重复显示；仅临时词条加徽标
  if (temp) {
    const tempBadge = document.createElement('span');
    tempBadge.className = CHIP_TEMP_BADGE_CLASS;
    tempBadge.textContent = '临时';
    const expiresAt = Number(dataset?.expiresAt);
    tempBadge.title = Number.isFinite(expiresAt) && expiresAt > 0
      ? '临时词条，' + new Date(expiresAt).toLocaleString() + ' 到期后自动清除'
      : '临时词条，到期后自动清除';
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
  const entry = {
    value: textEl.title || textEl.textContent,
    scopes,
    temp: chip.dataset.temp === '1',
  };
  const expiresAt = Number(chip.dataset.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    entry.expiresAt = expiresAt;
  }
  return entry;
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
      if (entry.expiresAt) {
        scoped.expiresAt = entry.expiresAt; // 续存原有到期时间
      }
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
      const dataset = entry.expiresAt ? { expiresAt: String(entry.expiresAt) } : {};
      listEl.insertAdjacentElement('afterbegin', createChip({ ...entry, temp: true, dataset }));
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
