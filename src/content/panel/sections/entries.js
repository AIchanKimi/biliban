// 面板分节：屏蔽词条组（某作用域标签页内一组）。
// 词条判定时同时作用于标题与 UP主名；作用域由所在标签页决定，输入行不带作用域选择。
// 保存收集以 DOM chips 为准：持久词条入存储，临时词条回写 temp-store。
import {
  FIELD_ID_PREFIX,
  INPUT_DIV_CLASS,
  INPUT_SPAN_CLASS,
  INPUT_CLASS,
  SELECT_CLASS,
  SEPARATOR_LI_CLASS,
  SEPARATOR_TEXT_CLASS,
  LIST_DIV_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
} from '../../constants.js';
import { REGEX_LITERAL_RE, parseRegexLiteral } from '../../config/serialize.js';
import { stringToArray } from '../../util/string-to-array.js';
import { seedEntries, extractEntriesFromEl, prependEntry, removeValues } from '../chips.js';
import { buttonClicked, createSpanBtn, toggleList, copyToClipboard } from '../input-row.js';

/**
 * 新词条校验：空/纯空白拒绝；正则字面量必须可编译。
 * @param {string} value
 * @returns {boolean}
 */
export function isValidNewEntry(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  if (REGEX_LITERAL_RE.test(value)) {
    const parsed = parseRegexLiteral(value);
    try {
      new RegExp(parsed.pattern, parsed.flags);
    } catch {
      return false;
    }
  }
  return true;
}

function separatorLi(label, title = '') {
  const li = document.createElement('li');
  li.className = SEPARATOR_LI_CLASS;
  const text = document.createElement('span');
  text.className = SEPARATOR_TEXT_CLASS;
  text.textContent = label;
  if (title) {
    text.title = title;
  }
  li.appendChild(text);
  return li;
}

/**
 * @param {{
 *   scope: string,
 *   liClassname: string,
 *   entries: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempEntries: ReadonlyArray<{ value: string, scopes: string[] }>,
 * }} params
 * @returns {{ lis: HTMLElement[], collect: () => { persistent: Array<{ value: string, scopes: string[] }>, temp: Array<{ value: string, scopes: string[] }> } }}
 */
export function createEntriesGroup(params) {
  const { scope, liClassname, entries, tempEntries } = params;
  const inputId = `${FIELD_ID_PREFIX}wordInput_${scope}`;
  const tempId = `${FIELD_ID_PREFIX}wordTemp_${scope}`;
  const listId = `${FIELD_ID_PREFIX}words_${scope}`;

  // ---- 输入行 ----
  const inputLi = document.createElement('li');
  inputLi.className = liClassname;
  const inputDiv = document.createElement('div');
  inputDiv.className = INPUT_DIV_CLASS;
  const inputSpan = document.createElement('span');
  inputSpan.className = INPUT_SPAN_CLASS;
  inputSpan.textContent = '输入：';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.className = INPUT_CLASS;
  input.placeholder = ' 多个以半角逗号分隔；正则格式 /Pattern/Modifier ';
  input.title = '标题包含匹配；UP主名精确匹配；/正则/ 两者都匹配';
  inputSpan.appendChild(input);

  const tempCheckbox = document.createElement('input');
  tempCheckbox.type = 'checkbox';
  tempCheckbox.id = tempId;
  tempCheckbox.title = '临时词条：独立存储、跨标签页同步，到期后自动清除';
  const tempLabel = document.createElement('label');
  tempLabel.htmlFor = tempId;
  tempLabel.textContent = '临时';
  tempLabel.title = tempCheckbox.title;
  const tempHoursSelect = document.createElement('select');
  tempHoursSelect.className = SELECT_CLASS;
  tempHoursSelect.title = '临时词条有效期';
  for (const [hours, label] of [[1, '1小时'], [6, '6小时'], [24, '24小时'], [168, '7天']]) {
    const option = document.createElement('option');
    option.value = String(hours);
    option.textContent = label;
    option.selected = hours === 24;
    tempHoursSelect.appendChild(option);
  }

  const listEl = document.createElement('div');
  listEl.id = listId;
  listEl.className = LIST_TEXTAREA_DIV_CLASS;
  seedEntries(listEl, entries, tempEntries);

  const addItems = () => {
    const textValue = input.value;
    if (!textValue) {
      return false;
    }
    const temp = tempCheckbox.checked;
    const dataset = temp
      ? { expiresAt: String(Date.now() + Number(tempHoursSelect.value) * 3600_000) }
      : undefined;
    // v6.2：输入值 trim（trim 后为空则丢弃）
    const values = stringToArray(textValue).map(value => value.trim()).filter(isValidNewEntry);
    if (values.length === 0) {
      return false;
    }
    let inserted = false;
    for (const value of values) {
      if (prependEntry(listEl, { value, scopes: [scope], temp, dataset })) {
        inserted = true;
      }
    }
    input.value = '';
    return inserted;
  };

  input.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      addItems();
    }
  });

  const addBtn = createSpanBtn('添加', '添加内容到列表中', () => {
    if (addItems()) {
      buttonClicked(addBtn, '添加成功');
    }
  });
  const deleteBtn = createSpanBtn('删除', '从列表中删除符合的项目', () => {
    const textValue = input.value;
    if (!textValue) {
      return;
    }
    if (removeValues(listEl, stringToArray(textValue))) {
      input.value = '';
      buttonClicked(deleteBtn, '删除成功');
    }
  });
  const clearBtn = createSpanBtn('清空', '清空列表', () => {
    listEl.innerHTML = '';
    buttonClicked(clearBtn, '清除成功');
  });
  const copyBtn = createSpanBtn('复制', '复制列表', async () => {
    const { persistent, temp } = extractEntriesFromEl(listEl);
    const text = [...persistent, ...temp].map(entry => entry.value).toString();
    await copyToClipboard(text);
    buttonClicked(copyBtn, '复制成功');
  });
  const expandBtn = createSpanBtn('展开', '展开列表', () => {
    const ulNode = inputLi.closest('ul');
    if (ulNode) {
      toggleList(ulNode, liClassname);
    }
    if (expandBtn.textContent === '展开') {
      expandBtn.textContent = '恢复';
      expandBtn.title = '收缩列表';
    } else {
      expandBtn.textContent = '展开';
      expandBtn.title = '展开列表';
    }
  });

  inputDiv.appendChild(inputSpan);
  inputDiv.appendChild(tempCheckbox);
  inputDiv.appendChild(tempLabel);
  inputDiv.appendChild(tempHoursSelect);
  inputDiv.appendChild(addBtn);
  inputDiv.appendChild(deleteBtn);
  inputDiv.appendChild(clearBtn);
  inputDiv.appendChild(copyBtn);
  inputDiv.appendChild(expandBtn);
  inputLi.appendChild(inputDiv);

  // ---- 列表行 ----
  const listLi = document.createElement('li');
  listLi.className = liClassname;
  const listDiv = document.createElement('div');
  listDiv.className = LIST_DIV_CLASS;
  listDiv.appendChild(listEl);
  listLi.appendChild(listDiv);

  function collect() {
    return extractEntriesFromEl(listEl);
  }

  const sectionLabel = '屏蔽词：';
  const sectionTitle = '标题包含匹配；UP主名精确匹配；/正则/ 两者都匹配';
  return { lis: [separatorLi(sectionLabel, sectionTitle), inputLi, listLi], collect };
}
