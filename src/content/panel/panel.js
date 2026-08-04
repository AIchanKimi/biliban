// 设置面板主体（v5.1 标签页式管理）。保留壳行为：
//   - 520px 固定面板，bottom 6vh，right 0↔-530px 0.8s 滑入滑出
//   - 底部三按钮：保存并关闭 / 仅保存（闪「已保存」1s）/ 取消（收起后 800ms 按上次已保存重建）
//   - rebuild 用于「取消」与多标签页远端同步
// 结构：通用（总开关/时长）→ 分类标签栏（全局/首页/视频页/搜索/动态/空间）
//       → 每个分类一个面板页：用户名组 + 关键字组 + 自定义规则组 + 清空临时词。
// 收集语义：临时词条回写 temp-store（不落盘），持久词条进存储对象。
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
  SEPARATOR_LI_CLASS,
  SEPARATOR_TEXT_CLASS,
  TAB_BAR_CLASS,
  TAB_CLASS,
  TAB_ACTIVE_CLASS,
} from '../constants.js';
import { CONFIG_VERSION } from '../config/defaults.js';
import { SCOPES } from '../config/scopes.js';
import { getTempEntries, setTempEntries, removeTempEntriesByScope } from '../config/temp-store.js';
import { createGeneralSection } from './sections/general.js';
import { createScopePane } from './sections/scope-pane.js';
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
  let generalSection = null;
  let panes = [];
  let tabButtons = [];
  let activeScope = 'global';
  let saveTimer = null;
  let cancelTimer = null;
  let display = false;

  const tempByScope = scope => getTempEntries().filter(entry => entry.scopes.includes(scope));
  const entriesByScope = (list, scope) => (list ?? []).filter(entry => entry.scopes.includes(scope));

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

    // ---- 通用 ----
    generalSection = createGeneralSection(config);
    for (const li of generalSection.lis) {
      ulNode.appendChild(li);
    }

    // ---- 分类标签栏 ----
    const tabSeparator = document.createElement('li');
    tabSeparator.className = SEPARATOR_LI_CLASS;
    const tabSeparatorText = document.createElement('span');
    tabSeparatorText.className = SEPARATOR_TEXT_CLASS;
    tabSeparatorText.textContent = '按页面分类管理（「全局」中的词条处处生效）：';
    tabSeparator.appendChild(tabSeparatorText);
    ulNode.appendChild(tabSeparator);

    const tabBarLi = document.createElement('li');
    const tabBar = document.createElement('div');
    tabBar.className = TAB_BAR_CLASS;
    tabButtons = SCOPES.map(scope => {
      const tab = document.createElement('span');
      tab.id = FIELD_ID_PREFIX + 'tab_' + scope.value;
      tab.textContent = scope.label;
      tab.title = '管理「' + scope.label + '」分类下的屏蔽内容';
      tab.className = scope.value === activeScope ? TAB_ACTIVE_CLASS : TAB_CLASS;
      tab.addEventListener('click', () => switchTab(scope.value));
      tabBar.appendChild(tab);
      return { scope: scope.value, tab };
    });
    tabBarLi.appendChild(tabBar);
    ulNode.appendChild(tabBarLi);

    // ---- 每个分类一个面板页 ----
    panes = SCOPES.map(({ value: scope }) => {
      const pane = createScopePane({
        scope,
        words: entriesByScope(config.words, scope),
        tempWords: tempByScope(scope),
        rules: entriesByScope(config.rules, scope),
        onTempCleared: () => {
          removeTempEntriesByScope(scope);
          onTempCleared();
        },
      });
      pane.el.style.display = scope === activeScope ? '' : 'none';
      ulNode.appendChild(pane.el);
      return { scope, pane };
    });

    // ---- 底部三按钮 ----
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

  function switchTab(scope) {
    activeScope = scope;
    for (const { scope: s, tab } of tabButtons) {
      tab.className = s === scope ? TAB_ACTIVE_CLASS : TAB_CLASS;
    }
    for (const { scope: s, pane } of panes) {
      pane.el.style.display = s === scope ? '' : 'none';
    }
  }

  function createFooterBtn(classname, label, title, callback) {
    const btn = document.createElement('span');
    btn.textContent = label;
    btn.title = title;
    btn.className = classname;
    btn.addEventListener('click', e => callback(e));
    return btn;
  }

  /** DOM → { storage 存储形状, temp 临时词条, invalidCount }（遍历全部分类页） */
  function collectFromDom() {
    const general = generalSection.collect();
    const words = [];
    const temp = [];
    const rules = [];
    let invalidCount = 0;
    for (const { pane } of panes) {
      const result = pane.collect();
      words.push(...result.words.persistent);
      temp.push(...result.words.temp);
      rules.push(...result.rules);
      invalidCount += result.invalidCount;
    }
    return {
      storage: { version: CONFIG_VERSION, enable: general.enable, duration: general.duration, words, rules },
      temp,
      invalidCount,
    };
  }

  async function save(clickedBtn = null) {
    const { storage, temp, invalidCount } = collectFromDom();
    if (invalidCount > 0) {
      console.error('[bilibili_block] 存在无效自定义规则（选择器无法编译，或过滤模式缺少标题/UP主选择器），已跳过:', invalidCount);
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
