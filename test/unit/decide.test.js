import { describe, test, expect } from 'bun:test';
import { decide } from '../../src/content/engine/decide.js';

const config = (overrides = {}) => ({
  version: 3,
  enable: true,
  duration: { enable: false, minSeconds: 300 },
  words: [],
  rules: [],
  ...overrides,
});

describe('统一词条：字符串语义', () => {
  test('标题「包含」匹配', () => {
    const cfg = config({ words: [{ value: '广告', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '超好看广告合集' })).toBe(true);
    expect(decide(cfg, 'home', { title: '正常标题' })).toBe(false);
  });

  test('UP主名「精确」匹配（trim 后全等）', () => {
    const cfg = config({ words: [{ value: '某UP', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: '  某UP  ' })).toBe(true);
  });

  test('UP主名不做包含匹配（防短词误伤）', () => {
    const cfg = config({ words: [{ value: '某UP', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: '某UP官方号' })).toBe(false);
  });

  test('同一个词同时作用于标题与 UP主名', () => {
    const cfg = config({ words: [{ value: '广告', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '广告位' })).toBe(true); // 标题包含
    expect(decide(cfg, 'home', { username: '广告' })).toBe(true); // UP主名精确
    expect(decide(cfg, 'home', { username: '广告君' })).toBe(false);
  });

  test('空字符串词条不造成全屏蔽', () => {
    const cfg = config({ words: [{ value: '', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '任意标题', username: '任意人' })).toBe(false);
  });
});

describe('统一词条：正则语义', () => {
  test('正则同时匹配标题与 UP主名', () => {
    const cfg = config({ words: [{ value: /^广告.*$/, scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '广告合集' })).toBe(true);
    expect(decide(cfg, 'home', { username: '广告商一号' })).toBe(true);
    expect(decide(cfg, 'home', { username: '正常UP' })).toBe(false);
  });

  test('flags 生效', () => {
    const cfg = config({ words: [{ value: /AD/i, scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: 'ad推广' })).toBe(true);
  });

  test('/g 正则重复判定不抖动（无 lastIndex 状态污染）', () => {
    const cfg = config({ words: [{ value: /广告/g, scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
  });
});

describe('作用域过滤', () => {
  test('global 词条处处生效', () => {
    const cfg = config({ words: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'search', { title: 'x' })).toBe(true);
    expect(decide(cfg, 'dynamics', { title: 'x' })).toBe(true);
  });

  test('分类词条仅本类生效', () => {
    const cfg = config({ words: [{ value: 'x', scopes: ['search'] }] });
    expect(decide(cfg, 'search', { title: 'x' })).toBe(true);
    expect(decide(cfg, 'home', { title: 'x' })).toBe(false);
    expect(decide(cfg, null, { title: 'x' })).toBe(false);
  });

  test('多作用域词条任一命中即可', () => {
    const cfg = config({ words: [{ value: 'u', scopes: ['home', 'video'] }] });
    expect(decide(cfg, 'video', { username: 'u' })).toBe(true);
    expect(decide(cfg, 'search', { username: 'u' })).toBe(false);
  });
});

describe('门控与短路', () => {
  test('总开关关闭 → 全不屏蔽', () => {
    const cfg = config({ enable: false, words: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: 'x' })).toBe(false);
  });

  test('用户名与标题均无 → false', () => {
    const cfg = config({ words: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'home', {})).toBe(false);
    expect(decide(cfg, 'home', { username: null, title: null })).toBe(false);
  });

  test('用户名命中即短路（标题不匹配也屏蔽）', () => {
    const cfg = config({ words: [{ value: 'u', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: 'u', title: '无关' })).toBe(true);
  });
});
