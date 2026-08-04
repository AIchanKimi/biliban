// 面板分节：通用（总开关 + 时长按蔽）。
import {
  FIELD_ID_PREFIX,
  CHECKBOX_LI_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
  NUMBER_INPUT_CLASS,
  MOVE_RIGHT_CLASS,
} from '../../constants.js';
import { DEFAULT_MIN_SECONDS } from '../../config/defaults.js';

const ENABLE_ID = FIELD_ID_PREFIX + 'enable';
const DURATION_ENABLE_ID = FIELD_ID_PREFIX + 'durationEnable';
const DURATION_MINUTES_ID = FIELD_ID_PREFIX + 'durationMinutes';

function checkboxLi(id, label, title, checked, moveRight = false) {
  const li = document.createElement('li');
  li.className = CHECKBOX_LI_CLASS + (moveRight ? ' ' + MOVE_RIGHT_CLASS : '');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.className = CHECKBOX_INPUT_CLASS;
  input.checked = checked;
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = CHECKBOX_LABEL_CLASS;
  labelEl.title = title;
  labelEl.textContent = label;
  li.appendChild(input);
  li.appendChild(labelEl);
  return li;
}

/**
 * @param {Readonly<{ enable: boolean, duration: { enable: boolean, minSeconds: number } }>} config
 * @returns {{ lis: HTMLElement[], collect: () => { enable: boolean, duration: { enable: boolean, minSeconds: number } } }}
 */
export function createGeneralSection(config) {
  const enableLi = checkboxLi(ENABLE_ID, '启用屏蔽功能', '总开关', config.enable !== false);

  const durationLi = checkboxLi(
    DURATION_ENABLE_ID,
    '按时长屏蔽',
    '屏蔽时长短于阈值的视频（卡片内未找到时长文本时不处理）',
    config.duration.enable,
    true
  );
  const minutesInput = document.createElement('input');
  minutesInput.type = 'number';
  minutesInput.id = DURATION_MINUTES_ID;
  minutesInput.className = NUMBER_INPUT_CLASS;
  minutesInput.min = '0.5';
  minutesInput.step = '0.5';
  minutesInput.value = String(config.duration.minSeconds / 60);
  minutesInput.title = '阈值（分钟）：短于该时长的视频将被屏蔽';
  durationLi.appendChild(minutesInput);
  const unitSpan = document.createElement('span');
  unitSpan.textContent = ' 分钟';
  durationLi.appendChild(unitSpan);

  function collect() {
    const minutes = Number.parseFloat(minutesInput.value);
    const minSeconds = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : DEFAULT_MIN_SECONDS;
    return {
      enable: document.getElementById(ENABLE_ID)?.checked ?? true,
      duration: {
        enable: document.getElementById(DURATION_ENABLE_ID)?.checked ?? false,
        minSeconds,
      },
    };
  }

  return { lis: [enableLi, durationLi], collect };
}
