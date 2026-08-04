// 面板分节：单个作用域标签页的内容（屏蔽词组 + 自定义规则组 + 清空临时词）。
// 作用域由标签页承载，组内不再出现作用域选择。
import { FIELD_ID_PREFIX, SCOPE_PANE_CLASS, UL_NODE_CLASS, LIST_DIV_CLASS, LI_WORDS_CLASS } from '../../constants.js';
import { createEntriesGroup } from './entries.js';
import { createDurationsGroup } from './durations.js';
import { createRulesGroup } from './rules.js';
import { buttonClicked, createSpanBtn } from '../input-row.js';
import { removeTempChips } from '../chips.js';

/**
 * @param {{
 *   scope: string,
 *   words: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempWords: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   durations: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   tempDurations: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   rules: ReadonlyArray<Record<string, unknown>>,
 *   onTempCleared: () => void,
 * }} params
 * @returns {{
 *   el: HTMLElement,
 *   collect: () => { words: object, durations: object, rules: Array<Record<string, unknown>> },
 * }}
 */
export function createScopePane(params) {
  const { scope, words, tempWords, durations, tempDurations, rules, onTempCleared } = params;
  // 「全局」面板管理屏蔽词 + 时长词条；规则归各具体分类
  const rulesAllowed = scope !== 'global';

  const pane = document.createElement('li');
  pane.className = SCOPE_PANE_CLASS;
  pane.id = FIELD_ID_PREFIX + 'pane_' + scope;
  pane.dataset.scope = scope;
  const innerUl = document.createElement('ul');
  innerUl.className = UL_NODE_CLASS;
  pane.appendChild(innerUl);

  const wordsGroup = createEntriesGroup({
    scope,
    liClassname: LI_WORDS_CLASS,
    entries: words,
    tempEntries: tempWords,
  });

  const durationsGroup = createDurationsGroup({
    scope,
    entries: durations,
    tempEntries: tempDurations,
  });
  const extraLis = [...durationsGroup.lis];

  let rulesGroup = null;
  if (rulesAllowed) {
    // v6.3：规则区整体默认折叠，头部「规则」开关按需展开
    rulesGroup = createRulesGroup({ scope, rules });
    const rulesLi = document.createElement('li');
    const rulesDiv = document.createElement('div');
    rulesDiv.className = LIST_DIV_CLASS;
    rulesDiv.id = FIELD_ID_PREFIX + 'rules_' + scope;
    rulesDiv.appendChild(rulesGroup.container);
    rulesLi.appendChild(rulesDiv);

    extraLis.push(rulesLi);
  }

  const clearTempLi = document.createElement('li');
  const clearTempDiv = document.createElement('div');
  clearTempDiv.className = LIST_DIV_CLASS;
  const clearTempBtn = createSpanBtn('清空临时词', '立即清空本分类下的全部临时词条（仅本标签页）', () => {
    for (const listEl of pane.querySelectorAll('.block_obj_list_textarea_div')) {
      removeTempChips(listEl);
    }
    onTempCleared();
    buttonClicked(clearTempBtn, '已清空');
  });
  clearTempDiv.appendChild(clearTempBtn);
  clearTempLi.appendChild(clearTempDiv);

  for (const li of [...wordsGroup.lis, ...extraLis, clearTempLi]) {
    innerUl.appendChild(li);
  }

  function collect() {
    const result = {
      words: wordsGroup.collect(),
      durations: durationsGroup.collect(),
      rules: [],
    };
    if (rulesGroup) {
      result.rules = rulesGroup.collect().rules;
    }
    return result;
  }

  return { el: pane, collect };
}
