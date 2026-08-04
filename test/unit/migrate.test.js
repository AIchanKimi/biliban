import { describe, test, expect } from 'bun:test';
import { applyMigrations } from '../../src/content/config/migrate.js';

describe('applyMigrations', () => {
  test('regArray 合并进 keywordArray 并删除旧 key', () => {
    const result = applyMigrations({ regArray: ['旧词'], keywordArray: ['新词'] });
    expect(result.keywordArray).toEqual(['新词', '旧词']);
    expect('regArray' in result).toBe(false);
  });

  test('commentRegArray 合并进 commentArray', () => {
    const result = applyMigrations({ commentRegArray: ['/x/'], commentArray: ['y'] });
    expect(result.commentArray).toEqual(['y', '/x/']);
    expect('commentRegArray' in result).toBe(false);
  });

  test('目标 key 缺失时视为空数组（Block_Obj 崩溃 bug 修复回归测试）', () => {
    const result = applyMigrations({ regArray: ['旧词'] });
    expect(result.keywordArray).toEqual(['旧词']);
    expect('regArray' in result).toBe(false);
  });

  test('无旧 key 时为空操作（其他字段原样保留）', () => {
    const input = { functionEnable: false, keywordArray: ['a'] };
    const result = applyMigrations(input);
    expect(result).toEqual(input);
  });

  test('旧 key 非数组时不迁移、不删除', () => {
    const result = applyMigrations({ regArray: 'not-an-array' });
    expect(result.regArray).toBe('not-an-array');
    expect(result.keywordArray).toBeUndefined();
  });

  test('null / undefined 输入返回空对象', () => {
    expect(applyMigrations(null)).toEqual({});
    expect(applyMigrations(undefined)).toEqual({});
  });

  test('不修改入参（不可变）', () => {
    const input = { regArray: ['旧词'], keywordArray: ['新词'] };
    applyMigrations(input);
    expect(input).toEqual({ regArray: ['旧词'], keywordArray: ['新词'] });
  });
});
