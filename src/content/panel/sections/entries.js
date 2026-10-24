import { TEMP_DEFAULT_HOURS } from '../../config/defaults.js'
import { parseRegexLiteral, REGEX_LITERAL_RE } from '../../config/serialize.js'
// 面板分节：屏蔽词条组（某作用域标签页内一组）。
// 词条判定逐字段进行（规则文字选择器提取的每段文本独立判定，任一命中即屏蔽，v6.2）；
// 作用域由所在标签页决定，输入行不带作用域选择。
// 保存收集以 DOM chips 为准：持久词条入存储，临时词条回写 temp-store。
import {
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
  CHIP_CLASS,
  CHIP_FILTERED_CLASS,
  FIELD_ID_PREFIX,
  INPUT_CLASS,
  INPUT_DIV_CLASS,
  LI_LIST_CLASS,
  LIST_DIV_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  SEPARATOR_TEXT_CLASS,
} from '../../constants.js'
import { stringToArray } from '../../util/string-to-array.js'
import {
  extractEntriesFromEl,
  filterChips,
  prependEntry,
  seedEntries,
} from '../chips.js'
import {
  buttonClicked,
  copyToClipboard,
  createClearButton,
  createSpanBtn,
  notifyChange,
  toggleList,
} from '../input-row.js'

/**
 * 新词条校验：空/纯空白拒绝；正则字面量必须可编译。
 * @param {string} value
 * @returns {boolean}
 */
export function isValidNewEntry(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }
  if (REGEX_LITERAL_RE.test(value)) {
    const parsed = parseRegexLiteral(value)
    try {
      const expression = new RegExp(parsed.pattern, parsed.flags)
      return expression instanceof RegExp
    }
    catch {
      return false
    }
  }
  return true
}

/**
 * @param {{
 *   scope: string,
 *   liClassname: string,
 *   entries: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempEntries: ReadonlyArray<{ value: string, scopes: string[] }>,
 * }} params
 * @returns {{ lis: HTMLElement[], collect: () => { persistent: Array<{ value: string, scopes: string[] }>, temp: Array<{ value: string, scopes: string[] }> } }}
 */
export function createEntriesGroup(params) {
  const { scope, liClassname, entries, tempEntries } = params
  const inputId = `${FIELD_ID_PREFIX}wordInput_${scope}`
  const tempId = `${FIELD_ID_PREFIX}wordTemp_${scope}`
  const listId = `${FIELD_ID_PREFIX}words_${scope}`

  // ---- 输入行（v6.4：输入框弹性占满整行，无前缀文案）----
  const inputLi = document.createElement('li')
  inputLi.className = liClassname
  const inputDiv = document.createElement('div')
  inputDiv.className = INPUT_DIV_CLASS
  const input = document.createElement('input')
  input.type = 'text'
  input.id = inputId
  input.className = INPUT_CLASS
  input.placeholder = '输入关键词，筛选已有词条'
  input.setAttribute('aria-label', '添加或筛选屏蔽词')
  input.title
    = '输入即筛选下方词条；回车添加。普通词按字段包含匹配，/正则/ 按字段匹配；点击词条旁的 × 删除'

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
  seedEntries(listEl, entries, tempEntries)

  const hint = document.createElement('div')
  hint.className = 'block_obj_entry_hint'
  const guidance = document.createElement('span')
  guidance.textContent = '回车添加 · 逗号分隔 · 支持 /正则/'
  const counter = document.createElement('span')
  counter.id = `${FIELD_ID_PREFIX}wordCount_${scope}`
  counter.className = 'block_obj_entry_count'
  counter.setAttribute('role', 'status')
  hint.append(guidance, counter)
  const empty = document.createElement('div')
  empty.className = 'block_obj_entry_empty'
  empty.hidden = true
  const refresh = () => {
    filterChips(listEl, input.value)
    const chips = [
      ...listEl.getElementsByClassName(CHIP_CLASS),
    ]
    const visible = chips.filter(chip => !chip.classList.contains(CHIP_FILTERED_CLASS)).length
    const filtering = input.value.trim() !== ''
    counter.textContent = filtering
      ? `找到 ${visible} / ${chips.length} 条`
      : `共 ${chips.length} 条`
    empty.hidden = !filtering || visible > 0
    empty.textContent = '没有匹配词条，按回车可添加新词'
    listEl.classList.toggle('block_obj_list_no_results', filtering && visible === 0)
  }
  listEl.addEventListener('biliban:change', refresh)

  const addItems = () => {
    const textValue = input.value
    if (!textValue) {
      return false
    }
    const temp = tempCheckbox.checked
    const dataset = temp
      ? {
          expiresAt: String(Date.now() + TEMP_DEFAULT_HOURS * 3600_000),
        }
      : undefined
    // v6.2：输入值 trim（trim 后为空则丢弃）
    const values = stringToArray(textValue)
      .map(value => value.trim())
      .filter(isValidNewEntry)
    if (values.length === 0) {
      return false
    }
    let inserted = false
    for (const value of values) {
      if (prependEntry(listEl, {
        value,
        scopes: [scope],
        temp,
        dataset,
      })) {
        inserted = true
      }
    }
    input.value = ''
    refresh()
    if (inserted)
      notifyChange(listEl)
    return inserted
  }

  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      addItems()
    }
  })
  input.addEventListener('input', refresh)

  const addBtn = createSpanBtn('添加', '添加内容到列表中', () => {
    if (addItems()) {
      buttonClicked(addBtn, '添加成功')
    }
  })
  const clearBtn = createClearButton(listEl)
  const copyBtn = createSpanBtn('复制', '复制列表', async () => {
    const { persistent, temp } = extractEntriesFromEl(listEl)
    const text = [
      ...persistent,
      ...temp,
    ]
      .map(entry => entry.value)
      .toString()
    await copyToClipboard(text)
    buttonClicked(copyBtn, '复制成功')
  })
  const expandBtn = createSpanBtn('展开', '展开列表', () => {
    const ulNode = inputLi.closest('ul')
    if (ulNode) {
      toggleList(ulNode, liClassname)
    }
    if (expandBtn.textContent === '展开') {
      expandBtn.textContent = '收起'
      expandBtn.title = '收起列表'
    }
    else {
      expandBtn.textContent = '展开'
      expandBtn.title = '展开列表'
    }
  })

  inputDiv.appendChild(input)
  inputDiv.appendChild(tempCheckbox)
  inputDiv.appendChild(tempLabel)
  inputDiv.appendChild(addBtn)
  inputLi.append(inputDiv, hint)

  // ---- 列表行 ----
  const listLi = document.createElement('li')
  listLi.className = `${liClassname} ${LI_LIST_CLASS}`
  const listDiv = document.createElement('div')
  listDiv.className = LIST_DIV_CLASS
  listDiv.append(listEl, empty)
  listLi.appendChild(listDiv)

  // ---- 分节头（v6.4：标题居左、列表操作居右，替代旧黄色分隔行）----
  const headerLi = document.createElement('li')
  headerLi.className = liClassname
  const headerDiv = document.createElement('div')
  headerDiv.className = 'block_obj_section_header'
  const sectionLabel = document.createElement('span')
  sectionLabel.className = SEPARATOR_TEXT_CLASS
  sectionLabel.textContent = '屏蔽词'
  sectionLabel.title = '普通词按字段包含匹配，正则逐字段匹配'
  const actions = document.createElement('span')
  actions.className = 'block_obj_section_actions'
  actions.appendChild(clearBtn)
  actions.appendChild(copyBtn)
  actions.appendChild(expandBtn)
  headerDiv.appendChild(sectionLabel)
  headerDiv.appendChild(actions)
  headerLi.appendChild(headerDiv)

  refresh()

  function collect() {
    return extractEntriesFromEl(listEl)
  }

  return {
    lis: [headerLi, inputLi, listLi],
    collect,
  }
}
