import { describe, test, expect, beforeEach } from 'bun:test';
import { setRuleStats, getRuleStats, clearRuleStats } from '../../src/content/engine/rule-stats.js';

describe('rule-stats（规则命中统计，按轮覆盖写）', () => {
  beforeEach(() => clearRuleStats());

  test('覆盖写：后一轮替换前一轮（不累加）', () => {
    setRuleStats('r1', 100, 10);
    setRuleStats('r1', 6, 2);
    expect(getRuleStats()).toEqual({ r1: { found: 6, hidden: 2 } });
  });

  test('多规则独立记录', () => {
    setRuleStats('r1', 1, 0);
    setRuleStats('r2', 4, 3);
    expect(getRuleStats()).toEqual({
      r1: { found: 1, hidden: 0 },
      r2: { found: 4, hidden: 3 },
    });
  });

  test('稳定页面：重复相同轮次数字不变（修复累加漂移）', () => {
    for (let round = 0; round < 50; round++) {
      setRuleStats('r1', 6, 2);
    }
    expect(getRuleStats().r1).toEqual({ found: 6, hidden: 2 });
  });

  test('负数收敛为 0，空 id 忽略', () => {
    setRuleStats('r1', -5, -1);
    setRuleStats('', 9, 9);
    expect(getRuleStats()).toEqual({ r1: { found: 0, hidden: 0 } });
  });

  test('getRuleStats 返回副本（外部修改不影响内部）', () => {
    setRuleStats('r1', 1, 1);
    getRuleStats().r1.found = 999;
    expect(getRuleStats().r1.found).toBe(1);
  });

  test('clearRuleStats 清零', () => {
    setRuleStats('r1', 1, 1);
    clearRuleStats();
    expect(getRuleStats()).toEqual({});
  });
});
