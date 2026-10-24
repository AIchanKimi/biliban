// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer'
import { expect, test, vi } from 'vitest'
import { addWords, click, config, fill, find, hidden, mount, openPanel, save, shown, tick, word, wrap } from '../helpers/dom.js'

function chips() {
  return [
    ...find('#bilibiliConfig_words_global').querySelectorAll('.block_obj_child_span'),
  ]
}

test('添加普通词/多个正则、切换分类、保存与重载闭环', async () => {
  const app = await mount()
  openPanel()
  addWords('  广告  ,/^目标作者$/,/a,b/i')
  find('#bilibiliConfig_tab_search').click()
  find('#bilibiliConfig_tab_global').click()
  expect(chips()).toHaveLength(3)
  await save()
  hidden('by-title')
  hidden('by-author')
  shown('name-in-title')
  expect(app.store.bilibili_config.words.map(entry => entry.value)).toEqual(['广告', '/^目标作者$/', '/a,b/i'])
  await app.reload()
  hidden('by-title')
})

test('筛选后删除并保存，不丢弃未显示的永久词和临时词', async () => {
  const app = await mount(config({
    words: [
      word('广告'),
      word('保留词'),
    ],
  }))
  const expiresAt = Date.now() + 3_600_000
  await app.temporary([
    {
      kind: 'word',
      value: '临时词',
      scopes: ['global'],
      expiresAt,
    },
  ])
  openPanel()
  fill('#bilibiliConfig_wordInput_global', '广告')
  const matched = chips().filter(el => !el.classList.contains('block_obj_child_filtered'))
  expect(matched).toHaveLength(1)
  matched[0].click()
  matched[0].querySelector('.block_obj_child_text').click()
  expect(chips()).toHaveLength(3)
  expect(find('#bilibiliConfig_wordCount_global').textContent).toBe('找到 1 / 3 条')
  expect(find('.block_obj_save_status').dataset.state).toBe('saved')
  matched[0].querySelector('.block_obj_child_del').click()
  await save()
  shown('by-title')
  expect(app.store.bilibili_config.words).toEqual([
    word('保留词'),
  ])
  expect(app.store.bilibili_temp_entries[0]).toMatchObject({ value: '临时词', expiresAt })
})

test('展开、收起、切换分类与关闭丢弃编辑', async () => {
  const app = await mount(config({
    words: [
      word('已保存'),
    ],
  }))
  openPanel()
  const pane = find('#bilibiliConfig_pane_global')
  click('展开', pane)
  expect(pane.classList.contains('block_obj_scope_pane_expanded')).toBe(true)
  find('#bilibiliConfig_tab_search').click()
  expect(pane.style.display).toBe('none')
  find('#bilibiliConfig_tab_global').click()
  click('收起', pane)
  expect(pane.classList.contains('block_obj_scope_pane_expanded')).toBe(false)
  addWords('未保存')
  click('关闭', find(wrap))
  await tick(1000)
  openPanel()
  expect(chips()).toHaveLength(1)
  expect(app.store.bilibili_config.words).toEqual([
    word('已保存'),
  ])
})

test('规则启停与总开关保存后立即恢复/屏蔽', async () => {
  const app = await mount(config({
    words: [
      word('广告'),
    ],
  }))
  hidden('by-title')
  openPanel()
  find('#bilibiliConfig_tab_play').click()
  find('#bilibiliConfig_rulesToggle_play').click()
  const row = find('.block_obj_rule_row[data-rule-id="test-card"]')
  click('启用', row)
  await save()
  shown('by-title')
  click('启用', row)
  await save()
  hidden('by-title')
  find('label[for="bilibiliConfig_enable"]').click()
  await save()
  shown('by-title')
  await app.reload()
  shown('by-title')
  expect(app.store.bilibili_config.enable).toBe(false)
})

test('纯时长规则添加、编辑生效、删除后重载保持删除', async () => {
  const app = await mount(config({
    rules: [],
    durations: [
      {
        op: 'lt',
        seconds: 60,
        scopes: ['global'],
      },
    ],
  }))
  openPanel()
  find('#bilibiliConfig_tab_play').click()
  const rules = find('#bilibiliConfig_rules_play')
  click('添加规则', rules)
  const row = rules.querySelector('.block_obj_rule_row')
  click('编辑', row)
  fill('.block_obj_rule_selector_input', '.timed')
  fill('.block_obj_rule_duration_input', '.time')
  await save()
  hidden('explicit-duration')
  expect(app.store.bilibili_config.rules[0]).toMatchObject({
    textSelectors: [],
    durationSelector: '.time',
    scopes: ['play'],
  })
  fill('.block_obj_rule_selector_input', '.banner')
  row.querySelector('select').value = 'hide'
  await save()
  hidden('banner')
  click('删除', row)
  await save()
  await app.reload()
  shown('banner')
  expect(app.store.bilibili_config.rules).toEqual([])
})

test('导出内容和文件导入还原；坏 JSON 或不支持的版本不覆盖设置', async () => {
  const app = await mount(config({
    words: [
      word('广告'),
    ],
  }))
  const createURL = vi.fn(() => 'blob:test')
  vi.stubGlobal('Blob', NodeBlob)
  const revokeURL = vi.fn()
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createURL
    static revokeObjectURL = revokeURL
  })
  // 只拦截浏览器下载边界；面板真实生成 Blob 与文件名。
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  openPanel()
  click('导出', find(wrap))
  expect(anchorClick).toHaveBeenCalledOnce()
  const blob = createURL.mock.calls[0][0]
  const json = await blob.text()
  const exported = JSON.parse(json)
  expect(exported.words).toEqual([
    word('广告'),
  ])
  await app.seed(config())
  shown('by-title')
  async function upload(text) {
    const input = find(`${wrap} input[type="file"]`)
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [
        {
          text: async () => text,
        },
      ],
    })
    input.dispatchEvent(new Event('change'))
    await tick()
  }
  await upload(json)
  hidden('by-title')
  const restored = structuredClone(app.store.bilibili_config)
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  await upload('{broken')
  await upload('{}')
  expect(errors).toHaveBeenCalledTimes(2)
  expect(app.store.bilibili_config).toEqual(restored)
})

test('模拟远端存储事件使当前页即时生效；临时词独立保存、重载保留并过期清理', async () => {
  const app = await mount()
  await app.seed(config({
    words: [
      word('广告'),
    ],
  }))
  hidden('by-title')
  await app.seed(config())
  shown('by-title')
  openPanel()
  find('#bilibiliConfig_wordTemp_global').checked = true
  addWords('广告')
  await save()
  hidden('by-title')
  expect(app.store.bilibili_config.words).toEqual([])
  const entries = app.store.bilibili_temp_entries
  expect(entries).toHaveLength(1)
  expect(entries[0].expiresAt - Date.now()).toBe(3_600_000 - 32)
  await app.reload()
  hidden('by-title')
  await app.temporary(entries.map(entry => ({ ...entry, expiresAt: Date.now() - 1000 })))
  await app.reload()
  shown('by-title')
  expect(app.store.bilibili_temp_entries).toEqual([])
})

test('筛选计数、无结果提示、长词全文与清空撤销保留原始数据', async () => {
  const long = '/这是一个超过九个字符的完整正则表达式/'
  const app = await mount(config({
    words: [
      word(long),
      word('广告'),
    ],
  }))
  openPanel()
  expect(find('#bilibiliConfig_wordCount_global').textContent).toBe('共 2 条')
  expect(chips().find(el => el.textContent.includes(long))).toBeTruthy()
  fill('#bilibiliConfig_wordInput_global', '不存在')
  expect(find('#bilibiliConfig_wordCount_global').textContent).toBe('找到 0 / 2 条')
  expect(find('.block_obj_entry_empty').hidden).toBe(false)
  expect(find('.block_obj_save_status').dataset.state).toBe('saved')
  fill('#bilibiliConfig_wordInput_global', '')
  const pane = find('#bilibiliConfig_pane_global')
  click('清空', pane)
  expect(chips()).toHaveLength(0)
  expect(find('.block_obj_save_status').dataset.state).toBe('dirty')
  click('撤销', pane)
  expect(chips()).toHaveLength(2)
  expect(find('.block_obj_save_status').dataset.state).toBe('saved')
  await save()
  expect(app.store.bilibili_config.words.map(entry => entry.value)).toEqual([long, '广告'])
})

test('时长清空撤销保留条件和临时有效期，保存成功后结束撤销', async () => {
  const app = await mount(config({
    durations: [
      {
        op: 'lt',
        seconds: 60,
        scopes: ['global'],
      },
    ],
  }))
  const expiresAt = Date.now() + 100000
  await app.temporary([
    {
      kind: 'duration',
      op: 'gt',
      seconds: 600,
      scopes: ['global'],
      expiresAt,
    },
  ])
  openPanel()
  const list = find('#bilibiliConfig_durations_global')
  const section = list.closest('ul')
  expect(section.querySelector('[title="删除与输入相同时长的词条"]')).toBeNull()
  const temporaryChip = list.firstElementChild
  temporaryChip.click()
  temporaryChip.querySelector('.block_obj_child_text').click()
  temporaryChip.querySelector('.block_obj_child_badge_temp').click()
  expect(list.children).toHaveLength(2)
  expect(find('.block_obj_save_status').dataset.state).toBe('saved')
  const clear = [
    ...section.querySelectorAll('.block_obj_clear_button'),
  ][1]
  clear.click()
  expect(list.children).toHaveLength(0)
  clear.click()
  expect(list.children).toHaveLength(2)
  await save()
  expect(app.store.bilibili_config.durations).toEqual([
    {
      op: 'lt',
      seconds: 60,
      scopes: ['global'],
    },
  ])
  expect(app.store.bilibili_temp_entries[0].expiresAt).toBe(expiresAt)
  temporaryChip.querySelector('.block_obj_child_del').click()
  expect(list.children).toHaveLength(1)
  await save()
  expect(app.store.bilibili_temp_entries).toEqual([])
  clear.click()
  await save()
  expect(clear.textContent).toBe('清空')
  expect(app.store.bilibili_config.durations).toEqual([])
})

test('保存状态等待持久化，失败保留编辑并可重试', async () => {
  const app = await mount()
  openPanel()
  addWords('待保存词')
  const original = chrome.storage.local.set
  let finish
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(chrome.storage.local, 'set').mockImplementation((values) => {
    if (values.bilibili_config)
      return new Promise((resolve, reject) => { finish = { resolve, reject, values } })
    return original(values)
  })
  await save()
  expect(find('.block_obj_save_status').dataset.state).toBe('saving')
  expect(find('[title="保存设置"]').disabled).toBe(true)
  finish.reject(new Error('disk unavailable'))
  await tick()
  expect(find('.block_obj_save_status').dataset.state).toBe('error')
  expect(chips()).toHaveLength(1)
  expect(app.store.bilibili_config.words).toEqual([])
  await save()
  addWords('保存期间新增')
  await original(finish.values)
  finish.resolve()
  await tick()
  expect(find('.block_obj_save_status').dataset.state).toBe('dirty')
  expect(app.store.bilibili_config.words).toEqual([
    word('待保存词'),
  ])
  chrome.storage.local.set.mockRestore()
  await save()
  expect(find('.block_obj_save_status').textContent).toBe('已保存')
  expect(app.store.bilibili_config.words).toEqual([
    word('待保存词'),
    word('保存期间新增'),
  ])
})
