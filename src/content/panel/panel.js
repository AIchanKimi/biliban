import { CONFIG_KEY, CONFIG_VERSION } from '../config/defaults.js'
import { SCOPES } from '../config/scopes.js'
import { canonicalJson, normalize } from '../config/store.js'
import { getTempEntries, setTempEntries } from '../config/temp-store.js'
// 设置面板主体（v5.1 标签页式管理，v6.3 shadcn 风格白底重绘）。保留壳行为：
//   - 520px 固定面板，bottom 6vh，right 0↔-530px 滑入滑出
//   - 页脚：保存状态，左 导出/导入，右 总开关 toggle/保存/关闭
//     （关闭收起后 800ms 按上次已保存重建，丢弃未保存编辑）
//   - rebuild 用于「关闭」与多标签页远端同步
// 结构：分类标签栏（全局/搜索/空间/播放/收藏）
//       → 每个分类一个面板页：屏蔽词组 + 时长组 + 规则组（默认折叠）。
// 临时词条写入独立存储，持久词条进配置；成功写入后才提示已保存。
import {
  BLOCK_OBJ_ID,
  CANCEL_REBUILD_MS,
  CLOSE_BUTTON_CLASS,
  FIELD_ID_PREFIX,
  MAIN_FIELDSET_CLASS,
  RULE_STATS_CLASS,
  RULE_STATS_HIT_CLASS,
  SAVE_BUTTON_CLASS,
  TAB_ACTIVE_CLASS,
  TAB_BAR_CLASS,
  TAB_CLASS,
  TAB_CURRENT_CLASS,
  TOOLS_BUTTON_CLASS,
  UL_NODE_CLASS,
  WRAP_DIV_CLASS,
  WRAP_HIDDEN_CLASS,
  WRAP_ID,
  WRAP_SHOW_CLASS,
} from '../constants.js'
import { categoryFor } from '../engine/category.js'
import { getRuleStats } from '../engine/rule-stats.js'
import { createGeneralSection } from './sections/general.js'
import { createScopePane } from './sections/scope-pane.js'

const STATS_REFRESH_MS = 1000

/**
 * @param {{
 *   initialConfig: Readonly<Record<string, unknown>>, // 存储形状 v5
 *   persist: (storageObject: Record<string, unknown>) => Promise<void>,
 *   onSaved: (storageObject: Readonly<Record<string, unknown>>) => void,
 * }} deps
 */
export function createPanel(deps) {
  const { initialConfig, persist, onSaved } = deps
  let config = { ...initialConfig }
  let wrapDiv = null
  let ulNode = null
  let generalSection = null
  let panes = []
  let tabButtons = []
  let activeScope = 'global'
  let savedSnapshot = ''
  let stateText = null
  let saveButton = null
  let saving = false
  let cancelTimer = null
  let display = false

  const tempWordsByScope = scope =>
    getTempEntries().filter(
      entry => entry.kind === 'word' && entry.scopes.includes(scope),
    )
  const tempDurationsByScope = scope =>
    getTempEntries().filter(
      entry => entry.kind === 'duration' && entry.scopes.includes(scope),
    )
  const entriesByScope = (list, scope) =>
    (list ?? []).filter(entry => entry.scopes.includes(scope))
  let statsTimer = null

  /** 隐藏的文件选择框（导入） */
  function createImportFileInput() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.style.display = 'none'
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }
      importSettings(await file.text())
      input.value = ''
    })
    return input
  }

  function build() {
    const importFileInput = createImportFileInput()
    wrapDiv = document.createElement('div')
    wrapDiv.id = WRAP_ID
    wrapDiv.className
      = `${WRAP_DIV_CLASS} ${display ? WRAP_SHOW_CLASS : WRAP_HIDDEN_CLASS}`
    const mainFieldset = document.createElement('fieldset')
    mainFieldset.id = `${BLOCK_OBJ_ID}_mainFieldset`
    mainFieldset.className = MAIN_FIELDSET_CLASS
    wrapDiv.appendChild(mainFieldset)
    ulNode = document.createElement('ul')
    ulNode.id = `${BLOCK_OBJ_ID}_ulNode`
    ulNode.className = UL_NODE_CLASS
    mainFieldset.appendChild(ulNode)

    wrapDiv.addEventListener('biliban:change', refreshDirtyState)
    wrapDiv.addEventListener('change', (event) => {
      if (event.target.matches('select, input[type="checkbox"]'))
        refreshDirtyState()
    })
    wrapDiv.addEventListener('input', (event) => {
      if (event.target.closest('.block_obj_rule_edit'))
        refreshDirtyState()
    })

    // ---- 通用（v6.7.1：总开关 toggle 位于页脚右侧「保存」左边，顶部不再占行）----
    generalSection = createGeneralSection(config)

    // ---- 分类标签栏 ----
    const tabBarLi = document.createElement('li')
    const tabBar = document.createElement('div')
    tabBar.className = TAB_BAR_CLASS
    // 当前页面匹配的分类：global 覆盖全部已匹配分类，与页面自身分类一并标记；
    // 未匹配页面仅 global 生效（v6.8 全局规则，如顶栏悬浮窗）
    const pageCategory = categoryFor(location.href)
    const currentScopes = new Set(
      pageCategory
        ? ['global', pageCategory]
        : ['global'],
    )
    tabButtons = SCOPES.map((scope) => {
      const tab = document.createElement('span')
      tab.id = `${FIELD_ID_PREFIX}tab_${scope.value}`
      tab.textContent = scope.label
      tab.title = currentScopes.has(scope.value)
        ? '当前页面生效的分类'
        : `管理「${scope.label}」分类下的屏蔽内容`
      tab.className = tabClassName(
        scope.value,
        scope.value === activeScope,
        currentScopes.has(scope.value),
      )
      tab.addEventListener('click', () => switchTab(scope.value))
      tabBar.appendChild(tab)
      return { scope: scope.value, tab }
    })
    tabBarLi.appendChild(tabBar)
    ulNode.appendChild(tabBarLi)

    // ---- 每个分类一个面板页 ----
    panes = SCOPES.map(({ value: scope }) => {
      const pane = createScopePane({
        scope,
        words: entriesByScope(config.words, scope),
        tempWords: tempWordsByScope(scope),
        durations: entriesByScope(config.durations, scope),
        tempDurations: tempDurationsByScope(scope),
        rules: config.rules,
      })
      pane.el.style.display = scope === activeScope
        ? ''
        : 'none'
      ulNode.appendChild(pane.el)
      return { scope, pane }
    })

    // ---- 底部单行页脚（v6.7.1）：左 导出/导入，右 总开关 toggle/保存/关闭 ----
    saveButton = createFooterBtn(
      SAVE_BUTTON_CLASS,
      '保存',
      '保存设置',
      () => { void save() },
    )
    const exportButton = createFooterBtn(
      TOOLS_BUTTON_CLASS,
      '导出',
      '下载全部设置为 JSON 文件（含全部规则）',
      () => {
        exportSettings()
      },
    )
    const importButton = createFooterBtn(
      TOOLS_BUTTON_CLASS,
      '导入',
      '从 JSON 文件导入全部设置',
      () => {
        importFileInput.click()
      },
    )
    const closeButton = createFooterBtn(
      CLOSE_BUTTON_CLASS,
      '关闭',
      '关闭设置窗口（丢弃未保存编辑）',
      (e) => {
        toggle()
        if (cancelTimer) {
          window.clearTimeout(cancelTimer)
        }
        cancelTimer = window.setTimeout(() => {
          display = false
          rebuild(config)
          cancelTimer = null
        }, CANCEL_REBUILD_MS)
        e.stopPropagation()
      },
    )

    const statusLi = document.createElement('li')
    statusLi.className = 'block_obj_save_status_row'
    stateText = document.createElement('span')
    stateText.className = 'block_obj_save_status'
    stateText.setAttribute('role', 'status')
    statusLi.appendChild(stateText)
    ulNode.appendChild(statusLi)

    const footerLi = document.createElement('li')
    footerLi.className = 'block_obj_footer_row'
    const secondary = document.createElement('span')
    secondary.className = 'block_obj_footer_secondary'
    secondary.appendChild(exportButton)
    secondary.appendChild(importButton)
    secondary.appendChild(importFileInput)
    const primary = document.createElement('span')
    primary.className = 'block_obj_footer_primary'
    // v6.7.1：总开关 toggle 置于「保存」左侧
    primary.appendChild(generalSection.el)
    primary.appendChild(saveButton)
    primary.appendChild(closeButton)
    footerLi.appendChild(secondary)
    footerLi.appendChild(primary)
    ulNode.appendChild(footerLi)
    document.body.appendChild(wrapDiv)
    savedSnapshot = snapshot()
    setStatus('没有未保存的更改', 'saved')
  }

  /** 全量导出为 JSON 文件下载（v6.1 起规则已含全部内置项，config 即全量） */
  function exportSettings() {
    const exported = { ...config }
    const blob = new Blob([
      JSON.stringify(exported, null, 2),
    ], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'biliban-settings.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  /** 从 JSON 文件导入：解析 → 规范化（含旧版本迁移）→ 写存储；多标签同步走 onChanged */
  function importSettings(text) {
    let parsed
    try {
      parsed = JSON.parse(text)
    }
    catch (error) {
      console.error('[bilibili_block] 导入失败，JSON 解析错误:', error)
      return
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.error('[bilibili_block] 导入失败：内容不是有效的配置对象')
      return
    }
    let normalized
    try {
      normalized = normalize(parsed)
    }
    catch (error) {
      console.error('[bilibili_block] 导入失败：', error)
      return
    }
    chrome.storage.local.set({ [CONFIG_KEY]: normalized })
  }

  /** tab 类名：选中态与「当前页面」标记可叠加 */
  function tabClassName(scopeValue, isActive, isCurrent) {
    const base = isActive ? TAB_ACTIVE_CLASS : TAB_CLASS
    return isCurrent
      ? `${base} ${TAB_CURRENT_CLASS}`
      : base
  }

  function switchTab(scope) {
    activeScope = scope
    const pageCategory = categoryFor(location.href)
    const currentScopes = new Set(
      pageCategory
        ? ['global', pageCategory]
        : ['global'],
    )
    for (const { scope: s, tab } of tabButtons) {
      tab.className = tabClassName(s, s === scope, currentScopes.has(s))
    }
    for (const { scope: s, pane } of panes) {
      pane.el.style.display = s === scope
        ? ''
        : 'none'
    }
  }

  function createFooterBtn(classname, label, title, callback) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = label
    btn.title = title
    btn.className = classname
    btn.addEventListener('click', e => callback(e))
    return btn
  }

  /** DOM → { storage 存储形状, temp 临时词条 }（遍历全部分类页） */
  function collectFromDom() {
    const general = generalSection.collect()
    const words = []
    const durations = []
    const temp = []
    const rules = []
    for (const { pane } of panes) {
      const result = pane.collect()
      words.push(...result.words.persistent)
      durations.push(...result.durations.persistent)
      temp.push(
        ...result.words.temp.map(entry => ({ ...entry, kind: 'word' })),
        ...result.durations.temp.map(entry => ({
          ...entry,
          kind: 'duration',
        })),
      )
      rules.push(...result.rules)
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
    }
  }

  /** 命中统计徽标刷新（面板可见期间每秒一次） */
  function refreshStatsBadges() {
    if (!wrapDiv) {
      return
    }
    const stats = getRuleStats()
    for (const badge of wrapDiv.getElementsByClassName(RULE_STATS_CLASS)) {
      const entry = stats[badge.dataset.ruleId]
      badge.textContent = entry
        ? `找到 ${entry.found} · 隐藏 ${entry.hidden}`
        : '找到 0 个'
      badge.classList.toggle(
        RULE_STATS_HIT_CLASS,
        Boolean(entry && entry.found > 0),
      )
    }
  }

  function startStatsTimer() {
    if (statsTimer) {
      return
    }
    refreshStatsBadges()
    statsTimer = window.setInterval(refreshStatsBadges, STATS_REFRESH_MS)
  }

  function stopStatsTimer() {
    if (statsTimer) {
      window.clearInterval(statsTimer)
      statsTimer = null
    }
  }

  function snapshot() {
    return canonicalJson(collectFromDom())
  }

  function setStatus(message, state) {
    stateText.textContent = message
    stateText.dataset.state = state
  }

  function refreshDirtyState() {
    if (!stateText || saving)
      return
    const dirty = snapshot() !== savedSnapshot
    setStatus(dirty ? '有未保存的更改' : '没有未保存的更改', dirty ? 'dirty' : 'saved')
  }

  async function save() {
    if (saving)
      return
    const values = collectFromDom()
    const pending = canonicalJson(values)
    saving = true
    saveButton.disabled = true
    saveButton.textContent = '保存中…'
    setStatus('正在保存…', 'saving')
    try {
      await setTempEntries(values.temp)
      await persist(values.storage)
      config = values.storage
      savedSnapshot = pending
      onSaved(values.storage)
      const dirty = snapshot() !== savedSnapshot
      setStatus(dirty ? '有未保存的更改' : '已保存', dirty ? 'dirty' : 'success')
      if (!dirty) {
        for (const button of wrapDiv.querySelectorAll('.block_obj_clear_button')) {
          button.dispatchEvent(new Event('biliban:saved'))
        }
      }
    }
    catch (error) {
      console.error('[bilibili_block] 保存失败:', error)
      setStatus('保存失败，请重试', 'error')
    }
    finally {
      saving = false
      saveButton.disabled = false
      saveButton.textContent = '保存'
    }
  }

  function toggle() {
    const panel = document.getElementById(WRAP_ID)
    if (panel) {
      if (panel.classList.contains(WRAP_SHOW_CLASS)) {
        display = false
        panel.classList.remove(WRAP_SHOW_CLASS)
        panel.classList.add(WRAP_HIDDEN_CLASS)
        stopStatsTimer()
      }
      else {
        display = true
        panel.classList.remove(WRAP_HIDDEN_CLASS)
        panel.classList.add(WRAP_SHOW_CLASS)
        startStatsTimer()
      }
    }
  }

  /** 销毁并按新配置重建（取消 / 远端同步）；临时词条从 temp-store 重新渲染。 */
  function rebuild(newConfig = null) {
    config = newConfig
      ? { ...newConfig }
      : config
    stopStatsTimer()
    const existing = document.getElementById(WRAP_ID)
    if (existing) {
      existing.remove()
    }
    build()
    if (display) {
      startStatsTimer()
    }
  }

  function init() {
    build()
  }

  return { init, toggle, save, rebuild }
}
