import { expect, test, vi } from 'vitest'
import { normalizeScopes, scopesApply } from '../../src/content/config/scopes.js'
import { toRuntimeWordEntries, toStorageWordEntries } from '../../src/content/config/serialize.js'
import { categoryFor } from '../../src/content/engine/category.js'
import { decide } from '../../src/content/engine/decide.js'
import { stringToArray } from '../../src/content/util/string-to-array.js'

function config(value, scopes = ['global'], enable = true) {
  return {
    enable,
    words: [
      { value, scopes },
    ],
  }
}

test('普通词：任一独立字段包含即命中；未命中、空输入和关闭时放行', () => {
  for (const [texts, expected] of [
    [
      ['广告标题', '作者'],
      true,
    ],
    [
      ['标题', '广告作者'],
      true,
    ],
    [
      ['正常标题', '作者'],
      false,
    ],
    [
      ['', '   ', null],
      false,
    ],
    [[], false],
  ]) {
    expect(decide(config('广告'), 'play', { texts })).toBe(expected)
  }
  expect(decide(config(''), 'play', {
    texts: ['任意'],
  })).toBe(false)
  expect(decide(config('广告', ['global'], false), 'play', {
    texts: ['广告'],
  })).toBe(false)
})

test('正则：字段级精确匹配、trim、flags；跨字段与 /g 重复匹配不误判', () => {
  const exact = config(/^目标作者$/)
  expect(decide(exact, 'play', {
    texts: ['标题', '  目标作者  '],
  })).toBe(true)
  expect(decide(exact, 'play', {
    texts: ['目标作者推荐合集', '别人'],
  })).toBe(false)
  expect(decide(config(/标题.*作者/), 'play', {
    texts: ['标题', '作者'],
  })).toBe(false)
  expect(decide(config(/^ad/i), 'play', {
    texts: ['AD标题'],
  })).toBe(true)
  const repeated = config(/广告/g)
  for (let i = 0; i < 3; i++) {
    expect(decide(repeated, 'play', {
      texts: ['广告'],
    })).toBe(true)
  }
})

test('页面分类：覆盖各类 URL 与相邻路径边界', () => {
  for (const [url, expected] of [
    ['https://search.bilibili.com/all?keyword=x', 'search'],
    ['https://space.bilibili.com/123/upload/video', 'space'],
    ['https://space.bilibili.com/123/favlist', 'fav'],
    ['https://www.bilibili.com/video/example', 'play'],
    ['https://www.bilibili.com/bangumi/play/example', 'play'],
    ['https://www.bilibili.com/list/ml123', 'play'],
    ['https://www.bilibili.com/list/watchlater', 'play'],
    ['https://www.bilibili.com/watchlater/list', 'fav'],
    ['https://space.bilibili.com/123/upload/video-other', null],
    ['https://www.bilibili.com/', null],
    ['https://t.bilibili.com/', null],
    ['https://example.com/video/example', null],
    ['invalid', null],
  ]) expect(categoryFor(url)).toBe(expected)
})

test('作用域：全局、本类、多类；未分类页面仅用 global 上下文', () => {
  for (const [scopes, category, expected] of [
    [
      ['global'],
      'play',
      true,
    ],
    [
      ['global'],
      'global',
      true,
    ],
    [
      ['search'],
      'search',
      true,
    ],
    [
      ['search'],
      'play',
      false,
    ],
    [
      ['play', 'fav'],
      'fav',
      true,
    ],
    [
      ['play'],
      'global',
      false,
    ],
    [
      ['global'],
      null,
      false,
    ],
  ]) {
    expect(scopesApply(scopes, category)).toBe(expected)
    expect(decide(config('x', scopes), category, {
      texts: ['x'],
    })).toBe(expected)
  }
  expect(normalizeScopes(['home', 'video', 'dynamics', 'invalid'])).toEqual(['play', 'global'])
})

test('输入拆分：普通词去重、多个正则、正则内逗号与转义斜杠', () => {
  for (const [input, expected] of [
    [
      'a,b,a',
      ['a', 'b'],
    ],
    [
      '/^A$/,/^B$/',
      ['/^A$/', '/^B$/'],
    ],
    [
      '/a,b/i,普通词',
      ['/a,b/i', '普通词'],
    ],
    [
      String.raw`/a\/,b/i,c`,
      [String.raw`/a\/,b/i`, 'c'],
    ],
    [
      '路径/a,b',
      ['路径/a', 'b'],
    ],
  ]) expect(stringToArray(input)).toEqual(expected)
})

test('配置中的正则可往返；坏正则跳过，不影响有效词', () => {
  const entries = [
    {
      value: '广告',
      scopes: ['global'],
    },
    {
      value: '/^a,b$/i',
      scopes: ['search'],
    },
  ]
  const runtime = toRuntimeWordEntries(entries)
  expect(runtime[1].value.test('A,B')).toBe(true)
  expect(toStorageWordEntries(runtime)).toEqual(entries)
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    expect(toRuntimeWordEntries([
      {
        value: '/[/',
        scopes: ['global'],
      },
      ...entries,
    ])).toEqual(runtime)
  }
  finally { errors.mockRestore() }
})
