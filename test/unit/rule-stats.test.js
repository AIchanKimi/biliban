import { describe, test, expect, beforeEach } from 'bun:test';
import { recordRuleFound, recordRuleHidden, getRuleStats, clearRuleStats } from '../../src/content/engine/rule-stats.js';

describe('rule-stats（规则命中统计）', () => {
  beforeEach(() => clearRuleStats());

  test('found/hidden 累加', () => {
    recordRuleFound('r1', 3);
    recordRuleFound('r1', 2);
    recordRuleHidden('r1');
    recordRuleHidden('r1', 2);
    expect(getRuleStats()).toEqual({ r1: { found: 5, hidden: 3 } });
  });

  test('多规则独立计数', () => {
    recordRuleFound('r1', 1);
    recordRuleFound('r2', 4);
    expect(getRuleStats()).toEqual({
      r1: { found: 1, hidden: 0 },
      r2: { found: 4, hidden: 0 },
    });
  });

  test('hidden 先于 found 也成立（resolver 异步路径）', () => {
    recordRuleHidden('bv-rule');
    expect(getRuleStats()).toEqual({ 'bv-rule': { found: 0, hidden: 1 } });
  });

  test('非法入参忽略（空 id / 非正计数）', () => {
    recordRuleFound('', 5);
    recordRuleFound(null, 5);
    recordRuleFound('r1', 0);
    recordRuleHidden('r1', -1);
    expect(getRuleStats()).toEqual({});
  });

  test('getRuleStats 返回副本（外部修改不影响内部）', () => {
    recordRuleFound('r1', 1);
    getRuleStats().r1.found = 999;
    expect(getRuleStats().r1.found).toBe(1);
  });

  test('clearRuleStats 清零（页面刷新语义由模块级状态天然提供）', () => {
    recordRuleFound('r1', 1);
    clearRuleStats();
    expect(getRuleStats()).toEqual({});
  });
});
