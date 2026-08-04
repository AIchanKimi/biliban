import { describe, test, expect } from 'bun:test';
import { SCOPES, SCOPE_VALUES, isValidScope, scopeLabel, normalizeScopes, scopesApply } from '../../src/content/config/scopes.js';

describe('scopes 枚举', () => {
  test('六个固定分类，中文标签齐全', () => {
    expect(SCOPE_VALUES).toEqual(['global', 'home', 'video', 'search', 'dynamics', 'space']);
    expect(scopeLabel('search')).toBe('搜索');
    expect(scopeLabel('global')).toBe('全局');
  });

  test('SCOPES 冻结', () => {
    expect(Object.isFrozen(SCOPES)).toBe(true);
  });

  test('isValidScope 拒绝未知值', () => {
    expect(isValidScope('home')).toBe(true);
    expect(isValidScope('live')).toBe(false);
    expect(isValidScope(null)).toBe(false);
  });

  test('未知 label 返回空串', () => {
    expect(scopeLabel('nope')).toBe('');
  });
});

describe('normalizeScopes', () => {
  test('过滤非法值并去重', () => {
    expect(normalizeScopes(['search', 'live', 'search'])).toEqual(['search']);
  });

  test('空/全非法 → [global]', () => {
    expect(normalizeScopes([])).toEqual(['global']);
    expect(normalizeScopes(['x'])).toEqual(['global']);
    expect(normalizeScopes(null)).toEqual(['global']);
  });

  test('global 与其他并存时保留（UI 约束单值，引擎宽容）', () => {
    expect(normalizeScopes(['global', 'home'])).toEqual(['global', 'home']);
  });
});

describe('scopesApply', () => {
  test('global 处处生效', () => {
    expect(scopesApply(['global'], 'search')).toBe(true);
    expect(scopesApply(['global'], null)).toBe(false); // 无分类页面不跑引擎
  });

  test('分类精确匹配', () => {
    expect(scopesApply(['search'], 'search')).toBe(true);
    expect(scopesApply(['search'], 'home')).toBe(false);
    expect(scopesApply(['home', 'video'], 'video')).toBe(true);
  });
});
