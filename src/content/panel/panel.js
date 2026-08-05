// 设置面板主体（v5.1 标签页式管理，v6.3 shadcn 风格白底重绘）。保留壳行为：
//   - 520px 固定面板，bottom 6vh，right 0↔-530px 滑入滑出
//   - 底部单行页脚：左 导出/导入，右 总开关 toggle/保存（闪「已保存」1s）/关闭
//     （关闭收起后 800ms 按上次已保存重建，丢弃未保存编辑）
//   - rebuild 用于「关闭」与多标签页远端同步
// 结构：分类标签栏（全局/搜索/空间/播放/收藏）
//       → 每个分类一个面板页：屏蔽词组 + 时长组 + 规则组（默认折叠）。
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
  CLOSE_BUTTON_CLASS,
  TOOLS_BUTTON_CLASS,
  SAVE_FLASH_MS,
  CANCEL_REBUILD_MS,
  TAB_BAR_CLASS,
  TAB_CLASS,
  TAB_ACTIVE_CLASS,
} from "../constants.js";
import { CONFIG_VERSION, CONFIG_KEY } from "../config/defaults.js";
import { SCOPES } from "../config/scopes.js";
import { getTempEntries, setTempEntries } from "../config/temp-store.js";
import { normalize } from "../config/store.js";
import { getRuleStats } from "../engine/rule-stats.js";
import { categoryFor } from "../engine/category.js";
import {
  RULE_STATS_CLASS,
  RULE_STATS_HIT_CLASS,
  TAB_CURRENT_CLASS,
} from "../constants.js";
import { createGeneralSection } from "./sections/general.js";
import { createScopePane } from "./sections/scope-pane.js";
import { SAVE_FLASH_TEXT } from "./panel-text.js";

const STATS_REFRESH_MS = 1000;

/**
 * @param {{
 *   initialConfig: Readonly<Record<string, unknown>>, // 存储形状 v5
 *   persist: (storageObject: Record<string, unknown>) => Promise<void>,
 *   onSaved: (storageObject: Readonly<Record<string, unknown>>) => void,
 * }} deps
 */
export function createPanel(deps) {
  const { initialConfig, persist, onSaved } = deps;
  let config = { ...initialConfig };
  let wrapDiv = null;
  let ulNode = null;
  let generalSection = null;
  let panes = [];
  let tabButtons = [];
  let activeScope = "global";
  let saveTimer = null;
  let cancelTimer = null;
  let display = false;

  const tempWordsByScope = (scope) =>
    getTempEntries().filter(
      (entry) => entry.kind === "word" && entry.scopes.includes(scope),
    );
  const tempDurationsByScope = (scope) =>
    getTempEntries().filter(
      (entry) => entry.kind === "duration" && entry.scopes.includes(scope),
    );
  const entriesByScope = (list, scope) =>
    (list ?? []).filter((entry) => entry.scopes.includes(scope));
  let statsTimer = null;

  /** 隐藏的文件选择框（导入） */
  function createImportFileInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      importSettings(await file.text());
      input.value = "";
    });
    return input;
  }

  function build() {
    const importFileInput = createImportFileInput();
    wrapDiv = document.createElement("div");
    wrapDiv.id = WRAP_ID;
    wrapDiv.className =
      WRAP_DIV_CLASS + " " + (display ? WRAP_SHOW_CLASS : WRAP_HIDDEN_CLASS);
    const mainFieldset = document.createElement("fieldset");
    mainFieldset.id = BLOCK_OBJ_ID + "_mainFieldset";
    mainFieldset.className = MAIN_FIELDSET_CLASS;
    wrapDiv.appendChild(mainFieldset);
    ulNode = document.createElement("ul");
    ulNode.id = BLOCK_OBJ_ID + "_ulNode";
    ulNode.className = UL_NODE_CLASS;
    mainFieldset.appendChild(ulNode);

    // ---- 通用（v6.7.1：总开关 toggle 位于页脚右侧「保存」左边，顶部不再占行）----
    generalSection = createGeneralSection(config);

    // ---- 分类标签栏 ----
    const tabBarLi = document.createElement("li");
    const tabBar = document.createElement("div");
    tabBar.className = TAB_BAR_CLASS;
    // 当前页面匹配的分类：global 覆盖全部已匹配分类，与页面自身分类一并标记；
    // 未匹配页面仅 global 生效（v6.8 全局规则，如顶栏悬浮窗）
    const pageCategory = categoryFor(location.href);
    const currentScopes = new Set(
      pageCategory ? ["global", pageCategory] : ["global"],
    );
    tabButtons = SCOPES.map((scope) => {
      const tab = document.createElement("span");
      tab.id = FIELD_ID_PREFIX + "tab_" + scope.value;
      tab.textContent = scope.label;
      tab.title = currentScopes.has(scope.value)
        ? "当前页面生效的分类"
        : "管理「" + scope.label + "」分类下的屏蔽内容";
      tab.className = tabClassName(
        scope.value,
        scope.value === activeScope,
        currentScopes.has(scope.value),
      );
      tab.addEventListener("click", () => switchTab(scope.value));
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
        tempWords: tempWordsByScope(scope),
        durations: entriesByScope(config.durations, scope),
        tempDurations: tempDurationsByScope(scope),
        rules: config.rules,
      });
      pane.el.style.display = scope === activeScope ? "" : "none";
      ulNode.appendChild(pane.el);
      return { scope, pane };
    });

    // ---- 底部单行页脚（v6.7.1）：左 导出/导入，右 总开关 toggle/保存/关闭 ----
    const saveButton = createFooterBtn(
      SAVE_BUTTON_CLASS,
      "保存",
      "保存设置",
      () => {
        saveButton.textContent = SAVE_FLASH_TEXT;
        if (saveTimer) {
          window.clearTimeout(saveTimer);
        }
        saveTimer = window.setTimeout(() => {
          saveButton.textContent = "保存";
          saveTimer = null;
        }, SAVE_FLASH_MS);
        save(saveButton);
      },
    );
    const exportButton = createFooterBtn(
      TOOLS_BUTTON_CLASS,
      "导出",
      "下载全部设置为 JSON 文件（含全部规则）",
      () => {
        exportSettings();
      },
    );
    const importButton = createFooterBtn(
      TOOLS_BUTTON_CLASS,
      "导入",
      "从 JSON 文件导入全部设置",
      () => {
        importFileInput.click();
      },
    );
    const closeButton = createFooterBtn(
      CLOSE_BUTTON_CLASS,
      "关闭",
      "关闭设置窗口（丢弃未保存编辑）",
      (e) => {
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
      },
    );

    const footerLi = document.createElement("li");
    footerLi.className = "block_obj_footer_row";
    const secondary = document.createElement("span");
    secondary.className = "block_obj_footer_secondary";
    secondary.appendChild(exportButton);
    secondary.appendChild(importButton);
    secondary.appendChild(importFileInput);
    const primary = document.createElement("span");
    primary.className = "block_obj_footer_primary";
    // v6.7.1：总开关 toggle 置于「保存」左侧
    primary.appendChild(generalSection.el);
    primary.appendChild(saveButton);
    primary.appendChild(closeButton);
    footerLi.appendChild(secondary);
    footerLi.appendChild(primary);
    ulNode.appendChild(footerLi);
    document.body.appendChild(wrapDiv);
  }

  /** 全量导出为 JSON 文件下载（v6.1 起规则已含全部内置项，config 即全量） */
  function exportSettings() {
    const exported = { ...config };
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "biliban-settings.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  /** 从 JSON 文件导入：解析 → 规范化（含旧版本迁移）→ 写存储；多标签同步走 onChanged */
  function importSettings(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.error("[bilibili_block] 导入失败，JSON 解析错误:", error);
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("[bilibili_block] 导入失败：内容不是有效的配置对象");
      return;
    }
    const normalized = normalize(parsed);
    chrome.storage.local.set({ [CONFIG_KEY]: normalized });
  }

  /** tab 类名：选中态与「当前页面」标记可叠加 */
  function tabClassName(scopeValue, isActive, isCurrent) {
    const base = isActive ? TAB_ACTIVE_CLASS : TAB_CLASS;
    return isCurrent ? base + " " + TAB_CURRENT_CLASS : base;
  }

  function switchTab(scope) {
    activeScope = scope;
    const pageCategory = categoryFor(location.href);
    const currentScopes = new Set(
      pageCategory ? ["global", pageCategory] : ["global"],
    );
    for (const { scope: s, tab } of tabButtons) {
      tab.className = tabClassName(s, s === scope, currentScopes.has(s));
    }
    for (const { scope: s, pane } of panes) {
      pane.el.style.display = s === scope ? "" : "none";
    }
  }

  function createFooterBtn(classname, label, title, callback) {
    const btn = document.createElement("span");
    btn.textContent = label;
    btn.title = title;
    btn.className = classname;
    btn.addEventListener("click", (e) => callback(e));
    return btn;
  }

  /** DOM → { storage 存储形状, temp 临时词条 }（遍历全部分类页） */
  function collectFromDom() {
    const general = generalSection.collect();
    const words = [];
    const durations = [];
    const temp = [];
    const rules = [];
    for (const { pane } of panes) {
      const result = pane.collect();
      words.push(...result.words.persistent);
      durations.push(...result.durations.persistent);
      temp.push(
        ...result.words.temp.map((entry) => ({ ...entry, kind: "word" })),
        ...result.durations.temp.map((entry) => ({
          ...entry,
          kind: "duration",
        })),
      );
      rules.push(...result.rules);
    }
    return {
      storage: {
        version: CONFIG_VERSION,
        enable: general.enable,
        words,
        durations,
        rules,
      },
      temp,
    };
  }

  /** 命中统计徽标刷新（面板可见期间每秒一次） */
  function refreshStatsBadges() {
    if (!wrapDiv) {
      return;
    }
    const stats = getRuleStats();
    for (const badge of wrapDiv.getElementsByClassName(RULE_STATS_CLASS)) {
      const entry = stats[badge.dataset.ruleId];
      badge.textContent = entry
        ? `找到 ${entry.found} · 隐藏 ${entry.hidden}`
        : "未命中";
      badge.classList.toggle(
        RULE_STATS_HIT_CLASS,
        Boolean(entry && entry.found > 0),
      );
    }
  }

  function startStatsTimer() {
    if (statsTimer) {
      return;
    }
    refreshStatsBadges();
    statsTimer = window.setInterval(refreshStatsBadges, STATS_REFRESH_MS);
  }

  function stopStatsTimer() {
    if (statsTimer) {
      window.clearInterval(statsTimer);
      statsTimer = null;
    }
  }

  async function save() {
    const { storage, temp } = collectFromDom();
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
        stopStatsTimer();
      } else {
        display = true;
        panel.classList.remove(WRAP_HIDDEN_CLASS);
        panel.classList.add(WRAP_SHOW_CLASS);
        startStatsTimer();
      }
    }
  }

  /** 销毁并按新配置重建（取消 / 远端同步）；临时词条从 temp-store 重新渲染。 */
  function rebuild(newConfig = null) {
    config = newConfig ? { ...newConfig } : config;
    stopStatsTimer();
    const existing = document.getElementById(WRAP_ID);
    if (existing) {
      existing.remove();
    }
    build();
    if (display) {
      startStatsTimer();
    }
  }

  function init() {
    build();
  }

  return { init, toggle, save, rebuild };
}
