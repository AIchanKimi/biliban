// 面板分节：单个作用域标签页的内容（屏蔽词组 + 时长组 + 规则组）。
// 作用域由标签页承载，组内不再出现作用域选择。
import {
  FIELD_ID_PREFIX,
  SCOPE_PANE_CLASS,
  UL_NODE_CLASS,
  LIST_DIV_CLASS,
  LI_WORDS_CLASS,
} from "../../constants.js";
import { createEntriesGroup } from "./entries.js";
import { createDurationsGroup } from "./durations.js";
import { createRulesGroup } from "./rules.js";

/**
 * @param {{
 *   scope: string,
 *   words: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   tempWords: ReadonlyArray<{ value: string, scopes: string[] }>,
 *   durations: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   tempDurations: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   rules: ReadonlyArray<Record<string, unknown>>,
 * }} params
 * @returns {{
 *   el: HTMLElement,
 *   collect: () => { words: object, durations: object, rules: Array<Record<string, unknown>> },
 * }}
 */
export function createScopePane(params) {
  const { scope, words, tempWords, durations, tempDurations, rules } = params;

  const pane = document.createElement("li");
  pane.className = SCOPE_PANE_CLASS;
  pane.id = FIELD_ID_PREFIX + "pane_" + scope;
  pane.dataset.scope = scope;
  const innerUl = document.createElement("ul");
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

  // v6.3：规则区整体默认折叠，头部「规则」开关按需展开
  // v6.8：全局分类同样承载规则——全局规则在任意注入页面执行（如顶栏悬浮窗浮层）
  const rulesGroup = createRulesGroup({ scope, rules });
  const rulesLi = document.createElement("li");
  const rulesDiv = document.createElement("div");
  rulesDiv.className = LIST_DIV_CLASS;
  rulesDiv.id = FIELD_ID_PREFIX + "rules_" + scope;
  rulesDiv.appendChild(rulesGroup.container);
  rulesLi.appendChild(rulesDiv);

  extraLis.push(rulesLi);

  for (const li of [...wordsGroup.lis, ...extraLis]) {
    innerUl.appendChild(li);
  }

  function collect() {
    return {
      words: wordsGroup.collect(),
      durations: durationsGroup.collect(),
      rules: rulesGroup.collect().rules,
    };
  }

  return { el: pane, collect };
}
