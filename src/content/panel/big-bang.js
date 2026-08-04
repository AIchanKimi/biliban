// 「大爆炸」弹窗。对等 Block_Obj injectionBigBangPanel / getSelectedText：
//   全屏遮罩（点背景关闭）→ 模态框 → 每个字符一个药丸（data-index 为原始位置）
//   连续选中的字符连成一段，断点处以半角逗号分段 → 添加（去重前置 + 立即保存）/ 复制
import {
  BLOCK_OBJ_ID,
  BIG_BANG_OVERLAY_CLASS,
  BIG_BANG_DIALOG_CLASS,
  BIG_BANG_TOP_CLASS,
  BIG_BANG_H3_CLASS,
  BIG_BANG_DESELECT_CLASS,
  BIG_BANG_MIDDLE_CLASS,
  BIG_BANG_TEXT_CLASS,
  BIG_BANG_SELECTED_CLASS,
  BIG_BANG_BOTTOM_CLASS,
  BIG_BANG_ADD_CLASS,
  BIG_BANG_COPY_CLASS,
} from '../constants.js';
import { BIG_BANG_TITLE } from './panel-text.js';
import { splitToChars, joinSelected } from '../util/segments.js';
import { stringToArray } from '../util/string-to-array.js';
import { extractListFromEl, prependUnique } from './chips.js';
import { copyToClipboard } from './input-row.js';

function createSpanBtn(classname, label, title, callback) {
  const btn = document.createElement('span');
  btn.textContent = label;
  btn.title = title;
  btn.className = classname;
  btn.addEventListener('click', e => callback(e));
  return btn;
}

/**
 * @param {{
 *   value: string,                 // 待拆分文本
 *   listElId: string,              // 目标列表 DOM id（含前缀）
 *   saveNow: () => Promise<void>,  // 收集面板 DOM → 持久化 → 通知
 * }} params
 */
export function openBigBang({ value, listElId, saveNow }) {
  const presentationDiv = document.createElement('div');
  presentationDiv.id = BLOCK_OBJ_ID + '_presentationDiv';
  presentationDiv.className = BIG_BANG_OVERLAY_CLASS;
  presentationDiv.addEventListener('click', function (event) {
    if (event.target === this) {
      presentationDiv.remove();
    }
  });

  const dialogDiv = document.createElement('div');
  dialogDiv.className = BIG_BANG_DIALOG_CLASS;
  presentationDiv.appendChild(dialogDiv);

  const topPart = document.createElement('div');
  topPart.className = BIG_BANG_TOP_CLASS;
  const h3 = document.createElement('h3');
  h3.className = BIG_BANG_H3_CLASS;
  h3.textContent = BIG_BANG_TITLE;
  topPart.appendChild(h3);
  const deselectBtn = createSpanBtn(BIG_BANG_DESELECT_CLASS, '取消选择', '取消全部已选择的内容', e => {
    e.stopPropagation();
    const selectArr = document.querySelectorAll('.' + BIG_BANG_SELECTED_CLASS);
    for (const s of selectArr) {
      s.classList.remove(BIG_BANG_SELECTED_CLASS);
    }
  });
  topPart.appendChild(deselectBtn);

  const middlePart = document.createElement('div');
  middlePart.className = BIG_BANG_MIDDLE_CLASS;
  const chars = splitToChars(value);
  for (const { char, index } of chars) {
    const pill = document.createElement('span');
    pill.textContent = char;
    pill.title = '';
    pill.className = BIG_BANG_TEXT_CLASS;
    pill.setAttribute('data-index', index);
    pill.addEventListener('click', e => {
      e.stopPropagation();
      pill.classList.toggle(BIG_BANG_SELECTED_CLASS);
    });
    middlePart.appendChild(pill);
  }

  function getSelectedText() {
    const selected = [...document.getElementsByClassName(BIG_BANG_SELECTED_CLASS)].map(el => ({
      char: el.textContent,
      index: Number(el.getAttribute('data-index')),
    }));
    return joinSelected(selected);
  }

  const bottomPart = document.createElement('div');
  bottomPart.className = BIG_BANG_BOTTOM_CLASS;
  const addBtn = createSpanBtn(BIG_BANG_ADD_CLASS, '添加', '添加选择的内容到列表中', async e => {
    e.stopPropagation();
    const textValue = getSelectedText();
    if (textValue && listElId) {
      const textArr = stringToArray(textValue);
      const listEl = document.getElementById(listElId);
      const saveArr = extractListFromEl(listEl);
      prependUnique(listEl, textArr.filter(item => !saveArr.includes(item)));
      await saveNow();
      presentationDiv.remove();
    }
  });
  const copyBtn = createSpanBtn(BIG_BANG_COPY_CLASS, '复制', '复制选择的内容到剪贴板中', async e => {
    e.stopPropagation();
    const textValue = getSelectedText();
    if (textValue) {
      await copyToClipboard(textValue);
      presentationDiv.remove();
    }
  });
  bottomPart.appendChild(addBtn);
  bottomPart.appendChild(copyBtn);

  dialogDiv.appendChild(topPart);
  dialogDiv.appendChild(middlePart);
  dialogDiv.appendChild(bottomPart);
  document.body.appendChild(presentationDiv);
}
