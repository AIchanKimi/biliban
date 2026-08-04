import { describe, test, expect } from 'bun:test';
import { HANDLER_RULES } from '../../src/content/rules/handler-table.js';

describe('handler-table 结构完整性', () => {
  test('共 38 条规则（对等 target.js 131–413）', () => {
    expect(HANDLER_RULES.length).toBe(38);
  });

  test('每条规则都有非空 index 选择器', () => {
    for (const rule of HANDLER_RULES) {
      expect(typeof rule.index).toBe('string');
      expect(rule.index.length).toBeGreaterThan(0);
    }
  });

  test('c:2 规则必须带 bv 选择器', () => {
    const c2Rules = HANDLER_RULES.filter(rule => rule.c === 2);
    expect(c2Rules.length).toBe(1);
    expect(c2Rules[0].bv).toBe('a');
    expect(c2Rules[0].index).toBe('.storey-box .spread-module');
  });

  test('c:1 规则带 userReg 前缀正则', () => {
    const c1Rules = HANDLER_RULES.filter(rule => rule.c === 1);
    expect(c1Rules.length).toBe(1);
    expect(c1Rules[0].userReg.test('up主：某人')).toBe(true);
  });

  test('规则表被冻结', () => {
    expect(Object.isFrozen(HANDLER_RULES)).toBe(true);
    expect(Object.isFrozen(HANDLER_RULES[0])).toBe(true);
  });

  test('comment 标记规则共 3 条（.ebox / .rank-item / .content li）', () => {
    const commentRules = HANDLER_RULES.filter(rule => rule.comment === true);
    expect(commentRules.map(rule => rule.index)).toEqual(['.ebox', '.rank-item', '.content li']);
  });

  test('下拉动态卡片规则的 url 数组含裸 bilibili.com（匹配全部子域）', () => {
    const rule = HANDLER_RULES.find(item => item.index === '.video-card');
    expect(rule.url).toEqual(['search.bilibili.com', 't.bilibili.com', 'space.bilibili.com', 'bilibili.com']);
  });

  test('method 值仅出现 0 与 1（3 仅用于首页轮播的特殊分支）', () => {
    const methods = new Set(HANDLER_RULES.filter(rule => rule.method != null).map(rule => rule.method));
    expect([...methods].sort()).toEqual([0, 1]);
  });
});
