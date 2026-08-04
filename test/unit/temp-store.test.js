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

describe('temp-store（标签页内存临时词条，kind: word/duration）', () => {
  beforeEach(() => clearTempEntries());

  test('add/get：屏蔽词与时长词条入内存', () => {
    addTempEntries([
      { kind: 'word', value: '临时词', scopes: ['search'] },
      { kind: 'duration', op: 'lt', seconds: 60, scopes: ['global'] },
    ]);
    expect(getTempEntries()).toEqual([
      { kind: 'word', value: '临时词', scopes: ['search'] },
      { kind: 'duration', op: 'lt', seconds: 60, scopes: ['global'] },
    ]);
  });

  test('add：非法项被过滤（空值/坏 kind/坏 op/非正秒数），scopes 归一化', () => {
    addTempEntries([
      { kind: 'word', value: '', scopes: ['search'] },
      { kind: 'bad', value: 'x', scopes: ['search'] },
      { kind: 'duration', op: 'eq', seconds: 5, scopes: ['global'] },
      { kind: 'duration', op: 'lt', seconds: -1, scopes: ['global'] },
      { kind: 'word', value: 'y', scopes: ['dynamics', 'home'] },
    ]);
    expect(getTempEntries()).toEqual([{ kind: 'word', value: 'y', scopes: ['home'] }]);
  });

  test('add：重复词条（身份）不重复入列', () => {
    addTempEntries([{ kind: 'word', value: 'a', scopes: ['search'] }]);
    addTempEntries([{ kind: 'word', value: 'a', scopes: ['search'] }]);
    expect(getTempEntries().length).toBe(1);
  });

  test('remove：按身份精确移除', () => {
    addTempEntries([
      { kind: 'word', value: 'a', scopes: ['search'] },
      { kind: 'duration', op: 'lt', seconds: 60, scopes: ['search'] },
    ]);
    removeTempEntry({ kind: 'word', value: 'a', scopes: ['search'] });
    expect(getTempEntries()).toEqual([{ kind: 'duration', op: 'lt', seconds: 60, scopes: ['search'] }]);
  });

  test('clear：清空', () => {
    addTempEntries([{ kind: 'word', value: 'a', scopes: ['global'] }]);
    clearTempEntries();
    expect(getTempEntries()).toEqual([]);
  });

  test('setTempEntries：整体替换（面板保存语义）', () => {
    addTempEntries([{ kind: 'word', value: 'old', scopes: ['global'] }]);
    setTempEntries([{ kind: 'duration', op: 'gt', seconds: 3600, scopes: ['search'] }]);
    expect(getTempEntries()).toEqual([{ kind: 'duration', op: 'gt', seconds: 3600, scopes: ['search'] }]);
  });

  test('removeTempEntriesByScope：按分类清空（屏蔽词与时长一起清）', () => {
    addTempEntries([
      { kind: 'word', value: 'a', scopes: ['search'] },
      { kind: 'duration', op: 'lt', seconds: 60, scopes: ['search'] },
      { kind: 'word', value: 'c', scopes: ['home'] },
    ]);
    removeTempEntriesByScope('search');
    expect(getTempEntries()).toEqual([{ kind: 'word', value: 'c', scopes: ['home'] }]);
  });

  test('getTempEntries 返回副本（外部修改不影响内部）', () => {
    addTempEntries([{ kind: 'word', value: 'a', scopes: ['global'] }]);
    getTempEntries().push({ kind: 'word', value: 'fake' });
    expect(getTempEntries().length).toBe(1);
  });
});

describe('getEffectiveEntries / mergeTempEntries（持久 + 临时合并）', () => {
  beforeEach(() => clearTempEntries());

  test('按 kind 合并，临时排后，输出不带 kind', () => {
    addTempEntries([
      { kind: 'word', value: '临k', scopes: ['search'] },
      { kind: 'duration', op: 'lt', seconds: 30, scopes: ['home'] },
    ]);
    expect(getEffectiveEntries([{ value: '持k', scopes: ['global'] }], 'word')).toEqual([
      { value: '持k', scopes: ['global'] },
      { value: '临k', scopes: ['search'] },
    ]);
    expect(getEffectiveEntries([], 'duration')).toEqual([{ op: 'lt', seconds: 30, scopes: ['home'] }]);
  });

  test('同身份：持久优先，跳过临时副本', () => {
    addTempEntries([{ kind: 'duration', op: 'lt', seconds: 60, scopes: ['global'] }]);
    expect(getEffectiveEntries([{ op: 'lt', seconds: 60, scopes: ['global'] }], 'duration')).toEqual([
      { op: 'lt', seconds: 60, scopes: ['global'] },
    ]);
  });

  test('mergeTempEntries：words 与 durations 同时合并（不修改入参）', () => {
    addTempEntries([
      { kind: 'word', value: '临', scopes: ['search'] },
      { kind: 'duration', op: 'gt', seconds: 7200, scopes: ['global'] },
    ]);
    const runtime = {
      enable: true,
      words: [{ value: 'k', scopes: ['global'] }],
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
    };
    const merged = mergeTempEntries(runtime);
    expect(merged.words.map(e => e.value)).toEqual(['k', '临']);
    expect(merged.durations.map(e => e.seconds)).toEqual([60, 7200]);
    expect(runtime.words.length).toBe(1);
    expect(runtime.durations.length).toBe(1);
  });
});
