import { describe, test, expect } from 'bun:test';
import { todayString, daysDiff, isRecordFresh } from '../../src/content/util/date.js';

describe('todayString', () => {
  test('本地时区 YYYY-MM-DD，月份日期补零', () => {
    expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(todayString(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('daysDiff', () => {
  const base = Date.parse('2026-08-03T12:00:00');

  test('同日差值为 0', () => {
    expect(daysDiff(base, '2026-08-03')).toBe(0);
  });

  test('整天差向零截断（对等 dayjs diff 语义）', () => {
    expect(daysDiff(base, '2026-08-02')).toBe(1);
    expect(daysDiff(base, '2026-07-31')).toBe(3);
    expect(daysDiff(base, '2026-07-30')).toBe(4);
  });

  test('边界：<= 3 保留、== 4 丢弃（3 天缓存过期判定）', () => {
    expect(daysDiff(base, '2026-07-31') <= 3).toBe(true);
    expect(daysDiff(base, '2026-07-30') <= 3).toBe(false);
  });

  test('未来时间（负差）同样有效（向零截断：不足整天为 0）', () => {
    expect(daysDiff(base, '2026-08-04')).toBe(0);
    expect(daysDiff(base, '2026-08-05')).toBe(-1);
  });

  test('非法日期返回 NaN', () => {
    expect(Number.isNaN(daysDiff(base, 'not-a-date'))).toBe(true);
  });
});

describe('isRecordFresh', () => {
  const now = Date.parse('2026-08-03T12:00:00');

  test('3 天内条目有效', () => {
    expect(isRecordFresh(now, { time: '2026-08-01' })).toBe(true);
    expect(isRecordFresh(now, { time: '2026-07-31' })).toBe(true);
  });

  test('超过 3 天条目过期', () => {
    expect(isRecordFresh(now, { time: '2026-07-30' })).toBe(false);
  });

  test('时间缺失/非法的条目不保留', () => {
    expect(isRecordFresh(now, { time: undefined })).toBe(false);
    expect(isRecordFresh(now, null)).toBe(false);
  });
});
