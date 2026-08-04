// 面板分节：规则组（归属某作用域标签页）。
// v6.1：内置与自定义规则完全同构——同一列表、同一编辑器，无「内置」区分。
// v6.3：规则区整体默认折叠（头部「规则」开关展开）；行亦默认收起
// （概览 + 统计徽标 + 编辑/删除），点「编辑」展开编辑区，避免整屏输入框。
// 规则模型：卡片容器选择器 + 文字选择器数组（可多个）+ 时长选择器（可选）。
// 模式：按屏蔽词过滤（match，默认）/ 直接隐藏（hide）。
import {
  FIELD_ID_PREFIX,
  INPUT_CLASS,
  SELECT_CLASS,
  LI_HIDE_CLASS,
  RULE_ROW_CLASS,
  RULE_EDIT_CLASS,
  RULE_STATS_CLASS,
  RULES_HEADER_CLASS,
  RULES_TOGGLE_CLASS,
  RULES_BODY_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
} from '../../constants.js';
import { getRuleStats } from '../../engine/rule-stats.js';
import { createSpanBtn } from '../input-row.js';

/** 折叠开关箭头字符 */
const CHEVRON_COLLAPSED = '▸';
const CHEVRON_EXPANDED = '▾';

/** 模式下拉选项：value → 显示文案 */
export const MODE_LABELS = Object.freeze([
  Object.freeze({ value: 'match', label: '按屏蔽词过滤' }),
  Object.freeze({ value: 'hide', label: '直接隐藏' }),
]);

function modeLabel(mode) {
  return MODE_LABELS.find(item => item.value === mode)?.label ?? mode;
}

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

/** 命中统计徽标（面板定时器按 data-rule-id 刷新） */
function createStatsBadge(ruleId) {
  const badge = document.createElement('span');
  badge.className = RULE_STATS_CLASS;
  badge.dataset.ruleId = ruleId;
  const stats = getRuleStats()[ruleId];
  badge.textContent = stats ? `找到 ${stats.found} · 隐藏 ${stats.hidden}` : '未命中';
  return badge;
}

/** 文字选择器编辑行：输入框 + 移除按钮 */
function createTextSelectorRow(container, value = '') {
  const rowEl = document.createElement('div');
  rowEl.className = 'block_obj_rule_textsel_row';
  const input = textInput(value, '文字选择器，如 .title', '提取该元素文本交给屏蔽词匹配');
  input.classList.add('block_obj_rule_textsel');
  const removeBtn = createSpanBtn('✕', '移除该文字选择器', () => {
    rowEl.remove();
    if (container.querySelectorAll('.block_obj_rule_textsel_row').length === 0) {
      container.appendChild(createTextSelectorRow(container));
    }
  });
  rowEl.appendChild(input);
  rowEl.appendChild(removeBtn);
  return rowEl;
}

/**
 * 规则行（v6.1：内置与自定义完全同构，无差别编辑器）。默认收起。
 * @param {{ id?: string, selector?: string, mode?: string, textSelectors?: string[], durationSelector?: string, enabled?: boolean }} rule
 * @returns {HTMLElement}
 */
export function createRuleRow(rule = {}) {
  const row = document.createElement('div');
  row.className = RULE_ROW_CLASS;
  row.dataset.ruleId = rule.id || crypto.randomUUID();

  // ---- 概览行（常显）----
  const enabledBox = document.createElement('input');
  enabledBox.type = 'checkbox';
  // 裁剪隐藏的 checkbox 必须经 label[for] 点击，id 用 ruleId 保证唯一
  enabledBox.id = 'bilibiliConfig_ruleEnable_' + row.dataset.ruleId;
  enabledBox.className = CHECKBOX_INPUT_CLASS;
  enabledBox.checked = rule.enabled !== false;
  const enabledLabel = document.createElement('label');
  enabledLabel.htmlFor = enabledBox.id;
  enabledLabel.className = CHECKBOX_LABEL_CLASS;
  enabledLabel.title = '启用该规则';
  enabledLabel.textContent = '启用';

  const summarySpan = document.createElement('span');
  summarySpan.className = 'block_obj_rule_summary';
  summarySpan.title = String(rule.selector ?? '');

  const editBtn = createSpanBtn('编辑', '展开编辑该规则', () => {
    const willShow = editDiv.classList.toggle('block_obj_li_hide') === false;
    editBtn.textContent = willShow ? '收起' : '编辑';
    if (!willShow) {
      syncSummary(); // 收起时把编辑结果同步回概览
    }
  });
  const delBtn = createSpanBtn('删除', '删除该规则', () => row.remove());

  row.appendChild(enabledBox);
  row.appendChild(enabledLabel);
  row.appendChild(summarySpan);
  row.appendChild(editBtn);
  row.appendChild(delBtn);
  row.appendChild(createStatsBadge(row.dataset.ruleId));

  // ---- 编辑区（默认收起）----
  const editDiv = document.createElement('div');
  editDiv.className = RULE_EDIT_CLASS + ' block_obj_li_hide';

  const selectorInput = textInput(rule.selector ?? '', '卡片容器选择器', '目标卡片容器选择器，如 .bili-video-card');
  selectorInput.classList.add('block_obj_rule_selector_input');

  const modeSel = document.createElement('select');
  modeSel.className = SELECT_CLASS;
  for (const { value, label } of MODE_LABELS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = rule.mode === value;
    if (value === 'match') {
      option.title = '选择器定位的卡片按本页面屏蔽词/时长过滤';
    } else {
      option.title = '命中选择器的元素直接隐藏，不检查词条';
    }
    modeSel.appendChild(option);
  }

  // 文字选择器（可多个）
  const textSelWrap = document.createElement('div');
  textSelWrap.className = 'block_obj_rule_textsel_wrap';
  const addTextBtn = createSpanBtn('＋文字', '新增一个文字选择器', () => {
    textSelWrap.insertBefore(createTextSelectorRow(textSelWrap), addTextBtn);
  });
  const initialSelectors = (rule.textSelectors ?? []).filter(item => item);
  for (const value of initialSelectors.length > 0 ? initialSelectors : ['']) {
    textSelWrap.appendChild(createTextSelectorRow(textSelWrap, value));
  }
  textSelWrap.appendChild(addTextBtn);

  const durationInput = textInput(rule.durationSelector ?? '', '时长选择器（可选）', '卡片内时长文本元素选择器，如 .duration；留空则自动探测');
  durationInput.classList.add('block_obj_rule_duration_input');

  editDiv.appendChild(selectorInput);
  editDiv.appendChild(modeSel);
  editDiv.appendChild(textSelWrap);
  editDiv.appendChild(durationInput);
  row.appendChild(editDiv);

  function syncSummary() {
    const selectorText = selectorInput.value.trim() || '（未填写选择器）';
    const modeText = modeLabel(modeSel.value);
    summarySpan.textContent = selectorText;
    summarySpan.title = selectorText + ' · ' + modeText;
  }
  syncSummary();

  return row;
}

/**
 * 某作用域下的规则组（内置与自定义同一列表渲染）。
 * v6.3：整组默认折叠——头部「规则」开关切换主体显隐；「添加规则」常驻头部，点击先展开再追加。
 * @param {{ scope: string, rules: ReadonlyArray<Record<string, unknown>> }} params
 * @returns {{ container: HTMLElement, collect: () => { rules: Array<Record<string, unknown>> } }}
 */
export function createRulesGroup({ scope, rules }) {
  const container = document.createElement('div');

  // ---- 头部：折叠开关 + 添加规则 ----
  const header = document.createElement('div');
  header.className = RULES_HEADER_CLASS;
  const toggle = document.createElement('span');
  toggle.className = RULES_TOGGLE_CLASS;
  toggle.id = FIELD_ID_PREFIX + 'rulesToggle_' + scope;
  toggle.title = '规则教扩展认识本页面的卡片容器；B 站改版后在此改选择器，无需修改扩展代码';
  const chevron = document.createElement('span');
  chevron.className = 'block_obj_rules_chevron';
  chevron.textContent = CHEVRON_COLLAPSED;
  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = '规则';
  toggle.appendChild(chevron);
  toggle.appendChild(toggleLabel);

  // ---- 主体：规则行列表（默认折叠）----
  const body = document.createElement('div');
  body.className = RULES_BODY_CLASS + ' ' + LI_HIDE_CLASS;
  const setExpanded = expanded => {
    body.classList.toggle(LI_HIDE_CLASS, !expanded);
    chevron.textContent = expanded ? CHEVRON_EXPANDED : CHEVRON_COLLAPSED;
  };
  toggle.addEventListener('click', () => setExpanded(body.classList.contains(LI_HIDE_CLASS)));

  for (const rule of rules ?? []) {
    if (rule.scopes.includes(scope)) {
      body.appendChild(createRuleRow(rule));
    }
  }
  const addBtn = createSpanBtn('添加规则', '新增一条本页面分类下的规则', () => {
    setExpanded(true);
    body.appendChild(createRuleRow({}));
  });
  addBtn.classList.add('block_obj_rule_add_btn');

  header.appendChild(toggle);
  header.appendChild(addBtn);
  container.appendChild(header);
  container.appendChild(body);

  /** 行 → 规则对象；选择器为空视为放弃该行 */
  function collectRow(rowEl) {
    const selector = rowEl.querySelector('.block_obj_rule_selector_input').value.trim();
    if (selector === '') {
      return null;
    }
    if (!isCompilableSelector(selector)) {
      console.warn('[bilibili_block] 规则选择器无法编译，仍会保存（引擎将跳过）:', selector);
    }
    const enabledBox = rowEl.querySelector('input[type="checkbox"]');
    const mode = rowEl.querySelector('select')?.value ?? 'match';
    const textSelectors = [...rowEl.querySelectorAll('.block_obj_rule_textsel')]
      .map(input => input.value.trim())
      .filter(value => value !== '');
    const durationSelector = rowEl.querySelector('.block_obj_rule_duration_input').value.trim();
    return {
      id: rowEl.dataset.ruleId,
      selector,
      scopes: [scope],
      mode,
      textSelectors,
      durationSelector,
      enabled: enabledBox ? enabledBox.checked : true,
    };
  }

  function collect() {
    const collected = [];
    for (const rowEl of container.getElementsByClassName(RULE_ROW_CLASS)) {
      const rule = collectRow(rowEl);
      if (rule) {
        collected.push(rule);
      }
    }
    return { rules: collected };
  }

  return { container, collect };
}
