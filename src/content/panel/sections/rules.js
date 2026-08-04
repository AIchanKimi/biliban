// 面板分节：规则组（归属某作用域标签页）。
// 组成：内置规则行（可编辑/可删除，保存后写回 builtinRules）→ 自定义规则行 → 添加按钮。
// 命中统计（rule-stats）让用户识别失效/无用规则：找到 N · 隐藏 M，有命中高亮。
// 规则模式：按屏蔽词过滤（match，默认）/ 直接隐藏（hide）。
// 选择器字段可扩展（v5.3）：标题 / UP主 / 时长，「更多」区按需追加新字段即可。
import {
  INPUT_CLASS,
  SELECT_CLASS,
  RULE_ROW_CLASS,
  RULE_BUILTIN_BADGE_CLASS,
  RULE_STATS_CLASS,
  RULE_MORE_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
} from '../../constants.js';
import { BUILTIN_RULES } from '../../rules/builtin-rules.js';
import { getRuleStats } from '../../engine/rule-stats.js';
import { createSpanBtn } from '../input-row.js';

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

/**
 * 规则行（内置与自定义同一套编辑器；内置行带「内置」标记）。
 * @param {{ id?: string, selector?: string, mode?: string, titleSelector?: string, userSelector?: string, durationSelector?: string, enabled?: boolean }} rule
 * @param {{ builtin?: boolean }} [options]
 * @returns {HTMLElement}
 */
export function createRuleRow(rule = {}, options = {}) {
  const row = document.createElement('div');
  row.className = RULE_ROW_CLASS;
  row.dataset.ruleId = rule.id || crypto.randomUUID();
  row.dataset.kind = options.builtin ? 'builtin' : 'custom';

  const enabledBox = document.createElement('input');
  enabledBox.type = 'checkbox';
  enabledBox.className = CHECKBOX_INPUT_CLASS;
  enabledBox.checked = rule.enabled !== false;
  const enabledLabel = document.createElement('label');
  enabledLabel.className = CHECKBOX_LABEL_CLASS;
  enabledLabel.title = '启用该规则';
  enabledLabel.textContent = '启用';

  if (options.builtin) {
    const badge = document.createElement('span');
    badge.className = RULE_BUILTIN_BADGE_CLASS;
    badge.textContent = '内置';
    badge.title = '扩展自带的规则；可直接改选择器或删除，保存后生效（删除所有内置规则即全部停用）';
    row.appendChild(badge);
  }

  const selectorInput = textInput(rule.selector ?? '', '卡片容器选择器', '目标卡片容器选择器，如 .bili-video-card');

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

  const moreBtn = createSpanBtn('更多', '展开标题/UP主/时长选择器', () => {
    const isHidden = moreDiv.classList.toggle('block_obj_li_hide');
    moreBtn.textContent = isHidden ? '更多' : '收起';
  });
  const delBtn = createSpanBtn('删除', '删除该规则', () => row.remove());

  // 「更多」区：可扩展的选择器字段（标题 / UP主 / 时长）
  const moreDiv = document.createElement('div');
  moreDiv.className = RULE_MORE_CLASS;
  const titleInput = textInput(rule.titleSelector ?? '', '标题选择器（可选）', '卡片内标题元素选择器；过滤模式至少填写标题或 UP主选择器之一');
  const userInput = textInput(rule.userSelector ?? '', 'UP主选择器（可选）', '卡片内 UP主元素选择器');
  const durationInput = textInput(rule.durationSelector ?? '', '时长选择器（可选）', '卡片内时长文本元素选择器，如 .duration；留空则自动探测');
  moreDiv.appendChild(titleInput);
  moreDiv.appendChild(userInput);
  moreDiv.appendChild(durationInput);
  const hasMore = Boolean(rule.titleSelector || rule.userSelector || rule.durationSelector);
  if (rule.mode === 'hide' || !hasMore) {
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
  row.appendChild(createStatsBadge(row.dataset.ruleId));
  row.appendChild(moreDiv);
  return row;
}

/**
 * 某作用域下的规则组。
 * 内置规则来源：用户持久化的 builtinRules（若存在），否则代码默认 BUILTIN_RULES；
 * 多作用域内置规则在每个所属标签页各渲染一行，收集时按当前标签页写单作用域。
 * @param {{ scope: string, rules: ReadonlyArray<Record<string, unknown>>, builtinRules: ReadonlyArray<Record<string, unknown>> | undefined }} params
 * @returns {{ container: HTMLElement, collect: () => { builtinRules: Array<Record<string, unknown>>, rules: Array<Record<string, unknown>>, invalidCount: number } }}
 */
export function createRulesGroup({ scope, rules, builtinRules }) {
  const container = document.createElement('div');

  const builtinSource = builtinRules ?? BUILTIN_RULES;
  for (const rule of builtinSource) {
    if (rule.scopes.includes(scope)) {
      container.appendChild(createRuleRow(rule, { builtin: true }));
    }
  }
  for (const rule of rules ?? []) {
    container.appendChild(createRuleRow(rule));
  }
  const addBtn = createSpanBtn('添加规则', '新增一条本页面分类下的自定义规则', () => {
    container.appendChild(createRuleRow({}));
  });
  container.appendChild(addBtn);

  /** 行 → 规则对象；非法返回 null */
  function collectRow(row) {
    const selector = row.querySelector('input[type="text"]').value.trim();
    const enabledBox = row.querySelector('input[type="checkbox"]');
    const modeSel = row.querySelector('select');
    const mode = modeSel?.value ?? 'match';
    const [titleInput, userInput, durationInput] = row.querySelectorAll(`.${RULE_MORE_CLASS} input`);
    const titleSelector = titleInput ? titleInput.value.trim() : '';
    const userSelector = userInput ? userInput.value.trim() : '';
    const durationSelector = durationInput ? durationInput.value.trim() : '';
    if (!isCompilableSelector(selector) || (mode === 'match' && !titleSelector && !userSelector)) {
      return null;
    }
    return {
      id: row.dataset.ruleId,
      selector,
      scopes: [scope],
      mode,
      titleSelector,
      userSelector,
      durationSelector,
      enabled: enabledBox ? enabledBox.checked : true,
    };
  }

  function collect() {
    const builtinCollected = [];
    const customCollected = [];
    let invalidCount = 0;
    for (const row of container.getElementsByClassName(RULE_ROW_CLASS)) {
      const collected = collectRow(row);
      if (!collected) {
        invalidCount++;
        continue;
      }
      if (row.dataset.kind === 'builtin') {
        builtinCollected.push(collected);
      } else {
        customCollected.push(collected);
      }
    }
    return { builtinRules: builtinCollected, rules: customCollected, invalidCount };
  }

  return { container, collect };
}
