import { TEMP_DEFAULT_HOURS } from '../../config/defaults.js'
// 面板分节：时长屏蔽词条组（v5.2 词条化，替代原全局开关）。
// 每条词条 = 比较方向（短于/长于）+ 阈值（秒，右侧实时预览 B 站格式），作用域随所在标签页；支持「临时」。
import {
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
  CHIP_CLASS,
  FIELD_ID_PREFIX,
  INPUT_DIV_CLASS,
  LIST_DIV_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  NUMBER_INPUT_CLASS,
  SELECT_CLASS,
  SEPARATOR_TEXT_CLASS,
} from '../../constants.js'
import { formatDuration } from '../../engine/duration.js'
import { createChip } from '../chips.js'
import { buttonClicked, createClearButton, createSpanBtn, notifyChange } from '../input-row.js'

/** 词条 → chip 显示文案（<60s 显示秒；整分钟显示分钟；其余显示秒） */
export function durationLabel(entry) {
  const s = entry.seconds
  const text = s < 60 || s % 60 !== 0
    ? `${s} 秒`
    : `${s / 60} 分钟`
  return (entry.op === 'lt'
    ? '短于 '
    : '长于 ') + text
}

/** chip 根节点 → 时长词条（读 dataset，不依赖文本真值） */
function chipToDuration(chip) {
  const op = chip.dataset.op
  const seconds = Number(chip.dataset.seconds)
  if (
    (op !== 'lt' && op !== 'gt')
    || !Number.isFinite(seconds)
    || seconds <= 0
  ) {
    return null
  }
  const scopes
    = typeof chip.dataset.scopes === 'string' && chip.dataset.scopes !== ''
      ? chip.dataset.scopes.split(',')
      : ['global']
  const entry = {
    op,
    seconds,
    scopes,
    temp: chip.dataset.temp === '1',
  }
  const expiresAt = Number(chip.dataset.expiresAt)
  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    entry.expiresAt = expiresAt
  }
  return entry
}

/**
 * @param {HTMLElement} listEl
 * @returns {{ persistent: Array<{ op: string, seconds: number, scopes: string[] }>, temp: Array<{ op: string, seconds: number, scopes: string[] }> }}
 */
export function extractDurationsFromEl(listEl) {
  const persistent = []
  const temp = []
  for (const chip of [
    ...listEl.getElementsByClassName(CHIP_CLASS),
  ].reverse()) {
    const entry = chipToDuration(chip)
    if (!entry) {
      continue
    }
    const scoped = {
      op: entry.op,
      seconds: entry.seconds,
      scopes: entry.scopes,
    }
    if (entry.temp) {
      if (entry.expiresAt) {
        scoped.expiresAt = entry.expiresAt // 续存原有到期时间
      }
      temp.push(scoped)
    }
    else {
      persistent.push(scoped)
    }
  }
  return { persistent, temp }
}

/**
 * @param {{
 *   scope: string,
 *   entries: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   tempEntries: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 * }} params
 * @returns {{ lis: HTMLElement[], collect: () => { persistent: Array<object>, temp: Array<object> } }}
 */
export function createDurationsGroup(params) {
  const { scope, entries, tempEntries } = params
  const opId = `${FIELD_ID_PREFIX}durationOp_${scope}`
  const secondsId = `${FIELD_ID_PREFIX}durationSeconds_${scope}`
  const previewId = `${FIELD_ID_PREFIX}durationPreview_${scope}`
  const tempId = `${FIELD_ID_PREFIX}durationTemp_${scope}`
  const listId = `${FIELD_ID_PREFIX}durations_${scope}`

  const inputLi = document.createElement('li')
  const inputDiv = document.createElement('div')
  inputDiv.className = INPUT_DIV_CLASS

  const opSelect = document.createElement('select')
  opSelect.id = opId
  opSelect.className = SELECT_CLASS
  opSelect.title = '比较方向'
  for (const [value, label] of [
    ['lt', '短于'],
    ['gt', '长于'],
  ]) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    opSelect.appendChild(option)
  }

  const secondsInput = document.createElement('input')
  secondsInput.type = 'number'
  secondsInput.id = secondsId
  secondsInput.className = NUMBER_INPUT_CLASS
  secondsInput.min = '1'
  secondsInput.step = '1'
  secondsInput.placeholder = '秒'
  secondsInput.setAttribute('aria-label', '视频时长阈值（秒）')
  secondsInput.title = '阈值（秒），如 15 表示 15 秒'
  // 右侧实时预览为 B 站时长格式（22:24 / 01:17:44）
  const previewSpan = document.createElement('span')
  previewSpan.id = previewId
  previewSpan.className = 'block_obj_duration_preview'
  previewSpan.textContent = '—'
  const refreshPreview = () => {
    const seconds = Math.round(Number.parseFloat(secondsInput.value))
    previewSpan.textContent
      = Number.isFinite(seconds) && seconds > 0
        ? formatDuration(seconds)
        : '—'
  }
  secondsInput.addEventListener('input', refreshPreview)

  const tempCheckbox = document.createElement('input')
  tempCheckbox.type = 'checkbox'
  tempCheckbox.id = tempId
  tempCheckbox.className = CHECKBOX_INPUT_CLASS
  tempCheckbox.title = '临时词条：固定 1 小时有效期，到期后自动清除'
  const tempLabel = document.createElement('label')
  tempLabel.htmlFor = tempId
  tempLabel.className = CHECKBOX_LABEL_CLASS
  tempLabel.textContent = '临时'
  tempLabel.title = tempCheckbox.title

  const listEl = document.createElement('div')
  listEl.id = listId
  listEl.className = LIST_TEXTAREA_DIV_CLASS

  const seedOne = (entry) => {
    const dataset = {
      op: entry.op,
      seconds: String(entry.seconds),
    }
    if (entry.expiresAt) {
      dataset.expiresAt = String(entry.expiresAt)
    }
    listEl.insertAdjacentElement(
      'afterbegin',
      createChip({
        value: `${entry.op}:${entry.seconds}`,
        label: durationLabel(entry),
        scopes: entry.scopes,
        temp: Boolean(entry.temp),
        dataset,
      }),
    )
  }
  for (const entry of entries ?? []) {
    seedOne(entry)
  }
  for (const entry of tempEntries ?? []) {
    seedOne({ ...entry, temp: true })
  }

  const addEntry = () => {
    const seconds = Math.round(Number.parseFloat(secondsInput.value))
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return false
    }
    const candidate = {
      op: opSelect.value,
      seconds,
      scopes: [scope],
    }
    const { persistent, temp } = extractDurationsFromEl(listEl)
    const dup = [
      ...persistent,
      ...temp,
    ].some(
      e => e.op === candidate.op && e.seconds === candidate.seconds,
    )
    if (dup) {
      return false
    }
    const dataset = {
      op: candidate.op,
      seconds: String(candidate.seconds),
    }
    if (tempCheckbox.checked) {
      dataset.expiresAt = String(Date.now() + TEMP_DEFAULT_HOURS * 3600_000)
    }
    listEl.insertAdjacentElement(
      'afterbegin',
      createChip({
        value: `${candidate.op}:${candidate.seconds}`,
        label: durationLabel(candidate),
        scopes: candidate.scopes,
        temp: tempCheckbox.checked,
        dataset,
      }),
    )
    secondsInput.value = ''
    refreshPreview()
    notifyChange(listEl)
    return true
  }

  const addBtn = createSpanBtn('添加', '添加时长词条', () => {
    if (addEntry()) {
      buttonClicked(addBtn, '添加成功')
    }
  })
  const clearBtn = createClearButton(listEl)

  inputDiv.appendChild(opSelect)
  inputDiv.appendChild(secondsInput)
  inputDiv.appendChild(previewSpan)
  inputDiv.appendChild(tempCheckbox)
  inputDiv.appendChild(tempLabel)
  inputDiv.appendChild(addBtn)
  const hint = document.createElement('div')
  hint.className = 'block_obj_field_hint'
  hint.textContent = '按秒添加，临时条件 1 小时后失效'
  inputLi.append(inputDiv, hint)

  const listLi = document.createElement('li')
  const listDiv = document.createElement('div')
  listDiv.className = LIST_DIV_CLASS
  listDiv.appendChild(listEl)
  listLi.appendChild(listDiv)

  // ---- 分节头（v6.4：标题居左、列表操作居右）----
  const headerLi = document.createElement('li')
  const headerDiv = document.createElement('div')
  headerDiv.className = 'block_obj_section_header'
  const sectionLabel = document.createElement('span')
  sectionLabel.className = SEPARATOR_TEXT_CLASS
  sectionLabel.textContent = '时长屏蔽'
  sectionLabel.title
    = '卡片内出现 1:23 / 1:02:03 形式的时长且满足任一词条时屏蔽'
  const actions = document.createElement('span')
  actions.className = 'block_obj_section_actions'
  actions.appendChild(clearBtn)
  headerDiv.appendChild(sectionLabel)
  headerDiv.appendChild(actions)
  headerLi.appendChild(headerDiv)

  function collect() {
    return extractDurationsFromEl(listEl)
  }

  return {
    lis: [headerLi, inputLi, listLi],
    collect,
  }
}
