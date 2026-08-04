// 右下角悬浮触发器。对等 Block_Obj init() 的 expandBox 部分：
// fixed 容器（高 6vh 宽 12vw，right -6vw 藏在屏外），mouseenter 滑入（宽 6vw），
// 内含白底带边框圆角矩形按钮「屏蔽」（v6.6 换肤，与面板同风格），点击切换设置面板。
import {
  BLOCK_OBJ_ID,
  EXPAND_BOX_CLASS,
  EXPAND_BOX_SHOW_CLASS,
  EXPAND_SPAN_CLASS,
} from "../constants.js";
import { TRIGGER_LABEL, TRIGGER_TITLE } from "./panel-text.js";

/**
 * @param {{ onToggle: () => void }} deps
 * @returns {HTMLElement} expandBox
 */
export function initTrigger(deps) {
  const { onToggle } = deps;
  const expandBox = document.createElement("div");
  expandBox.className = EXPAND_BOX_CLASS;
  expandBox.addEventListener("mouseenter", function () {
    this.classList.add(EXPAND_BOX_SHOW_CLASS);
  });
  expandBox.addEventListener("mouseleave", function () {
    this.classList.remove(EXPAND_BOX_SHOW_CLASS);
  });
  const expandSpan = document.createElement("span");
  expandSpan.id = BLOCK_OBJ_ID + "_expandSpan";
  expandSpan.className = EXPAND_SPAN_CLASS;
  expandSpan.textContent = TRIGGER_LABEL;
  expandSpan.title = TRIGGER_TITLE;
  expandSpan.addEventListener("click", () => {
    onToggle();
  });
  expandBox.appendChild(expandSpan);
  document.body.appendChild(expandBox);
  return expandBox;
}
