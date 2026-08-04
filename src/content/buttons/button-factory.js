// 评论区注入按钮工厂。对等 Block_Obj createBlockBtn / createBigBangBtn：
//   - 屏蔽按钮：点击 → stopPropagation → 值不在列表则前置 chip → 立即保存（无需打开面板）
//   - 爆炸按钮：点击 → 打开大爆炸弹窗
import { FIELD_ID_PREFIX } from '../constants.js';
import { prependUnique } from '../panel/chips.js';
import { openBigBang } from '../panel/big-bang.js';

function createBasicBtn(type, text, title, classname) {
  let btnType = 'span';
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'div':
      case 'd':
        btnType = 'div';
        break;
      case 'a':
        btnType = 'a';
        break;
      case 'button':
        btnType = 'button';
        break;
      case 'input':
        btnType = 'input';
        break;
      case 'i':
        btnType = 'i';
        break;
      case 'b':
        btnType = 'b';
        break;
      case 'span':
      case 's':
      default:
        btnType = 'span';
        break;
    }
  }
  const btn = document.createElement(btnType);
  btn.textContent = text ? text : '';
  btn.title = title ? title : '';
  btn.className = classname ? classname : '';
  return btn;
}

/**
 * @param {{ saveFromDom: () => Promise<void> }} deps
 */
export function createButtonFactory(deps) {
  const { saveFromDom } = deps;

  function createBlockBtn(value, listId, classname, type = 'span', text = '', title = '') {
    const blockBtn = createBasicBtn(type, text, title, classname);
    blockBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (value && listId) {
        const listEl = document.getElementById(FIELD_ID_PREFIX + listId);
        if (listEl) {
          prependUnique(listEl, [value]);
        }
      }
      saveFromDom();
    });
    return blockBtn;
  }

  function createBigBangBtn(value, listId, classname, type = 'span', text = '', title = '') {
    const bigBangBtn = createBasicBtn(type, text, title, classname);
    bigBangBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (value && listId) {
        openBigBang({ value, listElId: FIELD_ID_PREFIX + listId, saveNow: saveFromDom });
      }
    });
    return bigBangBtn;
  }

  return { createBlockBtn, createBigBangBtn };
}
