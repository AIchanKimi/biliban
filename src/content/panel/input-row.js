// 面板共享控件工具（v5）：小按钮工厂、title 闪烁、列表展开、剪贴板。
// 输入行本体由 sections/entries.js 组装（作用域下拉 + 临时勾选）。
import {
  INPUT_BTN_CLASS,
  BUTTON_CLICKED_CLASS,
  LIST_EXPAND_CLASS,
  LI_HIDE_CLASS,
  LIST_TEXTAREA_DIV_CLASS,
  BUTTON_FLASH_MS,
} from "../constants.js";

let flashTimer = null;

/**
 * buttonClicked —— title 闪烁（保留 Block_Obj 语义）。
 * @param {HTMLElement} button
 * @param {string} flashTitle
 */
export function buttonClicked(button, flashTitle) {
  const originalTitle = button.title;
  button.title = flashTitle;
  button.classList.add(BUTTON_CLICKED_CLASS);
  if (flashTimer) {
    window.clearTimeout(flashTimer);
  }
  flashTimer = window.setTimeout(() => {
    button.title = originalTitle;
    button.classList.remove(BUTTON_CLICKED_CLASS);
    flashTimer = null;
  }, BUTTON_FLASH_MS);
}

/**
 * 小按钮工厂。
 * @param {string} label
 * @param {string} title
 * @param {(e: MouseEvent) => void} callback
 * @returns {HTMLElement}
 */
export function createSpanBtn(label, title, callback) {
  const btn = document.createElement("span");
  btn.textContent = label;
  btn.title = title;
  btn.className = INPUT_BTN_CLASS;
  btn.addEventListener("click", (e) => callback(e));
  return btn;
}

/**
 * toggleList —— 聚焦展开某个列表：目标 classname 的 li 列表容器切换 expand 类，
 * 其余 li 与全部 br 切换隐藏。
 * @param {HTMLElement} ulNode
 * @param {string} liClassname
 */
export function toggleList(ulNode, liClassname) {
  for (const li of ulNode.querySelectorAll("li")) {
    if (li.classList.contains(liClassname)) {
      const listTextareaDiv = li.querySelector("." + LIST_TEXTAREA_DIV_CLASS);
      if (listTextareaDiv) {
        listTextareaDiv.classList.toggle(LIST_EXPAND_CLASS);
      }
    } else {
      li.classList.toggle(LI_HIDE_CLASS);
    }
  }
  for (const br of ulNode.querySelectorAll("br")) {
    br.classList.toggle(LI_HIDE_CLASS);
  }
}

/**
 * 剪贴板写入（按钮点击 = 用户手势；execCommand 兜底）。
 * @param {string} text
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    } catch (fallbackError) {
      console.error("[bilibili_block] 复制到剪贴板失败:", fallbackError);
    }
  }
}
