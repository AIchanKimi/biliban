import { describe, test, expect } from 'bun:test';
import { isCurrentVersion, migrateToLatest, mergeRulesWithBuiltins } from '../../src/content/config/migrate.js';
import { BUILTIN_RULES_VERSION } from '../../src/content/config/defaults.js';
import { BUILTIN_RULES } from '../../src/content/rules/builtin-rules.js';

const V5_EMPTY = {
  version: 5,
  enable: true,
  words: [],
  durations: [],
  rules: [...BUILTIN_RULES],
};

describe('isCurrentVersion', () => {
  test('version===5 才算当前版本', () => {
    expect(isCurrentVersion({ version: 5 })).toBe(true);
    expect(isCurrentVersion({ version: 4 })).toBe(false);
    expect(isCurrentVersion({ version: 3 })).toBe(false);
    expect(isCurrentVersion({ version: 2 })).toBe(false);
    expect(isCurrentVersion({})).toBe(false);
    expect(isCurrentVersion(null)).toBe(false);
  });
});

describe('migrateToLatest：v1 → v5', () => {
  test('usernameArray 与 keywordArray 合并为全局 words（用户名在前）', () => {
    const result = migrateToLatest({ usernameArray: ['某UP'], keywordArray: ['广告', '/x/i'] });
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['global'] },
      { value: '/x/i', scopes: ['global'] },
    ]);
    expect(result.version).toBe(5);
    expect(result.durations).toEqual([]);
    expect(result.rules).toEqual([...BUILTIN_RULES]); // 首次迁移播种内置规则
  });

  test('TM 旧形状：regArray 并入', () => {
    const result = migrateToLatest({ regArray: ['旧词'], keywordArray: ['新词'] });
    expect(result.words.map(e => e.value)).toEqual(['新词', '旧词']);
  });

  test('functionEnable 映射为 enable', () => {
    expect(migrateToLatest({ functionEnable: false }).enable).toBe(false);
    expect(migrateToLatest({}).enable).toBe(true);
    expect(migrateToLatest(null).enable).toBe(true);
  });

  test('丢弃评论/白名单/各页面开关（备份由 store 负责）', () => {
    const result = migrateToLatest({
      commentArray: ['评论词'],
      whitelistArray: ['白名单'],
      commentEnable: true,
      liveEnable: true,
    });
    expect(result).toEqual(V5_EMPTY);
  });

  test('null / undefined 输入 → 默认 v5', () => {
    expect(migrateToLatest(null)).toEqual(V5_EMPTY);
  });

  test('不修改入参（不可变）', () => {
    const input = { keywordArray: ['a'] };
    migrateToLatest(input);
    expect(input).toEqual({ keywordArray: ['a'] });
  });
});

describe('migrateToLatest：v2 → v5', () => {
  test('usernames 与 keywords 合并，保留作用域', () => {
    const result = migrateToLatest({
      version: 2,
      enable: true,
      duration: { enable: true, minSeconds: 120 },
      usernames: [{ value: '某UP', scopes: ['global'] }],
      keywords: [{ value: '广告', scopes: ['search'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide' }],
    });
    expect(result.words).toEqual([
      { value: '某UP', scopes: ['global'] },
      { value: '广告', scopes: ['search'] },
    ]);
    expect(result.durations).toEqual([{ op: 'lt', seconds: 120, scopes: ['global'] }]);
    expect(result.rules.length).toBe(BUILTIN_RULES.length + 1); // 内置播种 + 自定义
  });
});

describe('migrateToLatest：v3 → v5', () => {
  test('全局 duration 开关转为「短于」词条', () => {
    const result = migrateToLatest({
      version: 3,
      enable: true,
      duration: { enable: true, minSeconds: 60 },
      words: [{ value: '广告', scopes: ['global'] }],
      rules: [{ id: 'r1', selector: '.x', scopes: ['home'], mode: 'hide' }],
    });
    expect(result.version).toBe(5);
    expect(result.words).toEqual([{ value: '广告', scopes: ['global'] }]);
    expect(result.durations).toEqual([{ op: 'lt', seconds: 60, scopes: ['global'] }]);
    expect(result.rules.length).toBe(BUILTIN_RULES.length + 1);
  });

  test('duration 关闭 → 无词条', () => {
    const result = migrateToLatest({ version: 3, duration: { enable: false, minSeconds: 60 }, words: [] });
    expect(result.durations).toEqual([]);
  });

  test('非法阈值 → 无词条', () => {
    const result = migrateToLatest({ version: 3, duration: { enable: true, minSeconds: -5 }, words: [] });
    expect(result.durations).toEqual([]);
  });

  test('words 去重与过滤', () => {
    const result = migrateToLatest({
      version: 3,
      words: [
        { value: 'a', scopes: ['global'] },
        { value: 'a', scopes: ['global'] },
        { value: '', scopes: ['global'] },
        { value: 'b', scopes: ['home'] },
      ],
    });
    expect(result.words).toEqual([
      { value: 'a', scopes: ['global'] },
      { value: 'b', scopes: ['home'] },
    ]);
  });
});

describe('mergeRulesWithBuiltins（v6.1 内置/自定义同构合并）', () => {
  test('无持久化内置集 → 以代码默认为底，自定义在后', () => {
    const merged = mergeRulesWithBuiltins([{ id: 'custom-1', selector: '.c' }], undefined, undefined);
    expect(merged.filter(r => String(r.id).startsWith('builtin-')).length).toBe(BUILTIN_RULES.length);
    expect(merged[merged.length - 1].id).toBe('custom-1');
  });

  test('版本一致的持久化内置集原样为准（用户删过的不复活）', () => {
    const stored = [{ id: 'builtin-bili-video-card', selector: '.edited', scopes: ['play'] }];
    const merged = mergeRulesWithBuiltins([], stored, BUILTIN_RULES_VERSION);
    expect(merged.length).toBe(1); // 版本一致不补入代码项
    expect(merged[0].selector).toBe('.edited');
  });

  test('内置集版本落后 → 按 id 补入代码新增项，不覆盖同名', () => {
    const stored = [{ id: 'builtin-bili-video-card', selector: '.edited', scopes: ['play'] }];
    const merged = mergeRulesWithBuiltins([], stored, BUILTIN_RULES_VERSION - 1);
    const edited = merged.filter(r => r.id === 'builtin-bili-video-card');
    expect(edited.length).toBe(1);
    expect(edited[0].selector).toBe('.edited');
    expect(merged.length).toBe(BUILTIN_RULES.length);
  });

  test('自定义与内置 id 冲突时先出现者（内置）优先', () => {
    const merged = mergeRulesWithBuiltins([{ id: BUILTIN_RULES[0].id, selector: '.custom-dup' }], undefined, undefined);
    expect(merged.filter(r => r.id === BUILTIN_RULES[0].id).length).toBe(1);
    expect(merged.find(r => r.id === BUILTIN_RULES[0].id).selector).toBe(BUILTIN_RULES[0].selector);
  });

  test('v4 迁移整体：builtinRules 并入 rules，v5 直通', () => {
    const fromV4 = migrateToLatest({
      version: 4,
      builtinRules: [{ id: 'builtin-space-cube', selector: '.kept', scopes: ['space'] }],
      rules: [{ id: 'mine', selector: '.m', scopes: ['fav'] }],
    });
    expect(fromV4.version).toBe(5);
    expect(fromV4.rules.find(r => r.id === 'builtin-space-cube').selector).toBe('.kept');
    expect(fromV4.rules.find(r => r.id === 'mine')).toBeTruthy();
    expect('builtinRules' in fromV4).toBe(false);
  });
});
