// 输入行（'i' 字段）：输入框 + 添加/删除/清空/复制/展开 五个小按钮。
// 行为对等 Block_Obj insertInput/addListItem/delListItem/toggleList/buttonClicked：
//   - 添加：Enter 或点击；stringToArray 解析；去重前置；title 闪「添加成功」1s
//   - 删除：按输入内容匹配删除；成功则清空输入并闪「删除成功」
//   - 清空 / 复制（逗号连接）/ 展开(↔恢复，隐藏其他 li 与 br)
//   - 闪烁机制为 title + block_obj_button_clicked 类（对等 buttonClicked）
import {
  INPUT_DIV_CLASS,
  INPUT_SPAN_CLASS,
  INPUT_CLASS,
  INPUT_BTN_CLASS,
  BUTTON_CLICKED_CLASS,
  LIST_EXPAND_CLASS,
  LI_HIDE_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  BUTTON_FLASH_MS,
} from '../constants.js';
import { stringToArray } from '../util/string-to-array.js';
import { extractListFromEl, prependUnique, removeValues } from './chips.js';

let flashTimer = null;

/**
 * buttonClicked —— title 闪烁（对等 Block_Obj buttonClicked）。
 * @param {HTMLElement} button
 * @param {string} flashTitle
 */
export function buttonClicked(button, flashTitle) {
  const originalTitle = button.title;
  button.title = flashTitle;
  button.classList.add(BUTTON_CLICKED_CLASS);
  if (flashTimer) {
    window.clearTimeout(flashTimer);
  }
  flashTimer = window.setTimeout(() => {
    button.title = originalTitle;
    button.classList.remove(BUTTON_CLICKED_CLASS);
    flashTimer = null;
  }, BUTTON_FLASH_MS);
}

function createSpanBtn(classname, label, title, callback) {
  const btn = document.createElement('span');
  btn.textContent = label;
  btn.title = title;
  btn.className = classname;
  btn.addEventListener('click', e => callback(e));
  return btn;
}

/**
 * toggleList —— 聚焦展开某个列表（对等 Block_Obj toggleList）。
 * 带目标 classname 的 li：其列表容器切换 expand 类；其余 li 与全部 br 切换隐藏。
 * @param {HTMLElement} ulNode
 * @param {string} liClassname 含 'block_obj_' 前缀的完整类名
 */
export function toggleList(ulNode, liClassname) {
  for (const li of ulNode.querySelectorAll('li')) {
    if (li.classList.contains(liClassname)) {
      const listTextareaDiv = li.querySelector('.' + LIST_TEXTAREA_DIV_CLASS);
      if (listTextareaDiv) {
        listTextareaDiv.classList.toggle(LIST_EXPAND_CLASS);
      }
    } else {
      li.classList.toggle(LI_HIDE_CLASS);
    }
  }
  for (const br of ulNode.querySelectorAll('br')) {
    br.classList.toggle(LI_HIDE_CLASS);
  }
}

/**
 * 创建输入行 li。
 * @param {{
 *   descriptor: { label?: string, title?: string, placeholder?: string, id?: string, list_id: string, classname?: string },
 *   fieldIdPrefix: string,
 *   ulNode: HTMLElement,
 * }} params
 * @returns {HTMLElement}
 */
export function createInputRow({ descriptor, fieldIdPrefix, ulNode }) {
  const liClassname = descriptor.classname ? 'block_obj_' + descriptor.classname : '';
  const inputLi = document.createElement('li');
  inputLi.className = liClassname;
  const inputDiv = document.createElement('div');
  inputDiv.className = INPUT_DIV_CLASS;
  const inputSpan = document.createElement('span');
  inputSpan.className = INPUT_SPAN_CLASS;
  inputSpan.textContent = descriptor.label ?? '';
  inputDiv.appendChild(inputSpan);
  const input = document.createElement('input');
  if (descriptor.id) {
    input.id = fieldIdPrefix + descriptor.id;
  }
  input.title = descriptor.title ?? '';
  input.placeholder = descriptor.placeholder ?? '';
  input.type = 'text';
  input.className = INPUT_CLASS;
  inputSpan.appendChild(input);
  const listElId = fieldIdPrefix + descriptor.list_id;

  const addListItem = () => {
    const textValue = input.value;
    if (!textValue) {
      return false;
    }
    const textArr = stringToArray(textValue);
    const listEl = document.getElementById(listElId);
    const saveArr = extractListFromEl(listEl);
    const fresh = textArr.filter(item => !saveArr.includes(item));
    prependUnique(listEl, fresh);
    input.value = '';
    return true;
  };

  input.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      addListItem();
    }
  });

  const addBtn = createSpanBtn(INPUT_BTN_CLASS, '添加', '添加内容到列表中', () => {
    if (addListItem()) {
      buttonClicked(addBtn, '添加成功');
    }
  });
  const deleteBtn = createSpanBtn(INPUT_BTN_CLASS, '删除', '从列表中删除符合的项目', () => {
    const textValue = input.value;
    if (!textValue) {
      return;
    }
    const textArr = stringToArray(textValue);
    const listEl = document.getElementById(listElId);
    if (removeValues(listEl, textArr)) {
      input.value = '';
      buttonClicked(deleteBtn, '删除成功');
    }
  });
  const clearBtn = createSpanBtn(INPUT_BTN_CLASS, '清空', '清空列表', () => {
    document.getElementById(listElId).innerHTML = '';
    buttonClicked(clearBtn, '清除成功');
  });
  const copyBtn = createSpanBtn(INPUT_BTN_CLASS, '复制', '复制列表', async () => {
    const text = extractListFromEl(document.getElementById(listElId)).toString();
    await copyToClipboard(text);
    buttonClicked(copyBtn, '复制成功');
  });
  const expandBtn = createSpanBtn(INPUT_BTN_CLASS, '展开', '展开列表', () => {
    if (liClassname) {
      toggleList(ulNode, liClassname);
    }
    if (expandBtn.textContent == '展开') {
      expandBtn.textContent = '恢复';
      expandBtn.title = '收缩列表';
    } else {
      expandBtn.textContent = '展开';
      expandBtn.title = '展开列表';
    }
  });

  inputDiv.appendChild(addBtn);
  inputDiv.appendChild(deleteBtn);
  inputDiv.appendChild(clearBtn);
  inputDiv.appendChild(copyBtn);
  inputDiv.appendChild(expandBtn);
  inputLi.appendChild(inputDiv);
  return inputLi;
}

/**
 * 剪贴板写入（按钮点击 = 用户手势；execCommand 兜底，对等 GM_setClipboard 可靠性）。
 * @param {string} text
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    } catch (fallbackError) {
      console.error('[bilibili_block] 复制到剪贴板失败:', fallbackError);
    }
  }
}
