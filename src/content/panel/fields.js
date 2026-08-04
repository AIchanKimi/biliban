// 面板字段渲染分发。对等 Block_Obj settingsPanel() 的 switch 与 skip-if-exists 逻辑。
import {
  CHECKBOX_LI_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
  SEPARATOR_LI_CLASS,
  SEPARATOR_TEXT_CLASS,
  SEPARATOR_SYMBOL_CLASS,
  LIST_DIV_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  MOVE_RIGHT_CLASS,
} from '../constants.js';
import { seedList } from './chips.js';
import { createInputRow } from './input-row.js';

/**
 * @param {HTMLElement} ulNode
 * @param {string} fieldIdPrefix
 */
export function createFieldRenderer(ulNode, fieldIdPrefix) {
  // saveField 登记（对等 Block_Obj saveField）：checkbox 与 list 参与保存
  const saveField = [];

  function insertCheckbox(descriptor) {
    const checkboxLi = document.createElement('li');
    checkboxLi.className = CHECKBOX_LI_CLASS;
    if (descriptor.classname) {
      checkboxLi.classList.add(descriptor.classname);
    }
    if (descriptor.move_right) {
      checkboxLi.classList.add(MOVE_RIGHT_CLASS);
    }
    const checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.className = CHECKBOX_INPUT_CLASS;
    checkboxInput.id = fieldIdPrefix + descriptor.id;
    checkboxInput.checked = descriptor.checked ? true : false;
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = CHECKBOX_LABEL_CLASS;
    checkboxLabel.setAttribute('for', fieldIdPrefix + descriptor.id);
    checkboxLabel.textContent = descriptor.label ?? '';
    checkboxLabel.title = descriptor.title ?? '';
    checkboxLi.appendChild(checkboxInput);
    checkboxLi.appendChild(checkboxLabel);
    ulNode.appendChild(checkboxLi);
    saveField.push({ key: descriptor.id, type: 'checkbox' });
  }

  function insertSeparator(descriptor) {
    const separatorLi = document.createElement('li');
    separatorLi.className = SEPARATOR_LI_CLASS;
    if (descriptor.classname) {
      separatorLi.classList.add('block_obj_' + descriptor.classname);
    }
    const separatorDiv = document.createElement('div');
    if (descriptor.id) {
      separatorDiv.id = fieldIdPrefix + descriptor.id;
    }
    if (descriptor.label) {
      separatorDiv.className = SEPARATOR_TEXT_CLASS;
      separatorDiv.textContent = descriptor.label;
    } else {
      separatorDiv.className = SEPARATOR_SYMBOL_CLASS;
    }
    separatorDiv.title = descriptor.title ? descriptor.title : '';
    separatorLi.appendChild(separatorDiv);
    ulNode.appendChild(separatorLi);
  }

  function insertBr(descriptor) {
    const br = document.createElement('br');
    br.className = descriptor.classname ? descriptor.classname : '';
    ulNode.appendChild(br);
  }

  function insertList(descriptor) {
    const listLi = document.createElement('li');
    listLi.className = descriptor.classname ? 'block_obj_' + descriptor.classname : '';
    const listDiv = document.createElement('div');
    listDiv.className = LIST_DIV_CLASS;
    listDiv.textContent = descriptor.label ?? '';
    listDiv.title = descriptor.title ?? '';
    const listTextareaDiv = document.createElement('div');
    listTextareaDiv.id = fieldIdPrefix + descriptor.id;
    listTextareaDiv.className = LIST_TEXTAREA_DIV_CLASS;
    seedList(listTextareaDiv, descriptor.values ?? []);
    listDiv.appendChild(listTextareaDiv);
    listLi.appendChild(listDiv);
    ulNode.appendChild(listLi);
    saveField.push({ key: descriptor.id, type: 'list' });
  }

  /**
   * 渲染单个字段描述符（skip-if-exists 对等 Block_Obj）。
   * @param {Readonly<Record<string, unknown>>} descriptor
   * @param {{ checked?: boolean, values?: string[] }} renderState
   */
  function renderField(descriptor, renderState = {}) {
    const existingId = fieldIdPrefix + (descriptor.id ? descriptor.id : '');
    if (descriptor.id && ulNode.querySelector('#' + CSS.escape(existingId))) {
      return;
    }
    const merged = { ...descriptor, ...renderState };
    switch (String(descriptor.type).toLowerCase()) {
      case 'separator':
      case 's':
        insertSeparator(merged);
        break;
      case 'br':
      case 'b':
        insertBr(merged);
        break;
      case 'input':
      case 'i':
        ulNode.appendChild(createInputRow({ descriptor: merged, fieldIdPrefix, ulNode }));
        break;
      case 'list':
      case 'l':
        insertList(merged);
        break;
      case 'checkbox':
      case 'c':
      default:
        insertCheckbox(merged);
        break;
    }
  }

  return { renderField, saveField };
}
