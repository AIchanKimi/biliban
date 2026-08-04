// 面板分节：自定义规则编辑器。
// B 站改版后可在此直接改选择器，无需修改扩展代码。
// 规则 = CSS 选择器 + 作用域 + 模式（按词条匹配 / 直接隐藏）+ 可选标题/UP主选择器。
// 收集时校验：选择器必须可编译；match 模式必须至少提供标题或 UP主选择器之一。
import {
  FIELD_ID_PREFIX,
  INPUT_CLASS,
  SELECT_CLASS,
  SEPARATOR_LI_CLASS,
  SEPARATOR_TEXT_CLASS,
  LIST_DIV_CLASS,
  RULE_ROW_CLASS,
  RULE_MORE_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
} from '../../constants.js';
import { SCOPES } from '../../config/scopes.js';
import { createSpanBtn } from '../input-row.js';

const RULES_LIST_ID = FIELD_ID_PREFIX + 'rulesList';

/**
 * @param {string} selector
 * @returns {boolean}
 */
export function isCompilableSelector(selector) {
  if (typeof selector !== 'string' || selector.trim() === '') {
    return false;
  }
  try {
    document.querySelectorAll(selector);
    return true;
  } catch {
    return false;
  }
}

function scopeSelect(selected) {
  const select = document.createElement('select');
  select.className = SELECT_CLASS;
  select.title = '作用域：规则在哪些页面生效';
  for (const scope of SCOPES) {
    const option = document.createElement('option');
    option.value = scope.value;
    option.textContent = scope.label;
    option.selected = selected === scope.value;
    select.appendChild(option);
  }
  return select;
}

function textInput(value, placeholder, title) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = INPUT_CLASS;
  input.value = value;
  input.placeholder = placeholder;
  input.title = title;
  return input;
}

/**
 * @param {{ id?: string, selector?: string, scopes?: string[], mode?: string, titleSelector?: string, userSelector?: string, enabled?: boolean }} rule
 * @returns {HTMLElement}
 */
export function createRuleRow(rule = {}) {
  const row = document.createElement('div');
  row.className = RULE_ROW_CLASS;
  row.dataset.ruleId = rule.id || crypto.randomUUID();

  const enabledBox = document.createElement('input');
  enabledBox.type = 'checkbox';
  enabledBox.className = CHECKBOX_INPUT_CLASS;
  enabledBox.checked = rule.enabled !== false;
  const enabledLabel = document.createElement('label');
  enabledLabel.className = CHECKBOX_LABEL_CLASS;
  enabledLabel.title = '启用该规则';
  enabledLabel.textContent = '启用';

  const selectorInput = textInput(rule.selector ?? '', 'CSS 选择器（卡片容器）', '目标卡片容器选择器，如 .bili-video-card');
  const scopes = Array.isArray(rule.scopes) && rule.scopes.length > 0 ? rule.scopes : ['global'];
  const scopeSel = scopeSelect(scopes[0]);

  const modeSel = document.createElement('select');
  modeSel.className = SELECT_CLASS;
  modeSel.title = '按词条匹配：命中用户名/关键字才隐藏；直接隐藏：选中即隐藏';
  for (const [value, label] of [['match', '按词条匹配'], ['hide', '直接隐藏']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = rule.mode === value;
    modeSel.appendChild(option);
  }

  const moreBtn = createSpanBtn('更多', '展开标题/UP主选择器', () => {
    const isHidden = moreDiv.classList.toggle('block_obj_li_hide');
    moreBtn.textContent = isHidden ? '更多' : '收起';
  });
  const delBtn = createSpanBtn('删除', '删除该规则', () => row.remove());

  const moreDiv = document.createElement('div');
  moreDiv.className = RULE_MORE_CLASS;
  const titleInput = textInput(rule.titleSelector ?? '', '标题选择器（可选）', '卡片内标题元素选择器；match 模式至少填写标题或 UP主选择器之一');
  const userInput = textInput(rule.userSelector ?? '', 'UP主选择器（可选）', '卡片内 UP主元素选择器');
  moreDiv.appendChild(titleInput);
  moreDiv.appendChild(userInput);
  if (rule.mode === 'hide' || (!rule.titleSelector && !rule.userSelector)) {
    moreDiv.classList.add('block_obj_li_hide');
    moreBtn.textContent = '更多';
  } else {
    moreBtn.textContent = '收起';
  }

  row.appendChild(enabledBox);
  row.appendChild(enabledLabel);
  row.appendChild(selectorInput);
  row.appendChild(scopeSel);
  row.appendChild(modeSel);
  row.appendChild(moreBtn);
  row.appendChild(delBtn);
  row.appendChild(moreDiv);
  return row;
}

/**
 * @param {ReadonlyArray<Record<string, unknown>>} rules
 * @returns {{ lis: HTMLElement[], collect: () => { rules: Array<Record<string, unknown>>, invalidCount: number } }}
 */
export function createRulesSection(rules) {
  const separatorLi = document.createElement('li');
  separatorLi.className = SEPARATOR_LI_CLASS;
  const separatorText = document.createElement('span');
  separatorText.className = SEPARATOR_TEXT_CLASS;
  separatorText.textContent = '自定义规则（目标元素编辑）：';
  separatorLi.appendChild(separatorText);

  const listLi = document.createElement('li');
  const listDiv = document.createElement('div');
  listDiv.className = LIST_DIV_CLASS;
  const rulesList = document.createElement('div');
  rulesList.id = RULES_LIST_ID;
  for (const rule of rules ?? []) {
    rulesList.appendChild(createRuleRow(rule));
  }
  const addBtn = createSpanBtn('添加规则', '新增一条自定义规则', () => {
    rulesList.appendChild(createRuleRow({}));
  });
  listDiv.appendChild(rulesList);
  listDiv.appendChild(addBtn);
  listLi.appendChild(listDiv);

  function collect() {
    const collected = [];
    let invalidCount = 0;
    for (const row of rulesList.getElementsByClassName(RULE_ROW_CLASS)) {
      const selector = row.querySelector('input[type="text"]').value.trim();
      const enabledBox = row.querySelector('input[type="checkbox"]');
      const selects = row.querySelectorAll('select');
      const scope = selects[0]?.value ?? 'global';
      const mode = selects[1]?.value ?? 'match';
      const [titleInput, userInput] = row.querySelectorAll(`.${RULE_MORE_CLASS} input`);
      const titleSelector = titleInput ? titleInput.value.trim() : '';
      const userSelector = userInput ? userInput.value.trim() : '';
      if (!isCompilableSelector(selector) || (mode === 'match' && !titleSelector && !userSelector)) {
        invalidCount++;
        continue;
      }
      collected.push({
        id: row.dataset.ruleId,
        selector,
        scopes: [scope],
        mode,
        titleSelector,
        userSelector,
        enabled: enabledBox ? enabledBox.checked : true,
      });
    }
    return { rules: collected, invalidCount };
  }

  return { lis: [separatorLi, listLi], collect };
}
