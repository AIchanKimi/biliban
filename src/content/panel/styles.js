// 样式（v6.3：shadcn 风格白底重绘）：
//   LIB_STYLE   —— 面板/触发器/chip 基础样式（选择器与类名保持 v5 兼容，仅视觉重绘）
//   BASIC_STYLE —— 全屏播放器 z-index 覆盖
// 设计令牌参考 shadcn/ui zinc 浅色主题：白底、#e4e4e7 边框、#18181b 主色、8px 圆角。

export const LIB_STYLE = `
  .block_obj_wrap_div {
    --bo-bg: #FFFFFF;
    --bo-bg-soft: #FAFAFA;
    --bo-bg-muted: #F4F4F5;
    --bo-border: #E4E4E7;
    --bo-border-strong: #D4D4D8;
    --bo-text: #18181B;
    --bo-text-secondary: #3F3F46;
    --bo-text-muted: #71717A;
    --bo-primary: #18181B;
    --bo-primary-hover: #27272A;
    --bo-accent: #16A34A;
    --bo-danger: #DC2626;

    background-color: var(--bo-bg);
    border: 1px solid var(--bo-border);
    border-radius: 12px;
    bottom: 6vh;
    box-shadow: 0 12px 40px rgba(9, 9, 11, 0.16), 0 2px 8px rgba(9, 9, 11, 0.06);
    color: var(--bo-text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    position: fixed;
    text-align: left;
    transition: right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    width: min(520px, calc(100vw - 24px));
    z-index: 99999;
  }
  .block_obj_wrap_div *,
  .block_obj_wrap_div *::before,
  .block_obj_wrap_div *::after {
    box-sizing: border-box;
  }
  .block_obj_show_wrap {
    display: block;
    right: 0;
  }
  .block_obj_hidden_wrap {
    right: -530px;
  }
  .block_obj_main_fieldset {
    border: none;
    margin: 0;
    min-width: 300px;
    padding: 16px 18px;
  }
  .block_obj_ul_node {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }
  /* v6.5：统一原生 checkbox（accent-color 主色，勾形由浏览器绘制，不再用伪元素字符） */
  .block_obj_checkbox_input {
    accent-color: var(--bo-primary);
    cursor: pointer;
    height: 14px;
    margin: 0;
    vertical-align: -2px;
    width: 14px;
  }
  .block_obj_checkbox_label {
    color: var(--bo-text-secondary);
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
  }
  /* v6.6 总开关 toggle：状态切换轨道底色（off 灰 / on 黑） */
  .block_obj_switch_input {
    clip: rect(0, 0, 0, 0);
    position: absolute;
  }
  .block_obj_footer_switch {
    align-items: center;
    display: inline-flex;
  }
  .block_obj_switch {
    align-items: center;
    color: var(--bo-text-secondary);
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
    /* 与轨道同高，滑块 top:50% 即轨道中线（v6.7.1 居中修复） */
    height: 16px;
    position: relative;
    user-select: none;
  }
  .block_obj_switch::before {
    background-color: var(--bo-border-strong);
    border-radius: 999px;
    content: "";
    flex: none;
    height: 16px;
    transition: background-color 0.15s ease;
    width: 28px;
  }
  .block_obj_switch::after {
    background-color: #FFF;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(9, 9, 11, 0.2);
    content: "";
    height: 12px;
    left: 2px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: left 0.15s ease;
    width: 12px;
  }
  .block_obj_switch_input:checked + .block_obj_switch::before {
    background-color: var(--bo-primary);
  }
  .block_obj_switch_input:checked + .block_obj_switch::after {
    left: 14px;
  }
  .block_obj_switch_input:focus-visible + .block_obj_switch::before {
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.12);
  }
  .block_obj_separator_text {
    color: var(--bo-text-secondary);
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    margin-top: 10px;
  }
  /* v6.4 分节头：标题居左、列表操作居右 */
  .block_obj_section_header {
    align-items: center;
    display: flex;
    gap: 6px;
    justify-content: space-between;
    margin-top: 16px;
  }
  .block_obj_section_header .block_obj_separator_text {
    margin-top: 0;
  }
  .block_obj_section_actions {
    display: flex;
    gap: 2px;
  }
  .block_obj_section_actions .block_obj_input_btn {
    background-color: transparent;
    border-color: transparent;
    color: var(--bo-text-muted);
    padding: 1px 6px;
  }
  .block_obj_section_actions .block_obj_input_btn:hover {
    background-color: var(--bo-bg-muted);
    color: var(--bo-text);
  }
  .block_obj_input_div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .block_obj_input {
    background-color: var(--bo-bg);
    border: 1px solid var(--bo-border);
    border-radius: 6px;
    color: var(--bo-text);
    font-family: inherit;
    font-size: 13px;
    height: 30px;
    min-height: 30px;
    padding: 3px 8px;
  }
  .block_obj_input::placeholder {
    color: #A1A1AA;
  }
  .block_obj_input:focus {
    border-color: var(--bo-border-strong);
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.06);
    outline: none;
  }
  /* 输入行内弹性占满（v6.4） */
  .block_obj_input_div .block_obj_keyword_input {
    flex: 1 1 160px;
    min-width: 0;
    width: auto;
  }
  .block_obj_number_input {
    width: 70px;
  }
  .block_obj_select {
    background-color: var(--bo-bg);
    border: 1px solid var(--bo-border);
    border-radius: 6px;
    color: var(--bo-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    height: 30px;
    padding: 0 8px;
  }
  .block_obj_select:focus {
    border-color: var(--bo-border-strong);
    outline: none;
  }
  .block_obj_input_btn {
    background-color: var(--bo-bg-muted);
    border: 1px solid var(--bo-border);
    border-radius: 6px;
    color: var(--bo-text-secondary);
    cursor: pointer;
    align-items: center;
    display: inline-flex;
    font: inherit;
    height: 30px;
    justify-content: center;
    line-height: 1;
    padding: 0 10px;
    text-align: center;
    user-select: none;
    white-space: nowrap;
  }
  .block_obj_input_btn:hover {
    background-color: var(--bo-border);
    color: var(--bo-text);
  }
  .block_obj_button_clicked {
    color: var(--bo-accent);
  }
  .block_obj_list_div {
    margin-top: 6px;
  }
  .block_obj_list_textarea_div {
    background-color: var(--bo-bg-soft);
    border: 1px solid var(--bo-border);
    border-radius: 8px;
    margin-top: 3px;
    max-height: 96px;
    min-height: 3px;
    overflow: auto;
    padding: 2px;
  }
  /* 空列表不占位（v6.4） */
  .block_obj_list_textarea_div:empty {
    display: none;
  }
  .block_obj_list_textarea_div::-webkit-scrollbar,
  .block_obj_scope_pane::-webkit-scrollbar {
    width: 8px;
  }
  .block_obj_list_textarea_div::-webkit-scrollbar-thumb,
  .block_obj_scope_pane::-webkit-scrollbar-thumb {
    background-color: var(--bo-border-strong);
    border-radius: 8px;
  }
  .block_obj_list_textarea_div::-webkit-scrollbar-track,
  .block_obj_scope_pane::-webkit-scrollbar-track {
    background-color: transparent;
  }
  .block_obj_child_span {
    align-items: center;
    background-color: var(--bo-bg-muted);
    border: 1px solid var(--bo-border);
    border-radius: 5px;
    display: inline-flex;
    gap: 4px;
    line-height: 18px;
    margin: 3px;
    min-height: 24px;
    padding: 2px 3px 2px 8px;
    vertical-align: middle;
    max-width: calc(100% - 6px);
    white-space: nowrap;
  }
  .block_obj_child_text {
    color: var(--bo-text);
    cursor: text;
    font-size: 12px;
    line-height: 18px;
    min-width: 0;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .block_obj_child_filtered {
    display: none;
  }
  .block_obj_child_green {
    color: var(--bo-accent);
  }
  .block_obj_child_badge {
    background-color: var(--bo-primary);
    border-radius: 999px;
    color: #FFF;
    font-size: 11px;
    line-height: 16px;
    padding: 0 6px;
  }
  .block_obj_child_badge_temp {
    background-color: #FFF7ED;
    border: 1px solid #FED7AA;
    color: #C2410C;
  }
  .block_obj_wrap_div .block_obj_child_del {
    appearance: none;
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 4px;
    box-shadow: none;
    color: var(--bo-text-muted);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 18px;
    font: inherit;
    height: 18px;
    justify-content: center;
    line-height: 1;
    margin: 0;
    min-height: 0;
    min-width: 0;
    padding: 0;
    width: 18px;
  }
  .block_obj_wrap_div .block_obj_child_del svg {
    display: block;
    flex: none;
    height: 14px;
    pointer-events: none;
    width: 14px;
  }
  .block_obj_wrap_div .block_obj_child_del:hover {
    background-color: #FEE2E2;
    color: var(--bo-danger);
  }
  .block_obj_wrap_div .block_obj_child_del:focus-visible {
    outline: 2px solid var(--bo-border-strong);
    outline-offset: 2px;
  }
  .block_obj_list_textarea_expand {
    max-height: 720px;
  }
  /* 展开时只保留列表自身滚动：外层分类页固定，头部/输入行不滚走（v6.9） */
  .block_obj_scope_pane.block_obj_scope_pane_expanded {
    display: flex;
    flex-direction: column;
    height: min(52vh, calc(88vh - 190px));
    overflow: hidden;
  }
  .block_obj_scope_pane_expanded > .block_obj_ul_node {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  .block_obj_scope_pane_expanded .block_obj_li_list {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .block_obj_scope_pane_expanded .block_obj_li_list > .block_obj_list_div {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .block_obj_scope_pane_expanded .block_obj_list_textarea_expand {
    flex: 1;
    max-height: none;
    min-height: 0;
    overflow: auto;
  }
  .block_obj_li_hide {
    display: none;
  }
  .block_obj_tab_bar {
    border-bottom: 1px solid var(--bo-border);
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .block_obj_tab {
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--bo-text-muted);
    cursor: pointer;
    margin-bottom: -1px;
    padding: 6px 12px;
    user-select: none;
  }
  .block_obj_tab:hover {
    color: var(--bo-text);
  }
  .block_obj_tab_active {
    border-bottom-color: var(--bo-primary);
    color: var(--bo-text);
    font-weight: 600;
  }
  .block_obj_tab_current::after {
    background-color: var(--bo-accent);
    border-radius: 50%;
    content: "";
    display: inline-block;
    height: 6px;
    margin-left: 6px;
    vertical-align: 2px;
    width: 6px;
  }
  .block_obj_scope_pane {
    border: none;
    margin-top: 6px;
    max-height: min(52vh, calc(88vh - 190px));
    overflow-y: auto;
    padding: 2px 4px 2px 2px;
  }
  .block_obj_rules_header {
    align-items: center;
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .block_obj_rules_toggle {
    align-items: center;
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--bo-text-secondary);
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    gap: 6px;
    padding: 4px 8px;
    user-select: none;
  }
  .block_obj_rules_toggle:hover {
    background-color: var(--bo-bg-muted);
    color: var(--bo-text);
  }
  .block_obj_rules_chevron {
    color: var(--bo-text-muted);
    font-size: 10px;
  }
  .block_obj_rules_body {
    margin-top: 2px;
  }
  .block_obj_rule_add_btn {
    margin-left: auto;
  }
  .block_obj_rule_row {
    background-color: var(--bo-bg);
    border: 1px solid var(--bo-border);
    border-radius: 8px;
    margin-top: 6px;
    padding: 8px 10px;
  }
  .block_obj_rule_heading,
  .block_obj_rule_actions {
    align-items: center;
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  .block_obj_rule_heading > .block_obj_checkbox_input,
  .block_obj_rule_heading > .block_obj_checkbox_label,
  .block_obj_rule_heading > .block_obj_rule_stats { flex: none; }
  .block_obj_rule_actions { flex: none; margin-left: auto; }
  .block_obj_rule_summary {
    color: var(--bo-text);
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .block_obj_rule_edit {
    border-top: 1px solid var(--bo-border);
    display: grid;
    gap: 14px;
    margin-top: 10px;
    padding-top: 12px;
  }
  .block_obj_rule_edit.block_obj_li_hide { display: none; }
  .block_obj_rule_field { display: grid; gap: 6px; min-width: 0; }
  .block_obj_rule_field_label { color: var(--bo-text-secondary); font-size: 12px; font-weight: 500; }
  .block_obj_rule_field > input,
  .block_obj_rule_field > select { width: 100%; min-width: 0; }
  .block_obj_rule_selector_input,
  .block_obj_rule_textsel,
  .block_obj_rule_duration_input { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .block_obj_rule_textsel_wrap { display: grid; gap: 6px; min-width: 0; }
  .block_obj_rule_textsel_wrap > .block_obj_input_btn { justify-self: start; }
  .block_obj_rule_textsel_row { display: flex; gap: 6px; min-width: 0; }
  .block_obj_rule_textsel_row .block_obj_child_del { align-self: center; }
  .block_obj_rule_textsel { flex: 1; min-width: 0; width: 100%; }
  .block_obj_rule_stats { color: var(--bo-text-muted); font-size: 11px; white-space: nowrap; }
  .block_obj_rule_stats { background: var(--bo-bg-muted); border-radius: 4px; padding: 2px 6px; }
  .block_obj_rule_stats_hit { background: #F0FDF4; color: #15803D; }
  .block_obj_rule_actions .block_obj_input_btn { background: transparent; border-color: transparent; height: 26px; padding: 0 6px; }
  .block_obj_rule_actions .block_obj_input_btn:hover { background: var(--bo-bg-muted); }
  .block_obj_rule_actions .block_obj_rule_delete:hover { color: var(--bo-danger); background: #FEF2F2; }
  .block_obj_duration_preview {
    color: var(--bo-text-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
  }
  .block_obj_button {
    background-color: var(--bo-bg);
    border: 1px solid var(--bo-border);
    border-radius: 8px;
    color: var(--bo-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    margin-top: 12px;
    padding: 6px 14px;
    position: relative;
    min-height: 1em;
    user-select: none;
    white-space: nowrap;
  }
  .block_obj_button:hover {
    background-color: var(--bo-bg-muted);
  }
  .block_obj_save_button {
    background-color: var(--bo-primary);
    border-color: var(--bo-primary);
    color: #FFF;
  }
  .block_obj_save_button:hover {
    background-color: var(--bo-primary-hover);
  }
  /* v6.4 单行页脚：左工具组 / 右主操作组 */
  .block_obj_footer_row {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .block_obj_footer_secondary,
  .block_obj_footer_primary {
    align-items: center;
    display: flex;
    gap: 8px;
  }
  .block_obj_footer_row .block_obj_button {
    margin-top: 0;
    align-items: center;
    display: inline-flex;
    font: inherit;
    height: 32px;
    justify-content: center;
    padding: 0 10px;
  }
  .block_obj_tools_button {
    color: var(--bo-text-secondary);
  }

  .block_obj_wrap_div button { font-family: inherit; }
  .block_obj_wrap_div button:disabled { cursor: wait; opacity: 0.6; }
  .block_obj_wrap_div button:focus-visible { outline: 2px solid var(--bo-border-strong); outline-offset: 2px; }
  .block_obj_entry_hint { align-items: center; color: var(--bo-text-muted); display: flex; font-size: 11px; gap: 8px; justify-content: space-between; line-height: 1.5; margin-top: 6px; }
  .block_obj_entry_count { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .block_obj_field_hint { color: var(--bo-text-muted); font-size: 11px; line-height: 1.5; margin-top: 2px; }
  .block_obj_entry_empty { background: var(--bo-bg-soft); border: 1px dashed var(--bo-border); border-radius: 8px; color: var(--bo-text-muted); font-size: 12px; margin-top: 3px; padding: 14px 10px; text-align: center; }
  .block_obj_entry_empty[hidden], .block_obj_list_no_results { display: none; }
  .block_obj_section_actions .block_obj_clear_button { color: #A1A1AA; }
  .block_obj_section_actions .block_obj_clear_button:hover { background: #FEF2F2; color: var(--bo-danger); }
  .block_obj_section_actions .block_obj_undo_button { background: var(--bo-bg-muted); color: var(--bo-text); }
  .block_obj_scope_pane_expanded .block_obj_child_span { align-items: flex-start; }
  .block_obj_scope_pane_expanded .block_obj_child_text { max-width: none; overflow-wrap: anywhere; white-space: normal; }
  .block_obj_save_status_row { border-top: 1px solid var(--bo-border); margin-top: 16px; padding-top: 8px; }
  .block_obj_save_status { color: var(--bo-text-muted); font-size: 11px; }
  .block_obj_save_status[data-state="dirty"] { color: #A16207; }
  .block_obj_save_status[data-state="success"] { color: #15803D; }
  .block_obj_save_status[data-state="error"] { color: var(--bo-danger); }
  .block_obj_duration_preview { min-width: 34px; }
  .block_obj_expand_box {
    bottom: 0;
    height: 6vh;
    position: fixed;
    right: -6vw;
    transition: 0.5s;
    width: 12vw;
    z-index: 99999;
  }
  .block_obj_show_expand_box {
    right: 0;
    width: 6vw;
  }
  /* v6.6：触发器与面板同风格——白底带边框圆角矩形 */
  .block_obj_expand_span {
    background-color: #FFF;
    border-radius: 8px;
    border: 1px solid #E4E4E7;
    bottom: 1vh;
    box-shadow: 0 2px 8px rgba(9, 9, 11, 0.08);
    color: #18181B;
    cursor: pointer;
    display: block;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px;
    height: 30px;
    line-height: 28px;
    padding: 0 12px;
    position: absolute;
    right: 1vw;
    text-align: center;
    user-select: none;
    z-index: 99999;
  }
  .block_obj_expand_span:hover {
    background-color: #F4F4F5;
    box-shadow: 0 2px 10px rgba(9, 9, 11, 0.12);
  }
  .block_obj_none {
    display: none !important;
  }
  .block_obj_hidden {
    visibility: hidden !important;
  }
`

export const BASIC_STYLE = `
      .player-mode-webfullscreen,
      .mode-webfullscreen,
      .webfullscreen,
      .player-module {
          z-index: 100001 !important;
      }
  `

let injected = false

/** 注入样式（幂等：追加到 <body>） */
export function injectStyles() {
  if (injected || !document.body) {
    return
  }
  const libStyle = document.createElement('style')
  libStyle.innerHTML = LIB_STYLE
  document.body.appendChild(libStyle)
  const basicStyle = document.createElement('style')
  basicStyle.innerHTML = BASIC_STYLE
  document.body.appendChild(basicStyle)
  injected = true
}
