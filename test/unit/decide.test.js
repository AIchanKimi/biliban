import { describe, test, expect } from 'bun:test';
import { decide } from '../../src/content/engine/decide.js';

const config = (overrides = {}) => ({
  version: 2,
  enable: true,
  duration: { enable: false, minSeconds: 300 },
  usernames: [],
  keywords: [],
  rules: [],
  ...overrides,
});

describe('用户名精确匹配', () => {
  test('trim 后全等命中', () => {
    const cfg = config({ usernames: [{ value: '某UP', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: '  某UP  ' })).toBe(true);
  });

  test('包含关系不命中（精确语义）', () => {
    const cfg = config({ usernames: [{ value: '某UP', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: '某UP官方号' })).toBe(false);
  });

  test('"/re/" 形式按字面字符串处理（v1 语义）', () => {
    const cfg = config({ usernames: [{ value: '/某UP/', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: '某UP' })).toBe(false);
    expect(decide(cfg, 'home', { username: '/某UP/' })).toBe(true);
  });
});

describe('关键字匹配', () => {
  test('字符串 includes 命中', () => {
    const cfg = config({ keywords: [{ value: '广告', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '超好看广告合集' })).toBe(true);
    expect(decide(cfg, 'home', { title: '正常标题' })).toBe(false);
  });

  test('RegExp test 命中（含 flags）', () => {
    const cfg = config({ keywords: [{ value: /^直播.*预告$/i, scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '直播明日预告' })).toBe(true);
    expect(decide(cfg, 'home', { title: '直播回放' })).toBe(false);
  });

  test('/g 正则重复判定不抖动（无 lastIndex 状态污染）', () => {
    const cfg = config({ keywords: [{ value: /广告/g, scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
    expect(decide(cfg, 'home', { title: '广告' })).toBe(true);
  });

  test('空字符串词条不造成全屏蔽', () => {
    const cfg = config({ keywords: [{ value: '', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: '任意标题' })).toBe(false);
  });
});

describe('作用域过滤', () => {
  test('global 词条处处生效', () => {
    const cfg = config({ keywords: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'search', { title: 'x' })).toBe(true);
    expect(decide(cfg, 'dynamics', { title: 'x' })).toBe(true);
  });

  test('分类词条仅本类生效', () => {
    const cfg = config({ keywords: [{ value: 'x', scopes: ['search'] }] });
    expect(decide(cfg, 'search', { title: 'x' })).toBe(true);
    expect(decide(cfg, 'home', { title: 'x' })).toBe(false);
    expect(decide(cfg, null, { title: 'x' })).toBe(false);
  });

  test('多作用域词条任一命中即可', () => {
    const cfg = config({ usernames: [{ value: 'u', scopes: ['home', 'video'] }] });
    expect(decide(cfg, 'video', { username: 'u' })).toBe(true);
    expect(decide(cfg, 'search', { username: 'u' })).toBe(false);
  });
});

describe('门控与短路', () => {
  test('总开关关闭 → 全不屏蔽', () => {
    const cfg = config({ enable: false, keywords: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { title: 'x' })).toBe(false);
  });

  test('用户名与标题均无 → false', () => {
    const cfg = config({ keywords: [{ value: 'x', scopes: ['global'] }] });
    expect(decide(cfg, 'home', {})).toBe(false);
    expect(decide(cfg, 'home', { username: null, title: null })).toBe(false);
  });

  test('用户名优先短路（标题不匹配也屏蔽）', () => {
    const cfg = config({ usernames: [{ value: 'u', scopes: ['global'] }] });
    expect(decide(cfg, 'home', { username: 'u', title: '无关' })).toBe(true);
  });
});
