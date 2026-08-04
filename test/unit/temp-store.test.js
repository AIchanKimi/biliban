import { describe, test, expect, beforeEach } from 'bun:test';
import {
  getTempEntries,
  addTempEntries,
  removeTempEntry,
  clearTempEntries,
  removeTempEntriesByScope,
  getEffectiveEntries,
  mergeTempEntries,
  setTempEntries,
} from '../../src/content/config/temp-store.js';

describe('temp-store（标签页内存临时词条）', () => {
  beforeEach(() => clearTempEntries());

  test('add/get：合法词条入内存', () => {
    addTempEntries([
      { value: '临时词', scopes: ['search'] },
      { value: '某人', scopes: ['global'] },
    ]);
    expect(getTempEntries()).toEqual([
      { value: '临时词', scopes: ['search'] },
      { value: '某人', scopes: ['global'] },
    ]);
  });

  test('add：非法词条被过滤（空值），scopes 归一化', () => {
    addTempEntries([
      { value: '', scopes: ['search'] },
      { value: null, scopes: ['search'] },
      { value: 'y', scopes: ['live', 'home'] },
    ]);
    expect(getTempEntries()).toEqual([{ value: 'y', scopes: ['home'] }]);
  });

  test('add：重复词条（值+作用域）不重复入列', () => {
    addTempEntries([{ value: 'a', scopes: ['search'] }]);
    addTempEntries([{ value: 'a', scopes: ['search'] }]);
    expect(getTempEntries().length).toBe(1);
  });

  test('remove：按 值+作用域 精确移除', () => {
    addTempEntries([
      { value: 'a', scopes: ['search'] },
      { value: 'b', scopes: ['search'] },
    ]);
    removeTempEntry({ value: 'a', scopes: ['search'] });
    expect(getTempEntries().map(e => e.value)).toEqual(['b']);
  });

  test('clear：清空', () => {
    addTempEntries([{ value: 'a', scopes: ['global'] }]);
    clearTempEntries();
    expect(getTempEntries()).toEqual([]);
  });

  test('setTempEntries：整体替换（面板保存语义）', () => {
    addTempEntries([{ value: 'old', scopes: ['global'] }]);
    setTempEntries([{ value: 'new', scopes: ['search'] }]);
    expect(getTempEntries()).toEqual([{ value: 'new', scopes: ['search'] }]);
  });

  test('removeTempEntriesByScope：按分类清空（标签页「清空临时词」）', () => {
    addTempEntries([
      { value: 'a', scopes: ['search'] },
      { value: 'b', scopes: ['search'] },
      { value: 'c', scopes: ['home'] },
    ]);
    removeTempEntriesByScope('search');
    expect(getTempEntries()).toEqual([{ value: 'c', scopes: ['home'] }]);
  });

  test('getTempEntries 返回副本（外部修改不影响内部）', () => {
    addTempEntries([{ value: 'a', scopes: ['global'] }]);
    getTempEntries().push({ value: 'fake' });
    expect(getTempEntries().length).toBe(1);
  });
});

describe('getEffectiveEntries / mergeTempEntries（持久 + 临时合并）', () => {
  beforeEach(() => clearTempEntries());

  test('临时词条排在持久之后', () => {
    addTempEntries([{ value: '临', scopes: ['search'] }]);
    expect(getEffectiveEntries([{ value: '持', scopes: ['global'] }])).toEqual([
      { value: '持', scopes: ['global'] },
      { value: '临', scopes: ['search'] },
    ]);
  });

  test('同值同作用域：持久优先，跳过临时副本', () => {
    addTempEntries([{ value: 'dup', scopes: ['global'] }]);
    expect(getEffectiveEntries([{ value: 'dup', scopes: ['global'] }])).toEqual([
      { value: 'dup', scopes: ['global'] },
    ]);
  });

  test('同值不同作用域：两者并存', () => {
    addTempEntries([{ value: 'dup', scopes: ['search'] }]);
    expect(getEffectiveEntries([{ value: 'dup', scopes: ['global'] }]).length).toBe(2);
  });

  test('mergeTempEntries：运行时配置合并临时词条（不修改入参）', () => {
    addTempEntries([{ value: '临', scopes: ['search'] }]);
    const runtime = { enable: true, words: [{ value: 'k', scopes: ['global'] }] };
    const merged = mergeTempEntries(runtime);
    expect(merged.words.map(e => e.value)).toEqual(['k', '临']);
    expect(runtime.words.length).toBe(1);
  });
});
