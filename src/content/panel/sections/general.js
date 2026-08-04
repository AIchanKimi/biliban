// 面板分节：通用（仅总开关；时长按蔽已词条化，见 sections/durations.js）。
import {
  FIELD_ID_PREFIX,
  CHECKBOX_LI_CLASS,
  CHECKBOX_INPUT_CLASS,
  CHECKBOX_LABEL_CLASS,
} from '../../constants.js';

const ENABLE_ID = FIELD_ID_PREFIX + 'enable';

/**
 * @param {Readonly<{ enable: boolean }>} config
 * @returns {{ lis: HTMLElement[], collect: () => { enable: boolean } }}
 */
export function createGeneralSection(config) {
  const li = document.createElement('li');
  li.className = CHECKBOX_LI_CLASS;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = ENABLE_ID;
  input.className = CHECKBOX_INPUT_CLASS;
  input.checked = config.enable !== false;
  const labelEl = document.createElement('label');
  labelEl.htmlFor = ENABLE_ID;
  labelEl.className = CHECKBOX_LABEL_CLASS;
  labelEl.title = '总开关';
  labelEl.textContent = '启用屏蔽功能';
  li.appendChild(input);
  li.appendChild(labelEl);

  function collect() {
    return { enable: document.getElementById(ENABLE_ID)?.checked ?? true };
  }

  return { lis: [li], collect };
}
