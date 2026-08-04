// 设置面板主体（v5 分节重构）。保留 v4 壳行为：
//   - 520px 固定面板，bottom 6vh，right 0↔-530px 0.8s 滑入滑出
//   - 底部三按钮：保存并关闭 / 仅保存（闪「已保存」1s）/ 取消（收起后 800ms 按上次已保存重建）
//   - rebuild 用于「取消」与多标签页远端同步
// 收集语义：临时词条回写 temp-store（不落盘），持久词条进存储对象。
import {
  BLOCK_OBJ_ID,
  WRAP_ID,
  WRAP_DIV_CLASS,
  WRAP_SHOW_CLASS,
  WRAP_HIDDEN_CLASS,
  MAIN_FIELDSET_CLASS,
  UL_NODE_CLASS,
  SAVE_BUTTON_CLASS,
  CANCEL_BUTTON_CLASS,
  SAVE_FLASH_MS,
  CANCEL_REBUILD_MS,
  LI_USERNAME_CLASS,
  LI_KEYWORD_CLASS,
} from '../constants.js';
import { CONFIG_VERSION } from '../config/defaults.js';
import { getTempEntries, setTempEntries, removeTempEntriesByType } from '../config/temp-store.js';
import { createGeneralSection } from './sections/general.js';
import { createEntriesSection } from './sections/entries.js';
import { createRulesSection } from './sections/rules.js';
import { SAVE_FLASH_TEXT } from './panel-text.js';

/**
 * @param {{
 *   initialConfig: Readonly<Record<string, unknown>>, // 存储形状 v2
 *   persist: (storageObject: Record<string, unknown>) => Promise<void>,
 *   onSaved: (storageObject: Readonly<Record<string, unknown>>) => void,
 *   onTempCleared: () => void, // 「清空临时词」后立即重跑屏蔽
 * }} deps
 */
export function createPanel(deps) {
  const { initialConfig, persist, onSaved, onTempCleared } = deps;
  let config = { ...initialConfig };
  let wrapDiv = null;
  let ulNode = null;
  let sections = null;
  let saveTimer = null;
  let cancelTimer = null;
  let display = false;

  const tempByType = type => getTempEntries().filter(entry => entry.type === type);

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

    const general = createGeneralSection(config);
    const usernames = createEntriesSection({
      type: 'username',
      sectionLabel: '屏蔽用户名（精确匹配）：',
      placeholder: ' UP主名称，多个以半角逗号分隔 ',
      liClassname: LI_USERNAME_CLASS,
      entries: config.usernames,
      tempEntries: tempByType('username'),
      onTempCleared: () => {
        removeTempEntriesByType('username');
        onTempCleared();
      },
    });
    const keywords = createEntriesSection({
      type: 'keyword',
      sectionLabel: '屏蔽关键字或正则（标题匹配）：',
      placeholder: ' 正则表达式格式: /Pattern/Modifier ',
      liClassname: LI_KEYWORD_CLASS,
      entries: config.keywords,
      tempEntries: tempByType('keyword'),
      onTempCleared: () => {
        removeTempEntriesByType('keyword');
        onTempCleared();
      },
    });
    const rules = createRulesSection(config.rules);
    sections = { general, usernames, keywords, rules };

    for (const section of Object.values(sections)) {
      for (const li of section.lis) {
        ulNode.appendChild(li);
      }
    }

    const saveButton = createFooterBtn(SAVE_BUTTON_CLASS, '保存并关闭', '保存设置并关闭设置窗口', () => {
      toggle();
      save(saveButton);
    });
    const onlySaveButton = createFooterBtn(SAVE_BUTTON_CLASS, '仅保存', '仅保存设置', () => {
      onlySaveButton.textContent = SAVE_FLASH_TEXT;
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(() => {
        onlySaveButton.textContent = '仅保存';
        saveTimer = null;
      }, SAVE_FLASH_MS);
      save(onlySaveButton);
    });
    const cancelButton = createFooterBtn(CANCEL_BUTTON_CLASS, '取消', '关闭设置窗口（丢弃未保存编辑）', e => {
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

  function createFooterBtn(classname, label, title, callback) {
    const btn = document.createElement('span');
    btn.textContent = label;
    btn.title = title;
    btn.className = classname;
    btn.addEventListener('click', e => callback(e));
    return btn;
  }

  /** DOM → { storage 存储形状, temp 临时词条, invalidCount } */
  function collectFromDom() {
    const general = sections.general.collect();
    const usernames = sections.usernames.collect();
    const keywords = sections.keywords.collect();
    const rulesResult = sections.rules.collect();
    return {
      storage: {
        version: CONFIG_VERSION,
        enable: general.enable,
        duration: general.duration,
        usernames: usernames.persistent,
        keywords: keywords.persistent,
        rules: rulesResult.rules,
      },
      temp: [
        ...usernames.temp.map(entry => ({ ...entry, type: 'username' })),
        ...keywords.temp.map(entry => ({ ...entry, type: 'keyword' })),
      ],
      invalidCount: rulesResult.invalidCount,
    };
  }

  async function save(clickedBtn = null) {
    const { storage, temp, invalidCount } = collectFromDom();
    if (invalidCount > 0) {
      console.error('[bilibili_block] 存在无效自定义规则（选择器无法编译，或匹配模式缺少标题/UP主选择器），已跳过:', invalidCount);
      if (clickedBtn) {
        clickedBtn.title = '部分规则无效已跳过';
      }
    }
    setTempEntries(temp);
    config = storage;
    await persist(storage);
    onSaved(storage);
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

  /** 销毁并按新配置重建（取消 / 远端同步）；临时词条从 temp-store 重新渲染。 */
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
