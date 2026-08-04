// 设置面板主体。对等 Block_Obj createSettingsPanel/settingsPanel/expandWrap/destroyAndRebuild：
//   - 520px 固定面板，bottom 6vh，right 0↔-530px 0.8s 滑入滑出
//   - 底部三按钮：保存并关闭 / 仅保存（闪「已保存」1s）/ 取消（收起后 800ms 按上次已保存重建）
//   - collectConfigFromDom 只读 checkbox + 列表（输入框永不持久化）
//   - rebuild 用于「取消」与多标签页远端同步
import {
  BLOCK_OBJ_ID,
  WRAP_ID,
  FIELD_ID_PREFIX,
  WRAP_DIV_CLASS,
  WRAP_SHOW_CLASS,
  WRAP_HIDDEN_CLASS,
  MAIN_FIELDSET_CLASS,
  UL_NODE_CLASS,
  SAVE_BUTTON_CLASS,
  CANCEL_BUTTON_CLASS,
  SAVE_FLASH_MS,
  CANCEL_REBUILD_MS,
} from '../constants.js';
import { FIELD_DESCRIPTORS } from './field-descriptors.js';
import { createFieldRenderer } from './fields.js';
import { extractListFromEl } from './chips.js';
import { SAVE_FLASH_TEXT } from './panel-text.js';

/**
 * @param {{
 *   initialConfig: Readonly<Record<string, unknown>>, // 存储形状（列表为字符串数组）
 *   persist: (storageObject: Record<string, unknown>) => Promise<void>,
 *   onSaved: (storageObject: Readonly<Record<string, unknown>>) => void,
 * }} deps
 */
export function createPanel(deps) {
  const { initialConfig, persist, onSaved } = deps;
  let config = { ...initialConfig };
  let wrapDiv = null;
  let ulNode = null;
  let saveField = [];
  let saveTimer = null;
  let cancelTimer = null;
  let display = false;

  function build() {
    wrapDiv = document.createElement('div');
    wrapDiv.id = WRAP_ID;
    wrapDiv.className = WRAP_DIV_CLASS + ' ' + (display ? WRAP_SHOW_CLASS : WRAP_HIDDEN_CLASS);
    const mainFieldset = document.createElement('fieldset');
    mainFieldset.id = BLOCK_OBJ_ID + '_mainFieldset';
    mainFieldset.className = MAIN_FIELDSET_CLASS;
    wrapDiv.appendChild(mainFieldset);
    ulNode = document.createElement('ul');
    ulNode.id = BLOCK_OBJ_ID + '_ulNode';
    ulNode.className = UL_NODE_CLASS;
    mainFieldset.appendChild(ulNode);

    const { renderField, saveField: fields } = createFieldRenderer(ulNode, FIELD_ID_PREFIX);
    for (const descriptor of FIELD_DESCRIPTORS) {
      renderField(descriptor, {
        checked: descriptor.id ? Boolean(config[descriptor.id]) : undefined,
        values: descriptor.id && descriptor.type === 'l' ? config[descriptor.id] ?? descriptor.default : undefined,
      });
    }
    saveField = fields;

    const saveButton = createSpanBtn(SAVE_BUTTON_CLASS, '保存并关闭', '保存设置并关闭设置窗口', () => {
      toggle();
      save();
    });
    const onlySaveButton = createSpanBtn(SAVE_BUTTON_CLASS, '仅保存', '仅保存设置', () => {
      onlySaveButton.textContent = SAVE_FLASH_TEXT;
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(() => {
        onlySaveButton.textContent = '仅保存';
        saveTimer = null;
      }, SAVE_FLASH_MS);
      save();
    });
    const cancelButton = createSpanBtn(CANCEL_BUTTON_CLASS, '取消', '关闭设置窗口', e => {
      toggle();
      if (cancelTimer) {
        window.clearTimeout(cancelTimer);
      }
      cancelTimer = window.setTimeout(() => {
        display = false;
        rebuild(config);
        cancelTimer = null;
      }, CANCEL_REBUILD_MS);
      e.stopPropagation();
    });
    ulNode.appendChild(saveButton);
    ulNode.appendChild(onlySaveButton);
    ulNode.appendChild(cancelButton);
    document.body.appendChild(wrapDiv);
  }

  function createSpanBtn(classname, label, title, callback) {
    const btn = document.createElement('span');
    btn.textContent = label;
    btn.title = title;
    btn.className = classname;
    btn.addEventListener('click', e => callback(e));
    return btn;
  }

  /** DOM → 存储形状配置（只读 checkbox 与列表；输入框永不持久化） */
  function collectConfigFromDom() {
    const next = { ...config };
    for (const item of saveField) {
      if (item.type === 'checkbox') {
        const el = document.getElementById(FIELD_ID_PREFIX + item.key);
        if (el) {
          next[item.key] = el.checked;
        }
      } else if (item.type === 'list') {
        const el = document.getElementById(FIELD_ID_PREFIX + item.key);
        if (el) {
          next[item.key] = extractListFromEl(el);
        }
      }
    }
    return next;
  }

  async function save() {
    const storageObject = collectConfigFromDom();
    config = storageObject;
    await persist(storageObject);
    onSaved(storageObject);
  }

  function toggle() {
    const panel = document.getElementById(WRAP_ID);
    if (panel) {
      if (panel.classList.contains(WRAP_SHOW_CLASS)) {
        display = false;
        panel.classList.remove(WRAP_SHOW_CLASS);
        panel.classList.add(WRAP_HIDDEN_CLASS);
      } else {
        display = true;
        panel.classList.remove(WRAP_HIDDEN_CLASS);
        panel.classList.add(WRAP_SHOW_CLASS);
      }
    }
  }

  /** 销毁并按新配置重建（取消 / 远端同步）。 */
  function rebuild(newConfig = null) {
    config = newConfig ? { ...newConfig } : config;
    const existing = document.getElementById(WRAP_ID);
    if (existing) {
      existing.remove();
    }
    build();
  }

  function init() {
    build();
  }

  return { init, toggle, save, rebuild };
}
