import { beforeEach, expect, test, vi } from 'vitest'
import { backupKeyFor, CONFIG_KEY, CONFIG_VERSION, TEMP_KEY } from '../../src/content/config/defaults.js'
import { loadConfig, normalize, saveConfig, subscribe, toRuntimeConfig, toStorageObject } from '../../src/content/config/store.js'
import { addTempEntries, getTempEntries, initTempStore, mergeTempEntries, pruneExpired, setTempEntries, subscribeTemp } from '../../src/content/config/temp-store.js'
import { mockChrome } from '../helpers/chrome.js'

const rule = {
  id: 'user-rule',
  selector: '.card',
  scopes: ['play'],
  mode: 'match',
  textSelectors: ['.title'],
}
function current(overrides = {}) {
  return {
    version: CONFIG_VERSION,
    enable: true,
    words: [],
    durations: [],
    rules: [],
    ...overrides,
  }
}
beforeEach(() => mockChrome())

test('首次载入提供种子；已有用户规则与空规则列表不被回灌', async () => {
  const { store } = mockChrome()
  const seed = await loadConfig()
  expect(seed.version).toBe(CONFIG_VERSION)
  expect(Array.isArray(seed.rules)).toBe(true)
  expect(store[CONFIG_KEY]).toBeUndefined()
  for (const rules of [
    [],
    [rule],
  ]) {
    await saveConfig(current({ rules }))
    const result = await loadConfig()
    expect(result.rules.map(({ id, selector }) => ({ id, selector }))).toEqual(
      rules.map(({ id, selector }) => ({ id, selector })),
    )
  }
})

test('配置往返：词条、作用域、时长、自定义规则和正则保持有效', async () => {
  const input = current({
    words: [
      {
        value: '/^目标$/i',
        scopes: ['search'],
      },
    ],
    durations: [
      {
        op: 'lt',
        seconds: 60,
        scopes: ['play'],
      },
    ],
    rules: [rule],
  })
  const normalized = normalize(input)
  await saveConfig(toStorageObject(toRuntimeConfig(normalized)))
  expect(await loadConfig()).toEqual(normalized)
  expect(input.rules[0]).toEqual(rule)
})

test('导入规范化：清理空白/坏词条与坏阈值，保留纯时长规则', () => {
  const result = normalize(current({
    words: [
      {
        value: '  有效词  ',
        scopes: ['search'],
      },
      { value: '   ' },
      { value: 42 },
    ],
    durations: [
      {
        op: 'lt',
        seconds: 30,
        scopes: ['global'],
      },
      { op: 'gt', seconds: -1 },
    ],
    rules: [
      { ...rule, textSelectors: [], durationSelector: '.duration' },
      { id: 'invalid', selector: '' },
    ],
  }))
  expect(result.words).toEqual([
    {
      value: '有效词',
      scopes: ['search'],
    },
  ])
  expect(result.durations).toEqual([
    {
      op: 'lt',
      seconds: 30,
      scopes: ['global'],
    },
  ])
  expect(result.rules).toHaveLength(1)
  expect(result.rules[0].textSelectors).toEqual([])
  expect(result.rules[0].durationSelector).toBe('.duration')
})

test('扩展 v2–v4 迁移及备份；无版本的旧脚本格式拒绝导入', async () => {
  const inputs = [
    {
      version: 2,
      enable: false,
      usernames: [
        {
          value: '作者',
          scopes: ['global'],
        },
      ],
      keywords: [
        {
          value: '广告',
          scopes: ['search'],
        },
      ],
      duration: { enable: true, minSeconds: 60 },
      rules: [rule],
    },
    {
      version: 3,
      words: [
        {
          value: '广告',
          scopes: ['global'],
        },
      ],
      duration: { enable: true, minSeconds: 60 },
      rules: [rule],
    },
    {
      version: 4,
      words: [
        {
          value: '广告',
          scopes: ['global'],
        },
      ],
      durations: [
        {
          op: 'gt',
          seconds: 600,
          scopes: ['play'],
        },
      ],
      builtinRules: [
        { ...rule, selector: '.edited' },
      ],
      rules: [
        { ...rule, id: 'custom' },
      ],
    },
  ]
  for (const input of inputs) {
    const { store } = mockChrome({ [CONFIG_KEY]: input })
    const loaded = await loadConfig()
    expect(loaded.version).toBe(CONFIG_VERSION)
    expect(loaded.words.map(entry => entry.value)).toContain('广告')
    expect(store[backupKeyFor(input.version)]).toEqual(input)
    expect(store[CONFIG_KEY]).toEqual(loaded)
    if (input.version < 4) {
      expect(loaded.durations).toEqual([
        {
          op: 'lt',
          seconds: 60,
          scopes: ['global'],
        },
      ])
      expect(loaded.rules.find(entry => entry.id === rule.id).selector).toBe('.card')
    }
    else {
      expect(loaded.rules.find(entry => entry.id === rule.id).selector).toBe('.edited')
      expect(loaded.rules.some(entry => entry.id === 'custom')).toBe(true)
      expect(loaded.durations).toEqual(input.durations)
    }
    expect(await loadConfig()).toEqual(loaded)
  }
  expect(() => normalize({})).toThrow('不支持的配置版本')
  expect(() => normalize({ version: 1 })).toThrow('不支持的配置版本')
})

test('存储同步：自身回显（含不同键序）忽略；远端变化通知一次；可取消订阅', async () => {
  const { emit } = mockChrome()
  const received = []
  const unsubscribe = subscribe(value => received.push(value))
  const input = current({
    words: [
      {
        value: '自己',
        scopes: ['global'],
      },
    ],
  })
  await saveConfig(input)
  emit({
    [CONFIG_KEY]: {
      newValue: Object.fromEntries(Object.entries(input).reverse()),
    },
  })
  emit({
    [CONFIG_KEY]: {
      newValue: current({ enable: false }),
    },
  }, 'sync')
  expect(received).toHaveLength(0)
  await chrome.storage.local.set({
    [CONFIG_KEY]: current({ enable: false }),
  })
  expect(received).toHaveLength(1)
  expect(received[0].enable).toBe(false)
  unsubscribe()
  await chrome.storage.local.set({ [CONFIG_KEY]: input })
  expect(received).toHaveLength(1)
})

test('临时词：默认一小时，过滤重复/坏项，保存保留原到期时间', async () => {
  await initTempStore()
  const now = 1_800_000_000_000
  const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
  try {
    await addTempEntries([
      {
        kind: 'word',
        value: '临时',
        scopes: ['global'],
      },
      {
        kind: 'word',
        value: '临时',
        scopes: ['global'],
      },
      { kind: 'word', value: '' },
    ])
    const entries = getTempEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].expiresAt).toBe(now + 3_600_000)
    clock.mockReturnValue(now + 1000)
    await setTempEntries(entries)
    expect(getTempEntries()[0].expiresAt).toBe(now + 3_600_000)
  }
  finally { clock.mockRestore() }
})

test('临时词/时长：读取时排除过期项，重新载入会清理存储', async () => {
  const now = 1_800_000_000_000
  const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
  try {
    await initTempStore()
    await setTempEntries([
      {
        kind: 'word',
        value: '临时',
        scopes: ['global'],
        expiresAt: now + 1000,
      },
      {
        kind: 'duration',
        op: 'lt',
        seconds: 30,
        scopes: ['play'],
        expiresAt: now + 1000,
      },
    ])
    const persistent = current({
      words: [
        {
          value: '永久',
          scopes: ['global'],
        },
      ],
    })
    expect(mergeTempEntries(persistent).words.map(entry => entry.value)).toEqual(['永久', '临时'])
    expect(mergeTempEntries(persistent).durations).toHaveLength(1)
    clock.mockReturnValue(now + 1000)
    expect(mergeTempEntries(persistent).words).toEqual(persistent.words)
    expect(mergeTempEntries(persistent).durations).toEqual([])
    await initTempStore()
    expect((await chrome.storage.local.get(TEMP_KEY))[TEMP_KEY]).toEqual([])
    expect(await pruneExpired()).toBe(0)
  }
  finally { clock.mockRestore() }
})

test('临时存储：自己的保存不重复通知，远端词条变化会生效', async () => {
  await initTempStore()
  let calls = 0
  const unsubscribe = subscribeTemp(() => calls++)
  try {
    await addTempEntries([
      {
        kind: 'word',
        value: '本地',
        scopes: ['global'],
      },
    ])
    expect(calls).toBe(0)
    await chrome.storage.local.set({
      [TEMP_KEY]: [
        {
          kind: 'word',
          value: '远端',
          scopes: ['global'],
          expiresAt: Date.now() + 3_600_000,
        },
      ],
    })
    expect(calls).toBe(1)
    expect(getTempEntries().map(entry => entry.value)).toEqual(['远端'])
  }
  finally { unsubscribe() }
})
