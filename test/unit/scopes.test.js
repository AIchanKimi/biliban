import { describe, test, expect } from 'bun:test';
import { SCOPES, SCOPE_VALUES, isValidScope, scopeLabel, normalizeScopes, scopesApply } from '../../src/content/config/scopes.js';

describe('scopes 枚举（v6.0 五类）', () => {
  test('五个固定分类，中文标签齐全', () => {
    expect(SCOPE_VALUES).toEqual(['global', 'search', 'space', 'play', 'fav']);
    expect(scopeLabel('global')).toBe('全局');
    expect(scopeLabel('search')).toBe('搜索');
    expect(scopeLabel('space')).toBe('空间');
    expect(scopeLabel('play')).toBe('播放');
    expect(scopeLabel('fav')).toBe('收藏');
  });

  test('SCOPES 冻结', () => {
    expect(Object.isFrozen(SCOPES)).toBe(true);
  });

  test('isValidScope 拒绝已删除分类', () => {
    expect(isValidScope('play')).toBe(true);
    expect(isValidScope('home')).toBe(false);
    expect(isValidScope('video')).toBe(false);
    expect(isValidScope('dynamics')).toBe(false);
    expect(isValidScope(null)).toBe(false);
  });

  test('未知 label 返回空串', () => {
    expect(scopeLabel('nope')).toBe('');
  });
});

describe('normalizeScopes', () => {
  test('过滤非法值并去重', () => {
    expect(normalizeScopes(['search', 'bad', 'search'])).toEqual(['search']);
  });

  test('旧分类迁移：video/home → play，dynamics → global', () => {
    expect(normalizeScopes(['video'])).toEqual(['play']);
    expect(normalizeScopes(['home'])).toEqual(['play']);
    expect(normalizeScopes(['dynamics'])).toEqual(['global']);
    expect(normalizeScopes(['home', 'video'])).toEqual(['play']); // 迁移后去重
  });

  test('空/全非法 → [global]', () => {
    expect(normalizeScopes([])).toEqual(['global']);
    expect(normalizeScopes(['nonsense'])).toEqual(['global']);
    expect(normalizeScopes(null)).toEqual(['global']);
  });

  test('global 与其他并存时保留', () => {
    expect(normalizeScopes(['global', 'play'])).toEqual(['global', 'play']);
  });
});

describe('scopesApply', () => {
  test('global 覆盖全部已匹配分类', () => {
    expect(scopesApply(['global'], 'search')).toBe(true);
    expect(scopesApply(['global'], 'fav')).toBe(true);
    expect(scopesApply(['global'], null)).toBe(false); // 未匹配页面不触发
  });

  test('分类精确匹配', () => {
    expect(scopesApply(['play'], 'play')).toBe(true);
    expect(scopesApply(['play'], 'search')).toBe(false);
    expect(scopesApply(['search', 'fav'], 'fav')).toBe(true);
  });
});
