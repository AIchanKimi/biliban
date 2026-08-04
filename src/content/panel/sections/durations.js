// 面板分节：时长按蔽词条组（v5.2 词条化，替代原全局开关）。
// 每条词条 = 比较方向（短于/长于）+ 阈值（分钟），作用域随所在标签页；支持「临时」。
import {
  FIELD_ID_PREFIX,
  INPUT_DIV_CLASS,
  INPUT_SPAN_CLASS,
  SELECT_CLASS,
  NUMBER_INPUT_CLASS,
  SEPARATOR_LI_CLASS,
  SEPARATOR_TEXT_CLASS,
  LIST_DIV_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  CHIP_CLASS,
} from '../../constants.js';
import { createChip } from '../chips.js';
import { buttonClicked, createSpanBtn } from '../input-row.js';
import { formatDuration } from '../../engine/duration.js';

/** 词条 → chip 显示文案（<60s 显示秒；整分钟显示分钟；其余显示秒） */
export function durationLabel(entry) {
  const s = entry.seconds;
  const text = s < 60 || s % 60 !== 0 ? `${s} 秒` : `${s / 60} 分钟`;
  return (entry.op === 'lt' ? '短于 ' : '长于 ') + text;
}

function separatorLi(label, title) {
  const li = document.createElement('li');
  li.className = SEPARATOR_LI_CLASS;
  const text = document.createElement('span');
  text.className = SEPARATOR_TEXT_CLASS;
  text.textContent = label;
  text.title = title;
  li.appendChild(text);
  return li;
}

/** chip 根节点 → 时长词条（读 dataset，不依赖文本真值） */
function chipToDuration(chip) {
  const op = chip.dataset.op;
  const seconds = Number(chip.dataset.seconds);
  if ((op !== 'lt' && op !== 'gt') || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const scopes = typeof chip.dataset.scopes === 'string' && chip.dataset.scopes !== ''
    ? chip.dataset.scopes.split(',')
    : ['global'];
  const entry = { op, seconds, scopes, temp: chip.dataset.temp === '1' };
  const expiresAt = Number(chip.dataset.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    entry.expiresAt = expiresAt;
  }
  return entry;
}

/**
 * @param {HTMLElement} listEl
 * @returns {{ persistent: Array<{ op: string, seconds: number, scopes: string[] }>, temp: Array<{ op: string, seconds: number, scopes: string[] }> }}
 */
export function extractDurationsFromEl(listEl) {
  const persistent = [];
  const temp = [];
  for (const chip of [...listEl.getElementsByClassName(CHIP_CLASS)].reverse()) {
    const entry = chipToDuration(chip);
    if (!entry) {
      continue;
    }
    const scoped = { op: entry.op, seconds: entry.seconds, scopes: entry.scopes };
    if (entry.temp) {
      if (entry.expiresAt) {
        scoped.expiresAt = entry.expiresAt; // 续存原有到期时间
      }
      temp.push(scoped);
    } else {
      persistent.push(scoped);
    }
  }
  return { persistent, temp };
}

/**
 * @param {{
 *   scope: string,
 *   entries: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 *   tempEntries: ReadonlyArray<{ op: string, seconds: number, scopes: string[] }>,
 * }} params
 * @returns {{ lis: HTMLElement[], collect: () => { persistent: Array<object>, temp: Array<object> } }}
 */
export function createDurationsGroup(params) {
  const { scope, entries, tempEntries } = params;
  const opId = `${FIELD_ID_PREFIX}durationOp_${scope}`;
  const secondsId = `${FIELD_ID_PREFIX}durationSeconds_${scope}`;
  const previewId = `${FIELD_ID_PREFIX}durationPreview_${scope}`;
  const tempId = `${FIELD_ID_PREFIX}durationTemp_${scope}`;
  const listId = `${FIELD_ID_PREFIX}durations_${scope}`;

  const inputLi = document.createElement('li');
  const inputDiv = document.createElement('div');
  inputDiv.className = INPUT_DIV_CLASS;
  const inputSpan = document.createElement('span');
  inputSpan.className = INPUT_SPAN_CLASS;
  inputSpan.textContent = '时长：';

  const opSelect = document.createElement('select');
  opSelect.id = opId;
  opSelect.className = SELECT_CLASS;
  opSelect.title = '比较方向';
  for (const [value, label] of [['lt', '短于'], ['gt', '长于']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    opSelect.appendChild(option);
  }

  const secondsInput = document.createElement('input');
  secondsInput.type = 'number';
  secondsInput.id = secondsId;
  secondsInput.className = NUMBER_INPUT_CLASS;
  secondsInput.min = '1';
  secondsInput.step = '1';
  secondsInput.placeholder = '秒';
  secondsInput.title = '阈值（秒），如 15 表示 15 秒';
  // 右侧实时预览为 B 站时长格式（22:24 / 01:17:44）
  const previewSpan = document.createElement('span');
  previewSpan.id = previewId;
  previewSpan.className = 'block_obj_duration_preview';
  previewSpan.textContent = '—';
  const refreshPreview = () => {
    const seconds = Math.round(Number.parseFloat(secondsInput.value));
    previewSpan.textContent = Number.isFinite(seconds) && seconds > 0 ? formatDuration(seconds) : '—';
  };
  secondsInput.addEventListener('input', refreshPreview);

  const tempCheckbox = document.createElement('input');
  tempCheckbox.type = 'checkbox';
  tempCheckbox.id = tempId;
  tempCheckbox.title = '临时词条：独立存储、跨标签页同步，到期后自动清除';
  const tempLabel = document.createElement('label');
  tempLabel.htmlFor = tempId;
  tempLabel.textContent = '临时';
  tempLabel.title = tempCheckbox.title;
  const tempHoursSelect = document.createElement('select');
  tempHoursSelect.className = SELECT_CLASS;
  tempHoursSelect.title = '临时词条有效期';
  for (const [hours, label] of [[1, '1小时'], [6, '6小时'], [24, '24小时'], [168, '7天']]) {
    const option = document.createElement('option');
    option.value = String(hours);
    option.textContent = label;
    option.selected = hours === 24;
    tempHoursSelect.appendChild(option);
  }

  const listEl = document.createElement('div');
  listEl.id = listId;
  listEl.className = LIST_TEXTAREA_DIV_CLASS;

  const seedOne = entry => {
    const dataset = { op: entry.op, seconds: String(entry.seconds) };
    if (entry.expiresAt) {
      dataset.expiresAt = String(entry.expiresAt);
    }
    listEl.insertAdjacentElement('afterbegin', createChip({
      value: `${entry.op}:${entry.seconds}`,
      label: durationLabel(entry),
      scopes: entry.scopes,
      temp: Boolean(entry.temp),
      dataset,
    }));
  };
  for (const entry of entries ?? []) {
    seedOne(entry);
  }
  for (const entry of tempEntries ?? []) {
    seedOne({ ...entry, temp: true });
  }

  const addEntry = () => {
    const seconds = Math.round(Number.parseFloat(secondsInput.value));
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return false;
    }
    const candidate = { op: opSelect.value, seconds, scopes: [scope] };
    const { persistent, temp } = extractDurationsFromEl(listEl);
    const dup = [...persistent, ...temp].some(e => e.op === candidate.op && e.seconds === candidate.seconds);
    if (dup) {
      return false;
    }
    const dataset = { op: candidate.op, seconds: String(candidate.seconds) };
    if (tempCheckbox.checked) {
      dataset.expiresAt = String(Date.now() + Number(tempHoursSelect.value) * 3600_000);
    }
    listEl.insertAdjacentElement('afterbegin', createChip({
      value: `${candidate.op}:${candidate.seconds}`,
      label: durationLabel(candidate),
      scopes: candidate.scopes,
      temp: tempCheckbox.checked,
      dataset,
    }));
    secondsInput.value = '';
    refreshPreview();
    return true;
  };

  const addBtn = createSpanBtn('添加', '添加时长词条', () => {
    if (addEntry()) {
      buttonClicked(addBtn, '添加成功');
    }
  });
  const deleteBtn = createSpanBtn('删除', '删除与输入相同时长的词条', () => {
    const seconds = Math.round(Number.parseFloat(secondsInput.value));
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return;
    }
    let removed = false;
    for (const chip of [...listEl.getElementsByClassName(CHIP_CLASS)]) {
      if (Number(chip.dataset.seconds) === seconds) {
        chip.remove();
        removed = true;
      }
    }
    if (removed) {
      secondsInput.value = '';
      refreshPreview();
      buttonClicked(deleteBtn, '删除成功');
    }
  });
  const clearBtn = createSpanBtn('清空', '清空列表', () => {
    listEl.innerHTML = '';
    buttonClicked(clearBtn, '清除成功');
  });

  inputDiv.appendChild(inputSpan);
  inputDiv.appendChild(opSelect);
  inputDiv.appendChild(secondsInput);
  inputDiv.appendChild(previewSpan);
  inputDiv.appendChild(tempCheckbox);
  inputDiv.appendChild(tempLabel);
  inputDiv.appendChild(tempHoursSelect);
  inputDiv.appendChild(addBtn);
  inputDiv.appendChild(deleteBtn);
  inputDiv.appendChild(clearBtn);
  inputLi.appendChild(inputDiv);

  const listLi = document.createElement('li');
  const listDiv = document.createElement('div');
  listDiv.className = LIST_DIV_CLASS;
  listDiv.appendChild(listEl);
  listLi.appendChild(listDiv);

  function collect() {
    return extractDurationsFromEl(listEl);
  }

  return {
    lis: [separatorLi('时长按蔽（卡片需带时长文本）：', '卡片内出现 1:23 / 1:02:03 形式的时长且满足任一词条时屏蔽'), inputLi, listLi],
    collect,
  };
}
