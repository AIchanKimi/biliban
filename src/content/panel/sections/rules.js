// 面板分节：自定义规则组（归属于某个作用域标签页，规则本身不再选作用域）。
// B 站改版后可在此直接改选择器，无需修改扩展代码。
// 模式两档（原「按词条匹配/直接隐藏」改名）：
//   按屏蔽词过滤 —— 选择器定位的卡片按本页面词条过滤（默认）
//   直接隐藏     —— 命中选择器即隐藏，不检查词条
// 收集时校验：选择器必须可编译；过滤模式必须至少提供标题或 UP主选择器之一。
import {
  INPUT_CLASS,
  SELECT_CLASS,
  RULE_ROW_CLASS,
  RULE_MORE_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
} from '../../constants.js';
import { createSpanBtn } from '../input-row.js';

/** 模式下拉选项：value → 显示文案 */
export const MODE_LABELS = Object.freeze([
  Object.freeze({ value: 'match', label: '按屏蔽词过滤' }),
  Object.freeze({ value: 'hide', label: '直接隐藏' }),
]);

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
 * @param {{ id?: string, selector?: string, mode?: string, titleSelector?: string, userSelector?: string, enabled?: boolean }} rule
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

  const selectorInput = textInput(rule.selector ?? '', '卡片容器选择器', '目标卡片容器选择器，如 .bili-video-card');

  const modeSel = document.createElement('select');
  modeSel.className = SELECT_CLASS;
  for (const { value, label } of MODE_LABELS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = rule.mode === value;
    if (value === 'match') {
      option.title = '选择器定位的卡片按本页面用户名/关键字词条过滤';
    } else {
      option.title = '命中选择器的元素直接隐藏，不检查词条';
    }
    modeSel.appendChild(option);
  }

  const moreBtn = createSpanBtn('更多', '展开标题/UP主选择器', () => {
    const isHidden = moreDiv.classList.toggle('block_obj_li_hide');
    moreBtn.textContent = isHidden ? '更多' : '收起';
  });
  const delBtn = createSpanBtn('删除', '删除该规则', () => row.remove());

  const moreDiv = document.createElement('div');
  moreDiv.className = RULE_MORE_CLASS;
  const titleInput = textInput(rule.titleSelector ?? '', '标题选择器（可选）', '卡片内标题元素选择器；过滤模式至少填写标题或 UP主选择器之一');
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
  row.appendChild(modeSel);
  row.appendChild(moreBtn);
  row.appendChild(delBtn);
  row.appendChild(moreDiv);
  return row;
}

/**
 * 某作用域下的规则组。
 * @param {{ scope: string, rules: ReadonlyArray<Record<string, unknown>> }} params
 * @returns {{ container: HTMLElement, collect: () => { rules: Array<Record<string, unknown>>, invalidCount: number } }}
 */
export function createRulesGroup({ scope, rules }) {
  const container = document.createElement('div');
  for (const rule of rules ?? []) {
    container.appendChild(createRuleRow(rule));
  }
  const addBtn = createSpanBtn('添加规则', '新增一条本页面分类下的自定义规则', () => {
    container.appendChild(createRuleRow({}));
  });
  container.appendChild(addBtn);

  function collect() {
    const collected = [];
    let invalidCount = 0;
    for (const row of container.getElementsByClassName(RULE_ROW_CLASS)) {
      const selector = row.querySelector('input[type="text"]').value.trim();
      const enabledBox = row.querySelector('input[type="checkbox"]');
      const modeSel = row.querySelector('select');
      const mode = modeSel?.value ?? 'match';
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

  return { container, collect };
}
