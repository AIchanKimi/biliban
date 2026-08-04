import { describe, test, expect, beforeEach } from 'bun:test';
import { parseDuration, findDurationSeconds, decideDurationEntries, clearDurationCache } from '../../src/content/engine/duration.js';

describe('parseDuration', () => {
  test('mm:ss', () => {
    expect(parseDuration('1:23')).toBe(83);
    expect(parseDuration('0:34')).toBe(34);
    expect(parseDuration('12:05')).toBe(725);
  });

  test('hh:mm:ss', () => {
    expect(parseDuration('1:02:03')).toBe(3723);
  });

  test('两端空白容忍', () => {
    expect(parseDuration('  1:23  ')).toBe(83);
  });

  test('拒绝非时长文本', () => {
    expect(parseDuration('123')).toBeNull(); // 纯数字（播放量）
    expect(parseDuration('1:2')).toBeNull(); // 秒非两位
    expect(parseDuration('12:345')).toBeNull();
    expect(parseDuration('1:2:3:4')).toBeNull();
    expect(parseDuration('1234万播放')).toBeNull();
    expect(parseDuration('')).toBeNull();
    expect(parseDuration(null)).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
  });
});

// 极简假 DOM：仅需 querySelectorAll('*') / childElementCount / textContent
function fakeCard(leaves) {
  let scans = 0;
  const card = {
    get scans() {
      return scans;
    },
    querySelectorAll(sel) {
      if (sel !== '*') {
        throw new Error('仅支持 *');
      }
      scans++;
      return leaves;
    },
  };
  return card;
}
const leaf = text => ({ childElementCount: 0, textContent: text });
const branch = text => ({ childElementCount: 3, textContent: text });

describe('findDurationSeconds', () => {
  beforeEach(() => clearDurationCache());

  test('首个叶子命中即返回', () => {
    const card = fakeCard([leaf('某UP主'), leaf('12:05'), leaf('1:00')]);
    expect(findDurationSeconds(card)).toBe(725);
  });

  test('非叶子节点即使文本形似时长也跳过', () => {
    const card = fakeCard([branch('1:23'), leaf('3:45')]);
    expect(findDurationSeconds(card)).toBe(225);
  });

  test('无命中返回 null', () => {
    const card = fakeCard([leaf('标题'), leaf('123万播放')]);
    expect(findDurationSeconds(card)).toBeNull();
  });

  test('正值缓存：同一卡片不重复扫描', () => {
    const card = fakeCard([leaf('1:23')]);
    expect(findDurationSeconds(card)).toBe(83);
    expect(findDurationSeconds(card)).toBe(83);
    expect(card.scans).toBe(1);
  });

  test('负值不缓存：时长文本懒加载时下一轮重试', () => {
    let leaves = [leaf('加载中')];
    const card = {
      querySelectorAll: () => leaves,
    };
    expect(findDurationSeconds(card)).toBeNull();
    leaves = [leaf('2:00')];
    expect(findDurationSeconds(card)).toBe(120);
  });

  test('非法卡片安全返回 null', () => {
    expect(findDurationSeconds(null)).toBeNull();
    expect(findDurationSeconds({})).toBeNull();
  });
});

describe('decideDurationEntries（时长词条判定）', () => {
  test('短于：命中与不命中', () => {
    const entries = [{ op: 'lt', seconds: 60, scopes: ['global'] }];
    expect(decideDurationEntries(entries, 30, 'home')).toBe(true);
    expect(decideDurationEntries(entries, 60, 'home')).toBe(false);
    expect(decideDurationEntries(entries, 120, 'home')).toBe(false);
  });

  test('长于：命中与不命中', () => {
    const entries = [{ op: 'gt', seconds: 3600, scopes: ['global'] }];
    expect(decideDurationEntries(entries, 3601, 'home')).toBe(true);
    expect(decideDurationEntries(entries, 3600, 'home')).toBe(false);
    expect(decideDurationEntries(entries, 60, 'home')).toBe(false);
  });

  test('多词条任一命中即屏蔽', () => {
    const entries = [
      { op: 'lt', seconds: 30, scopes: ['global'] },
      { op: 'gt', seconds: 600, scopes: ['home'] },
    ];
    expect(decideDurationEntries(entries, 700, 'home')).toBe(true);
    expect(decideDurationEntries(entries, 100, 'home')).toBe(false);
  });

  test('作用域过滤', () => {
    const entries = [{ op: 'lt', seconds: 60, scopes: ['search'] }];
    expect(decideDurationEntries(entries, 30, 'search')).toBe(true);
    expect(decideDurationEntries(entries, 30, 'home')).toBe(false);
  });

  test('卡片无时长（null）→ 不处理', () => {
    const entries = [{ op: 'lt', seconds: 60, scopes: ['global'] }];
    expect(decideDurationEntries(entries, null, 'home')).toBe(false);
  });

  test('空词条 → 不屏蔽', () => {
    expect(decideDurationEntries([], 30, 'home')).toBe(false);
    expect(decideDurationEntries(null, 30, 'home')).toBe(false);
  });
});
