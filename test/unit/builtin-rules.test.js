import { describe, test, expect } from 'bun:test';
import { BUILTIN_RULES } from '../../src/content/rules/builtin-rules.js';
import { SCOPE_VALUES } from '../../src/content/config/scopes.js';

describe('builtin-rules 形状', () => {
  test('共 23 条（38 − 10 直播 − 4 相薄 − 1 死规则）', () => {
    expect(BUILTIN_RULES.length).toBe(23);
  });

  test('每条形状合法：id/selector/scopes/mode', () => {
    const ids = new Set();
    for (const rule of BUILTIN_RULES) {
      expect(typeof rule.id).toBe('string');
      expect(rule.id.length).toBeGreaterThan(0);
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
      expect(typeof rule.selector).toBe('string');
      expect(rule.selector.length).toBeGreaterThan(0);
      expect(rule.mode).toBe('match');
      expect(rule.scopes.length).toBeGreaterThan(0);
      for (const scope of rule.scopes) {
        expect(SCOPE_VALUES).toContain(scope);
      }
      expect(Object.isFrozen(rule)).toBe(true);
    }
  });

  test('无直播/相薄/评论残留', () => {
    const json = JSON.stringify(BUILTIN_RULES.map(r => r.selector));
    for (const gone of ['live-card', 'card-live-module', 'live-rank-item', 'live-user-item', 'live-room-item', 'room-card-wrapper', 'ysly-room-ctnr', 'card-items', 'photo-item', 'canvas-card', 'rank-list li.item']) {
      expect(json).not.toContain(gone);
    }
    for (const rule of BUILTIN_RULES) {
      expect(rule.comment).toBeUndefined();
      expect(rule.type).toBeUndefined();
    }
  });

  test('resolve bv 仅一条（.storey-box .spread-module）', () => {
    const resolvers = BUILTIN_RULES.filter(r => r.resolve === 'bv');
    expect(resolvers.length).toBe(1);
    expect(resolvers[0].selector).toBe('.storey-box .spread-module');
    expect(resolvers[0].bvSelector).toBe('a');
  });

  test('userReg 仅 groom-module 保留 /^up主：/', () => {
    const withReg = BUILTIN_RULES.filter(r => r.userReg);
    expect(withReg.length).toBe(1);
    expect(withReg[0].selector).toBe('.groom-module');
    expect(withReg[0].userReg).toEqual(/^up主：/);
  });
});

describe('scopes 映射表（按旧 indexOf 语义逐条钉死）', () => {
  const scopesOf = selector => BUILTIN_RULES.find(r => r.selector === selector)?.scopes;

  test('缺省 url 规则 → [home, video]', () => {
    for (const selector of [
      '.bpx-player-ending-related-item',
      '.recommend-video-card',
      '.video-page-card-small',
      '.video-card-common',
      '.video-card-reco',
      '.van-slide div.item',
      '.rank-wrap',
      '.article-card',
      '.manga-card',
      '.manga-spread-module',
      '.groom-module',
      'ul.vd-list li',
      '.video-page-card, .video-page-operator-card',
      '.storey-box .spread-module',
    ]) {
      expect(scopesOf(selector)).toEqual(['home', 'video']);
    }
  });

  test('.video-card（旧含裸 bilibili.com）→ [global]', () => {
    expect(scopesOf('.video-card')).toEqual(['global']);
  });

  test('搜索页三条 → [search]', () => {
    expect(scopesOf('.user-list')).toEqual(['search']);
    expect(scopesOf('div:has(> .bili-video-card)')).toEqual(['search']);
    expect(scopesOf('.video-item')).toEqual(['search']);
  });

  test('动态与空间规则 v5.2 归 [global]（分类精简，全局词条覆盖）', () => {
    expect(scopesOf('.bili-dyn-item')).toEqual(['global']);
    expect(scopesOf('.cube-list .small-item')).toEqual(['global']);
  });

  test('全部 scopes 只含 v5.2 的 4 个有效分类', () => {
    for (const rule of BUILTIN_RULES) {
      for (const scope of rule.scopes) {
        expect(SCOPE_VALUES).toContain(scope);
      }
    }
  });

  test('.ebox（旧 url 仅 video|bangumi 路径）→ [video]', () => {
    expect(scopesOf('.ebox')).toEqual(['video']);
  });

  test('www 特定路径 → [home]', () => {
    expect(scopesOf('.article-list li')).toEqual(['home']);
    expect(scopesOf('.rank-video-card, .video-card')).toEqual(['home']);
  });
});

describe('选择器提取字段保留', () => {
  const ruleOf = selector => BUILTIN_RULES.find(r => r.selector === selector);

  test('标题/用户名选择器与 v1 一致（抽样）', () => {
    expect(ruleOf('div:has(> .bili-video-card)').titleSelector).toBe('.bili-video-card__info--tit');
    expect(ruleOf('div:has(> .bili-video-card)').userSelector).toBe('.bili-video-card__info--author');
    expect(ruleOf('.bili-dyn-item').userSelector).toBe('.bili-dyn-item .dyn-orig-author__name');
    expect(ruleOf('.ebox').titleSelector).toBe('.etitle');
  });

  test('method 1 规则保留（visibility 隐藏）', () => {
    for (const selector of ['.video-card-common', '.article-card', '.manga-card', '.manga-spread-module']) {
      expect(ruleOf(selector).method).toBe(1);
    }
    expect(ruleOf('.rank-wrap').method ?? 0).toBe(0);
  });

  test('数组选择器保留（多候选）', () => {
    expect(ruleOf('.video-card-common').userSelector).toEqual(['a.up', 'a.ex-up']);
    expect(ruleOf('.rank-wrap').titleSelector).toEqual(['p.f-title', 'p.title', 'div.txt a.link p']);
  });
});
