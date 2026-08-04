// 面板分节：词条组（某作用域标签页内的用户名或关键字一组）。
// 作用域由所在标签页决定，输入行不再带作用域下拉；「临时」勾选保留。
// 保存收集以 DOM chips 为准：持久词条入存储，临时词条回写 temp-store。
import {
  FIELD_ID_PREFIX,
  INPUT_DIV_CLASS,
  INPUT_SPAN_CLASS,
  INPUT_CLASS,
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
 * 新词条校验：空/纯空白拒绝；关键字的正则字面量必须可编译。
 * @param {string} value
 * @param {'keyword' | 'username'} type
 * @returns {boolean}
 */
export function isValidNewEntry(value, type) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  if (type === 'keyword' && REGEX_LITERAL_RE.test(value)) {
    const parsed = parseRegexLiteral(value);
    try {
      new RegExp(parsed.pattern, parsed.flags);
    } catch {
      return false;
    }
  }
  return true;
}

function separatorLi(label) {
  const li = document.createElement('li');
  li.className = SEPARATOR_LI_CLASS;
  const text = document.createElement('span');
  text.className = SEPARATOR_TEXT_CLASS;
  text.textContent = label;
  li.appendChild(text);
  return li;
}

/**
 * @param {{
 *   type: 'keyword' | 'username',
 *   scope: string,
 *   sectionLabel: string,
 *   placeholder: string,
 *   liClassname: string,
 *   entries: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempEntries: ReadonlyArray<{ value: string, scopes: string[] }>,
 * }} params
 * @returns {{ lis: HTMLElement[], collect: () => { persistent: Array<{ value: string, scopes: string[] }>, temp: Array<{ value: string, scopes: string[] }> } }}
 */
export function createEntriesGroup(params) {
  const { type, scope, sectionLabel, placeholder, liClassname, entries, tempEntries } = params;
  const inputId = `${FIELD_ID_PREFIX}${type}Input_${scope}`;
  const tempId = `${FIELD_ID_PREFIX}${type}Temp_${scope}`;
  const listId = `${FIELD_ID_PREFIX}${type === 'keyword' ? 'keywords' : 'usernames'}_${scope}`;

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
  input.placeholder = placeholder;
  input.title = '同时输入多个时以半角逗号分隔；正则格式 /Pattern/Modifier';
  inputSpan.appendChild(input);

  const tempCheckbox = document.createElement('input');
  tempCheckbox.type = 'checkbox';
  tempCheckbox.id = tempId;
  tempCheckbox.title = '临时词条：仅本标签页生效，不落盘、不跨标签页、刷新即失';
  const tempLabel = document.createElement('label');
  tempLabel.htmlFor = tempId;
  tempLabel.textContent = '临时';
  tempLabel.title = tempCheckbox.title;

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
    const values = stringToArray(textValue).filter(value => isValidNewEntry(value, type));
    if (values.length === 0) {
      return false;
    }
    let inserted = false;
    for (const value of values) {
      if (prependEntry(listEl, { value, scopes: [scope], temp })) {
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

  return { lis: [separatorLi(sectionLabel), inputLi, listLi], collect };
}
