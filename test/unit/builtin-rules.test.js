import { describe, test, expect } from 'bun:test';
import { BUILTIN_RULES } from '../../src/content/rules/builtin-rules.js';
import { SCOPE_VALUES } from '../../src/content/config/scopes.js';

describe('builtin-rules v5.5（textSelectors 模型）', () => {
  test('精简后共 9 条', () => {
    expect(BUILTIN_RULES.length).toBe(9);
  });

  test('每条形状合法：id/selector/scopes/mode/textSelectors 数组', () => {
    const ids = new Set();
    for (const rule of BUILTIN_RULES) {
      expect(typeof rule.id).toBe('string');
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
      expect(typeof rule.selector).toBe('string');
      expect(rule.mode).toBe('match');
      expect(Array.isArray(rule.textSelectors)).toBe(true);
      expect(rule.textSelectors.length).toBeGreaterThan(0);
      expect(rule.scopes.length).toBeGreaterThan(0);
      for (const scope of rule.scopes) {
        expect(SCOPE_VALUES).toContain(scope);
      }
      expect(Object.isFrozen(rule)).toBe(true);
    }
  });

  test('UP 主/标题选择器旧字段已废弃', () => {
    for (const rule of BUILTIN_RULES) {
      expect(rule.titleSelector).toBeUndefined();
      expect(rule.userSelector).toBeUndefined();
      expect(rule.userReg).toBeUndefined();
      expect(rule.resolve).toBeUndefined();
    }
  });

  test('失效旧布局规则已裁剪', () => {
    const json = JSON.stringify(BUILTIN_RULES.map(r => r.selector));
    for (const gone of [
      '.video-card-common', '.video-card-reco', '.groom-module', '.rank-wrap',
      '.manga-card', '.manga-spread-module', '.van-slide', 'ul.vd-list',
      '.storey-box', '.video-item', '.article-list', '.rank-video-card', '.article-card',
    ]) {
      expect(json).not.toContain(gone);
    }
  });

  test('关键规则的作用域与选择器', () => {
    const byId = id => BUILTIN_RULES.find(r => r.id === id);
    expect(byId('builtin-bili-video-card').scopes).toEqual(['global']);
    expect(byId('builtin-bili-video-card').textSelectors).toContain('.bili-video-card__info--tit');
    expect(byId('builtin-bili-video-card').durationSelector).toBe('.bili-video-card__stats__duration');
    expect(byId('builtin-dyn-item').scopes).toEqual(['global']);
    expect(byId('builtin-space-cube').scopes).toEqual(['space']);
    expect(byId('builtin-search-user-list').scopes).toEqual(['search']);
    expect(byId('builtin-ending-related').scopes).toEqual(['video']);
    expect(byId('builtin-recommend-video-card').scopes).toEqual(['home', 'video']);
  });
});
