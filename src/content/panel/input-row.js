// 面板共享控件工具（v5）：小按钮工厂、title 闪烁、列表展开、剪贴板。
// 输入行本体由 sections/entries.js 组装（作用域下拉 + 临时勾选）。
import {
  BUTTON_CLICKED_CLASS,
  BUTTON_FLASH_MS,
  CHIP_DEL_CLASS,
  INPUT_BTN_CLASS,
  LI_HIDE_CLASS,
  LIST_EXPAND_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  SCOPE_PANE_CLASS,
  SCOPE_PANE_EXPANDED_CLASS,
} from '../constants.js'

let flashTimer = null

/**
 * buttonClicked —— title 闪烁（保留 Block_Obj 语义）。
 * @param {HTMLElement} button
 * @param {string} flashTitle
 */
export function buttonClicked(button, flashTitle) {
  const originalTitle = button.title
  button.title = flashTitle
  button.classList.add(BUTTON_CLICKED_CLASS)
  if (flashTimer) {
    window.clearTimeout(flashTimer)
  }
  flashTimer = window.setTimeout(() => {
    button.title = originalTitle
    button.classList.remove(BUTTON_CLICKED_CLASS)
    flashTimer = null
  }, BUTTON_FLASH_MS)
}

/**
 * 小按钮工厂。
 * @param {string} label
 * @param {string} title
 * @param {(e: MouseEvent) => void} callback
 * @returns {HTMLElement}
 */
export function createSpanBtn(label, title, callback) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = label
  btn.title = title
  btn.className = INPUT_BTN_CLASS
  btn.addEventListener('click', e => callback(e))
  return btn
}

/** 通知面板重新收集设置；筛选等纯展示变化不会触发。 */
export function notifyChange(element) {
  element.dispatchEvent(new CustomEvent('biliban:change', { bubbles: true }))
}

/** 共用的 SVG 移除按钮，词条和文字选择器使用相同图标。 */
export function createRemoveButton(label, callback) {
  const button = document.createElement('button')
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.className = CHIP_DEL_CLASS
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [name, value] of Object.entries({
    'viewBox': '0 0 24 24',
    'width': '14',
    'height': '14',
    'fill': 'none',
    'stroke': 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'aria-hidden': 'true',
    'focusable': 'false',
  })) icon.setAttribute(name, value)
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M18 6 6 18M6 6l12 12')
  icon.appendChild(path)
  button.appendChild(icon)
  button.addEventListener('click', callback)
  return button
}

/** 清空后可以撤销；后续列表编辑或成功保存时结束此次撤销。 */
export function createClearButton(list) {
  let removed = null
  let changing = false
  let button
  const reset = () => {
    removed = null
    button.textContent = '清空'
    button.title = '清空本列表，可撤销'
    button.classList.remove('block_obj_undo_button')
  }
  button = createSpanBtn('清空', '清空本列表，可撤销', () => {
    if (!removed && list.children.length === 0)
      return
    changing = true
    if (removed) {
      list.replaceChildren(...removed)
      reset()
    }
    else {
      removed = [...list.children]
      list.replaceChildren()
      button.textContent = '撤销'
      button.title = '恢复刚才清空的词条'
      button.classList.add('block_obj_undo_button')
    }
    notifyChange(list)
    changing = false
  })
  list.addEventListener('biliban:change', () => {
    if (!changing)
      reset()
  })
  // 保存成功才撤销备份；失败时仍可恢复。
  const saved = () => reset()
  button.addEventListener('biliban:saved', saved)
  button.classList.add('block_obj_clear_button')
  return button
}

/**
 * toggleList —— 聚焦展开某个列表：目标 classname 的 li 列表容器切换 expand 类，
 * 其余 li 与全部 br 切换隐藏。
 * @param {HTMLElement} ulNode
 * @param {string} liClassname
 */
export function toggleList(ulNode, liClassname) {
  let expanded = false
  for (const li of ulNode.querySelectorAll('li')) {
    if (li.classList.contains(liClassname)) {
      const listTextareaDiv = li.querySelector(`.${LIST_TEXTAREA_DIV_CLASS}`)
      if (listTextareaDiv) {
        listTextareaDiv.classList.toggle(LIST_EXPAND_CLASS)
        if (listTextareaDiv.classList.contains(LIST_EXPAND_CLASS)) {
          expanded = true
        }
      }
    }
    else {
      li.classList.toggle(LI_HIDE_CLASS)
    }
  }
  for (const br of ulNode.querySelectorAll('br')) {
    br.classList.toggle(LI_HIDE_CLASS)
  }
  const pane = ulNode.closest(`.${SCOPE_PANE_CLASS}`)
  if (pane) {
    pane.classList.toggle(SCOPE_PANE_EXPANDED_CLASS, expanded)
  }
}

/**
 * 剪贴板写入（按钮点击 = 用户手势；execCommand 兜底）。
 * @param {string} text
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    catch (fallbackError) {
      console.error('[bilibili_block] 复制到剪贴板失败:', fallbackError)
    }
  }
}
