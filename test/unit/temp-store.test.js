import { describe, test, expect, beforeEach } from 'bun:test';
import {
  getTempEntries,
  addTempEntries,
  removeTempEntry,
  clearTempEntries,
  getEffectiveEntries,
} from '../../src/content/config/temp-store.js';

describe('temp-store（标签页内存临时词条）', () => {
  beforeEach(() => clearTempEntries());

  test('add/get：合法词条入内存', () => {
    addTempEntries([
      { value: '临时词', type: 'keyword', scopes: ['search'] },
      { value: '某人', type: 'username', scopes: ['global'] },
    ]);
    expect(getTempEntries()).toEqual([
      { value: '临时词', type: 'keyword', scopes: ['search'] },
      { value: '某人', type: 'username', scopes: ['global'] },
    ]);
  });

  test('add：非法词条被过滤（空值/坏类型），scopes 归一化', () => {
    addTempEntries([
      { value: '', type: 'keyword', scopes: ['search'] },
      { value: 'x', type: 'bad', scopes: ['search'] },
      { value: 'y', type: 'keyword', scopes: ['live', 'home'] },
    ]);
    expect(getTempEntries()).toEqual([{ value: 'y', type: 'keyword', scopes: ['home'] }]);
  });

  test('add：重复词条（值+类型+作用域）不重复入列', () => {
    addTempEntries([{ value: 'a', type: 'keyword', scopes: ['search'] }]);
    addTempEntries([{ value: 'a', type: 'keyword', scopes: ['search'] }]);
    expect(getTempEntries().length).toBe(1);
  });

  test('remove：按 值+类型+作用域 精确移除', () => {
    addTempEntries([
      { value: 'a', type: 'keyword', scopes: ['search'] },
      { value: 'b', type: 'keyword', scopes: ['search'] },
    ]);
    removeTempEntry({ value: 'a', type: 'keyword', scopes: ['search'] });
    expect(getTempEntries().map(e => e.value)).toEqual(['b']);
  });

  test('clear：清空', () => {
    addTempEntries([{ value: 'a', type: 'keyword', scopes: ['global'] }]);
    clearTempEntries();
    expect(getTempEntries()).toEqual([]);
  });

  test('getTempEntries 返回副本（外部修改不影响内部）', () => {
    addTempEntries([{ value: 'a', type: 'keyword', scopes: ['global'] }]);
    getTempEntries().push({ value: 'fake' });
    expect(getTempEntries().length).toBe(1);
  });
});

describe('getEffectiveEntries（持久 + 临时合并）', () => {
  beforeEach(() => clearTempEntries());

  test('按类型合并，临时词条排在持久之后', () => {
    addTempEntries([
      { value: '临k', type: 'keyword', scopes: ['search'] },
      { value: '临u', type: 'username', scopes: ['home'] },
    ]);
    const persistent = [{ value: '持k', scopes: ['global'] }];
    expect(getEffectiveEntries(persistent, 'keyword')).toEqual([
      { value: '持k', scopes: ['global'] },
      { value: '临k', scopes: ['search'] },
    ]);
    expect(getEffectiveEntries([], 'username')).toEqual([{ value: '临u', scopes: ['home'] }]);
  });

  test('同值同作用域：持久优先，跳过临时副本', () => {
    addTempEntries([{ value: 'dup', type: 'keyword', scopes: ['global'] }]);
    const merged = getEffectiveEntries([{ value: 'dup', scopes: ['global'] }], 'keyword');
    expect(merged).toEqual([{ value: 'dup', scopes: ['global'] }]);
  });

  test('同值不同作用域：两者并存', () => {
    addTempEntries([{ value: 'dup', type: 'keyword', scopes: ['search'] }]);
    const merged = getEffectiveEntries([{ value: 'dup', scopes: ['global'] }], 'keyword');
    expect(merged.length).toBe(2);
  });
});
