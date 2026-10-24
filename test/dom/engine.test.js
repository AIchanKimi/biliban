// @vitest-environment jsdom
import { test, vi } from 'vitest'
import { config, find, hidden, mount, rule, shown, tick, word } from '../helpers/dom.js'

test('hTML → 独立字段 → 隐藏；不误伤正常卡片，动态插入也生效', async () => {
  await mount(config({
    words: [
      word('广告'),
      word('/^目标作者$/'),
    ],
  }))
  hidden('by-title')
  hidden('by-author')
  shown('clean')
  shown('name-in-title')
  const element = document.createElement('article')
  element.id = 'added'
  element.className = 'card'
  element.innerHTML = '<span class="title">新广告</span>'
  document.body.appendChild(element)
  await tick()
  hidden('added')
})

test('规则和词条作用域生效；SPA URL 改变后按新分类处理，全局规则可用于首页', async () => {
  const app = await mount(config({
    words: [
      word('广告', 'search'),
    ],
    rules: [
      rule({
        scopes: ['play', 'search'],
      }),
    ],
  }))
  shown('by-title')
  // jsdom 不支持跨域导航；同域 SPA 路径变化也能验证分类重新计算。
  await app.seed(config({
    words: [
      word('广告', 'fav'),
    ],
    rules: [
      rule({
        scopes: ['play', 'fav'],
      }),
    ],
  }))
  shown('by-title')
  window.history.pushState({}, '', '/watchlater/list')
  find('#clean').appendChild(document.createElement('span'))
  await tick()
  hidden('by-title')
  await app.reload('https://www.bilibili.com/')
  shown('by-title')
  await app.seed(config({
    words: [
      word('广告'),
    ],
    rules: [
      rule({
        scopes: ['global'],
      }),
    ],
  }))
  hidden('by-title')
  shown('clean')
})

test('时长选择器、自动提取和缺失值；更改阈值和清空能恢复', async () => {
  const rules = [
    rule({ selector: '.timed', textSelectors: [], durationSelector: '.time' }),
    rule({
      id: 'fallback',
      selector: '.timed-fallback',
      textSelectors: [],
      durationSelector: '',
    }),
    rule({
      id: 'missing',
      selector: '.timed-missing',
      textSelectors: [],
      durationSelector: '',
    }),
  ]
  const timed = op => config({
    rules,
    durations: [
      {
        op,
        seconds: 60,
        scopes: ['global'],
      },
    ],
  })
  const app = await mount(timed('lt'))
  hidden('explicit-duration')
  shown('fallback-duration')
  shown('missing-duration')
  await app.seed(timed('gt'))
  shown('explicit-duration')
  hidden('fallback-duration')
  await app.seed(config({ rules }))
  shown('fallback-duration')
})

test('坏选择器隔离；直接隐藏和禁用后的恢复', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const rules = [
    rule({ id: 'bad', selector: '[[[' }),
    rule({
      id: 'bad-text',
      textSelectors: ['[[['],
    }),
    rule({ id: 'banner', selector: '.banner', mode: 'hide' }),
    rule(),
  ]
  const app = await mount(config({
    rules,
    words: [
      word('广告'),
    ],
  }))
  hidden('banner')
  hidden('by-title')
  await app.seed(config({
    rules: rules.map(entry => ({ ...entry, enabled: false })),
  }))
  shown('banner')
  shown('by-title')
})
