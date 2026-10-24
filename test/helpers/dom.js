import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { mockChrome } from './chrome.js'

const html = readFileSync(resolve(import.meta.dirname, '../fixtures/cards.html'), 'utf8')
export function rule(overrides = {}) {
  return {
    id: 'test-card',
    selector: '.card',
    scopes: ['play'],
    mode: 'match',
    textSelectors: ['.title', '.author'],
    durationSelector: '.duration',
    enabled: true,
    ...overrides,
  }
}
export function config(overrides = {}) {
  return {
    version: 5,
    enable: true,
    words: [],
    durations: [],
    rules: [
      rule(),
    ],
    ...overrides,
  }
}
export function word(value, scope = 'global') {
  return {
    value,
    scopes: [scope],
  }
}
export const wrap = '#blockObj_bilibiliConfig_wrapDiv'
export const hidden = id => expect(document.getElementById(id).classList.contains('block_obj_none')).toBe(true)
export const shown = id => expect(document.getElementById(id).classList.contains('block_obj_none')).toBe(false)
export const tick = async (ms = 32) => vi.advanceTimersByTimeAsync(ms)
export const find = selector => document.querySelector(selector)
export function click(label, parent = document) {
  const element = [
    ...parent.querySelectorAll('button, span, label'),
  ].find(el => el.textContent === label)
  if (!element)
    throw new Error(`找不到操作：${label}`)
  element.click()
}
export function fill(selector, value) {
  const element = find(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}
export function addWords(value, scope = 'global') {
  find(`#bilibiliConfig_tab_${scope}`).click()
  const selector = `#bilibiliConfig_wordInput_${scope}`
  fill(selector, value)
  find(selector).dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
}
export const openPanel = () => find('#blockObj_bilibiliConfig_expandSpan').click()
export async function save() {
  find(`${wrap} [title="保存设置"]`).click()
  await tick()
}

// 模拟 Chrome API；执行真实装配、面板、引擎和 MutationObserver。
// 每次重挂载重置模块、DOM、定时器和观察器，避免用例间状态污染。
const observers = new Set()
function clearView() {
  for (const observer of observers) observer.disconnect()
  observers.clear()
  vi.clearAllTimers()
  document.head.innerHTML = ''
  document.body.innerHTML = html
}
beforeEach(() => {
  vi.useFakeTimers()
  const OriginalObserver = globalThis.MutationObserver
  vi.stubGlobal('MutationObserver', class extends OriginalObserver {
    constructor(callback) {
      super(callback)
      observers.add(this)
    }
  })
})
afterEach(() => {
  clearView()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
export async function mount(initial = config(), url = 'https://www.bilibili.com/video/test') {
  const { store } = mockChrome({ bilibili_config: initial, bilibili_temp_entries: [] })
  async function reload(nextUrl = url) {
    clearView()
    vi.resetModules()
    window.history.replaceState({}, '', nextUrl)
    const { start } = await import('../../src/content/main.js')
    await start()
    await tick()
  }
  await reload()
  return {
    store,
    reload,
    async seed(value) {
      await chrome.storage.local.set({ bilibili_config: value })
      await tick()
    },
    async temporary(entries) {
      await chrome.storage.local.set({ bilibili_temp_entries: entries })
      await tick()
    },
  }
}
