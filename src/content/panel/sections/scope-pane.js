// 面板分节：单个作用域标签页的内容（用户名组 + 关键字组 + 自定义规则组 + 清空临时词）。
// 作用域由标签页承载，组内不再出现作用域选择。
import { FIELD_ID_PREFIX, SCOPE_PANE_CLASS, UL_NODE_CLASS, SEPARATOR_LI_CLASS, SEPARATOR_TEXT_CLASS, LIST_DIV_CLASS, LI_USERNAME_CLASS, LI_KEYWORD_CLASS } from '../../constants.js';
import { createEntriesGroup } from './entries.js';
import { createRulesGroup } from './rules.js';
import { buttonClicked, createSpanBtn } from '../input-row.js';
import { removeTempChips } from '../chips.js';

/**
 * @param {{
 *   scope: string,
 *   usernames: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   keywords: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempUsernames: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempKeywords: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   rules: ReadonlyArray<Record<string, unknown>>,
 *   onTempCleared: () => void,
 * }} params
 * @returns {{
 *   el: HTMLElement,
 *   collect: () => { usernames: object, keywords: object, rules: Array<Record<string, unknown>>, invalidCount: number },
 * }}
 */
export function createScopePane(params) {
  const { scope, usernames, keywords, tempUsernames, tempKeywords, rules, onTempCleared } = params;

  const pane = document.createElement('li');
  pane.className = SCOPE_PANE_CLASS;
  pane.id = FIELD_ID_PREFIX + 'pane_' + scope;
  pane.dataset.scope = scope;
  const innerUl = document.createElement('ul');
  innerUl.className = UL_NODE_CLASS;
  pane.appendChild(innerUl);

  const usernameGroup = createEntriesGroup({
    type: 'username',
    scope,
    sectionLabel: '用户名（精确匹配）：',
    placeholder: ' UP主名称，多个以半角逗号分隔 ',
    liClassname: LI_USERNAME_CLASS,
    entries: usernames,
    tempEntries: tempUsernames,
  });
  const keywordGroup = createEntriesGroup({
    type: 'keyword',
    scope,
    sectionLabel: '关键字或正则（标题匹配）：',
    placeholder: ' 正则表达式格式: /Pattern/Modifier ',
    liClassname: LI_KEYWORD_CLASS,
    entries: keywords,
    tempEntries: tempKeywords,
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

  for (const li of [...usernameGroup.lis, ...keywordGroup.lis, ruleSeparator, rulesLi, clearTempLi]) {
    innerUl.appendChild(li);
  }

  function collect() {
    const usernamesResult = usernameGroup.collect();
    const keywordsResult = keywordGroup.collect();
    const rulesResult = rulesGroup.collect();
    return {
      usernames: usernamesResult,
      keywords: keywordsResult,
      rules: rulesResult.rules,
      invalidCount: rulesResult.invalidCount,
    };
  }

  return { el: pane, collect };
}
