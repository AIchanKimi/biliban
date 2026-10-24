import { expect, test } from 'vitest'
import { decideDurationEntries, findDurationSeconds, formatDuration, parseDuration } from '../../src/content/engine/duration.js'

test('时长转换：分钟、小时、空白；播放量等非时长文本不参与判断', () => {
  for (const [text, seconds] of [
    ['0:30', 30],
    [' 12:05 ', 725],
    ['1:02:03', 3723],
  ]) {
    expect(parseDuration(text)).toBe(seconds)
  }
  for (const text of ['123万播放', '123', '1:2', '', null]) expect(parseDuration(text)).toBeNull()
  for (const [seconds, text] of [
    [30, '0:30'],
    [83, '1:23'],
    [4664, '01:17:44'],
  ]) {
    expect(formatDuration(seconds)).toBe(text)
  }
})

test('阈值：严格短于/长于，支持作用域和多个词条；缺失时长放行', () => {
  for (const [op, limit, cases] of [
    [
      'lt',
      60,
      [
        [59, true],
        [60, false],
        [61, false],
      ],
    ],
    [
      'gt',
      600,
      [
        [599, false],
        [600, false],
        [601, true],
      ],
    ],
  ]) {
    const entries = [
      {
        op,
        seconds: limit,
        scopes: ['search'],
      },
    ]
    for (const [seconds, expected] of cases) {
      expect(decideDurationEntries(entries, seconds, 'search')).toBe(expected)
    }
    expect(decideDurationEntries(entries, 30, 'play')).toBe(false)
    expect(decideDurationEntries(entries, null, 'search')).toBe(false)
  }
  const entries = [
    {
      op: 'lt',
      seconds: 30,
      scopes: ['global'],
    },
    {
      op: 'gt',
      seconds: 600,
      scopes: ['play'],
    },
  ]
  expect(decideDurationEntries(entries, 700, 'play')).toBe(true)
  expect(decideDurationEntries([], 30, 'play')).toBe(false)
})

test('时长懒加载：第一次未找到不能导致之后永远找不到', () => {
  let text = '加载中'
  const card = {
    querySelectorAll: () => [
      { childElementCount: 0, textContent: text },
    ],
  }
  expect(findDurationSeconds(card)).toBeNull()
  text = '2:00'
  expect(findDurationSeconds(card)).toBe(120)
})
