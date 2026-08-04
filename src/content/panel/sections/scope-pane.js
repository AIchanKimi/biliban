// 面板分节：单个作用域标签页的内容（屏蔽词组 + 自定义规则组 + 清空临时词）。
// 作用域由标签页承载，组内不再出现作用域选择。
import { FIELD_ID_PREFIX, SCOPE_PANE_CLASS, UL_NODE_CLASS, SEPARATOR_LI_CLASS, SEPARATOR_TEXT_CLASS, LIST_DIV_CLASS, LI_WORDS_CLASS } from '../../constants.js';
import { createEntriesGroup } from './entries.js';
import { createRulesGroup } from './rules.js';
import { buttonClicked, createSpanBtn } from '../input-row.js';
import { removeTempChips } from '../chips.js';

/**
 * @param {{
 *   scope: string,
 *   words: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempWords: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   rules: ReadonlyArray<Record<string, unknown>>,
 *   onTempCleared: () => void,
 * }} params
 * @returns {{
 *   el: HTMLElement,
 *   collect: () => { words: { persistent: Array<object>, temp: Array<object> }, rules: Array<Record<string, unknown>>, invalidCount: number },
 * }}
 */
export function createScopePane(params) {
  const { scope, words, tempWords, rules, onTempCleared } = params;

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

  const ruleSeparator = document.createElement('li');
  ruleSeparator.className = SEPARATOR_LI_CLASS;
  const ruleSeparatorText = document.createElement('span');
  ruleSeparatorText.className = SEPARATOR_TEXT_CLASS;
  ruleSeparatorText.textContent = '自定义规则（B 站改版后在此改选择器）：';
  ruleSeparatorText.title = '规则教扩展认识本页面的卡片容器；无需修改扩展代码';
  ruleSeparator.appendChild(ruleSeparatorText);

  const rulesGroup = createRulesGroup({ scope, rules });
  const rulesLi = document.createElement('li');
  const rulesDiv = document.createElement('div');
  rulesDiv.className = LIST_DIV_CLASS;
  rulesDiv.id = FIELD_ID_PREFIX + 'rules_' + scope;
  rulesDiv.appendChild(rulesGroup.container);
  rulesLi.appendChild(rulesDiv);

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

  for (const li of [...wordsGroup.lis, ruleSeparator, rulesLi, clearTempLi]) {
    innerUl.appendChild(li);
  }

  function collect() {
    const wordsResult = wordsGroup.collect();
    const rulesResult = rulesGroup.collect();
    return {
      words: wordsResult,
      rules: rulesResult.rules,
      invalidCount: rulesResult.invalidCount,
    };
  }

  return { el: pane, collect };
}
