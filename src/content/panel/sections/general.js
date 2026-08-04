// 面板分节：通用（仅总开关）。v6.6：改为页脚 toggle（状态变底色），不再占据面板顶部。
import { FIELD_ID_PREFIX, SWITCH_INPUT_CLASS, SWITCH_LABEL_CLASS } from '../../constants.js';

const ENABLE_ID = FIELD_ID_PREFIX + 'enable';

/**
 * @param {Readonly<{ enable: boolean }>} config
 * @returns {{ el: HTMLElement, collect: () => { enable: boolean } }}
 */
export function createGeneralSection(config) {
  const wrap = document.createElement('span');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = ENABLE_ID;
  input.className = SWITCH_INPUT_CLASS;
  input.checked = config.enable !== false;
  const labelEl = document.createElement('label');
  labelEl.htmlFor = ENABLE_ID;
  labelEl.className = SWITCH_LABEL_CLASS;
  labelEl.title = '总开关';
  labelEl.textContent = '启用屏蔽';
  wrap.appendChild(input);
  wrap.appendChild(labelEl);

  function collect() {
    return { enable: document.getElementById(ENABLE_ID)?.checked ?? true };
  }

  return { el: wrap, collect };
}
