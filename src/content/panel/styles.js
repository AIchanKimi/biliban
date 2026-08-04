// 样式：
//   LIB_STYLE   —— 面板/触发器/chip 基础样式（源自 Block_Obj v3.0.3，GPL-3.0+ 兼容；v5 增补新控件）
//   BASIC_STYLE —— 全屏播放器 z-index 覆盖（target.js 107–130 残留必要项）

export const LIB_STYLE = `
  .block_obj_wrap_div {
    background-color: #222222;
    border-radius: 3px;
    border: 1px solid #282A36;
    bottom: 6vh;
    box-shadow: 0 0 5px #282A36;
    color: #D3D3D3;
    font-size: 13px;
    margin: 0px;
    padding: 0px;
    position: fixed;
    text-align: left;
    transition: 0.8s;
    width: 520px;
    z-index: 99999;
  }
  .block_obj_show_wrap {
    display: block;
    right: 0;
  }
  .block_obj_hidden_wrap {
    right: -530px;
  }
  .block_obj_main_fieldset {
    border-radius: 3px;
    border: 3px groove #00A1D6;
    height: auto;
    margin: 8px;
    min-width: 300px;
    padding: 4px 9px 6px 9px;
    width: auto;
  }
  .block_obj_ul_node {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }
  .block_obj_checkbox_li {
    display: inline-block;
    margin-top: 5px;
  }
  .block_obj_checkbox_input {
    clip: rect(0, 0, 0, 0);
    position: absolute;
  }
  .block_obj_checkbox_label {
    cursor: help;
    vertical-align: middle;
  }
  .block_obj_checkbox_input + label::before {
    background-color: silver;
    border-radius: 0.1em;
    color: #FFF;
    content: "\\a0";
    display: inline-block;
    height: 1em;
    line-height: 85%;
    margin-right: 0.5em;
    text-align: center;
    vertical-align: 0.2em;
    width: 1em;
    cursor: pointer;
  }
  .block_obj_checkbox_input:checked + label::before {
    background-color: #00A1D6;
    content: "\\2713";
  }
  .block_obj_separator_text {
    color: #FFB86C;
    margin-top: 5px;
  }
  .block_obj_input_div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .block_obj_input {
    background-color: #C0C0C0;
    border: 1px solid #C0C0C0;
    color: #000;
    font-size: 13px;
    min-height: 1.5em;
    padding-left: 4px;
  }
  .block_obj_keyword_input {
    width: 190px;
  }
  .block_obj_number_input {
    width: 70px;
  }
  .block_obj_select {
    background-color: #C0C0C0;
    border: 1px solid #C0C0C0;
    color: #000;
    font-size: 13px;
  }
  .block_obj_input_btn {
    background-color: #3da9cc;
    border-radius: 3px;
    border: 1px solid #73C9E5;
    box-shadow: 0 0 4px #73C9E5;
    color: #FFF;
    cursor: pointer;
    min-height: 1em;
    padding: 1px 6px;
    text-align: center;
    white-space: nowrap;
  }
  .block_obj_list_div {
    margin-top: 6px;
  }
  .block_obj_list_textarea_div {
    border: 1px dotted #00A1D6;
    margin-top: 3px;
    max-height: 65px;
    min-height: 3px;
    overflow: auto;
  }
  .block_obj_list_textarea_div::-webkit-scrollbar {
    background-color: #979797;
    border-radius: 5px;
    width: 10px;
  }
  .block_obj_list_textarea_div::-webkit-scrollbar-thumb {
    background-color: #404040;
    border-radius: 5px;
  }
  .block_obj_button_clicked {
    color: #000;
  }
  .block_obj_child_span {
    background-color: #3D3D3D;
    border-radius: 5px;
    border: 1px solid #3D3D3D;
    display: inline-block;
    margin: 3px;
    padding: 2px;
    min-height: 18px;
  }
  .block_obj_child_text {
    border-right: 1px solid #A9181C;
    margin-right: 4px;
    padding-right: 4px;
  }
  .block_obj_child_green {
    color: #41B349;
  }
  .block_obj_child_badge {
    background-color: #00A1D6;
    border-radius: 3px;
    color: #FFF;
    font-size: 11px;
    margin-left: 4px;
    padding: 0 4px;
  }
  .block_obj_child_badge_temp {
    background-color: #FFB86C;
    color: #000;
  }
  .block_obj_child_del {
    color: #A9181C;
    cursor: pointer;
    margin-left: 4px;
  }
  .block_obj_list_textarea_expand {
    max-height: 720px;
  }
  .block_obj_li_hide {
    display: none;
  }
  .block_obj_tab_bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 5px;
  }
  .block_obj_tab {
    background-color: #3D3D3D;
    border-radius: 3px 3px 0 0;
    border: 1px solid #555;
    color: #D3D3D3;
    cursor: pointer;
    padding: 2px 8px;
    user-select: none;
  }
  .block_obj_tab:hover {
    border-color: #00A1D6;
  }
  .block_obj_tab_active {
    background-color: #00A1D6;
    border-color: #00A1D6;
    color: #FFF;
  }
  .block_obj_tab_current {
    box-shadow: inset 0 -3px 0 #41B349;
  }
  .block_obj_scope_pane {
    border: 1px dotted #444;
    border-radius: 3px;
    margin-top: 4px;
    max-height: 52vh;
    overflow-y: auto;
    padding: 2px 6px;
  }
  .block_obj_scope_pane::-webkit-scrollbar {
    background-color: #979797;
    border-radius: 5px;
    width: 10px;
  }
  .block_obj_scope_pane::-webkit-scrollbar-thumb {
    background-color: #404040;
    border-radius: 5px;
  }
  .block_obj_rule_row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    border: 1px dotted #555;
    border-radius: 3px;
    margin-top: 4px;
    padding: 4px 6px;
    position: relative;
  }
  .block_obj_rule_row .block_obj_input {
    width: 150px;
  }
  .block_obj_rule_more {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }
  .block_obj_rule_selector {
    color: #8be9fd;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    margin-left: 6px;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: bottom;
  }
  .block_obj_rule_mode {
    color: #a0a0a0;
    margin-left: 6px;
  }
  .block_obj_rule_builtin_badge {
    background-color: #555;
    border-radius: 3px;
    color: #FFF;
    font-size: 11px;
    padding: 0 4px;
  }
  .block_obj_rule_stats {
    border-radius: 3px;
    border: 1px solid #555;
    color: #8a8a8a;
    font-size: 11px;
    margin-left: 6px;
    padding: 0 4px;
  }
  .block_obj_rule_stats_hit {
    border-color: #41B349;
    color: #41B349;
  }
  .block_obj_button {
    background-color: #FB7299;
    border-radius: 4px;
    border: 1px solid #FB7299;
    color: #FFF;
    cursor: pointer;
    margin-top: 5px;
    padding: 2px 4px;
    position: relative;
    min-height: 1em;
  }
  .block_obj_save_button {
    float: right;
    margin-right: 5px;
  }
  .block_obj_cancel_button {
    float: left;
    margin-left: 5px;
  }
  .block_obj_expand_box {
    bottom: 0px;
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
  .block_obj_expand_span {
    background-color: #00A1D6;
    border-radius: 19px;
    border: 1px solid #00A1D6;
    bottom: 1vh;
    color: #FFF;
    cursor: pointer;
    display: block;
    font-size: 13px;
    height: 38px;
    line-height: 38px;
    position: absolute;
    right: 1vw;
    text-align: center;
    width: 38px;
    z-index: 99999;
    user-select: none;
  }
  .block_obj_expand_span:hover {
    box-shadow: 0 0 5px 1px green;
  }
  .block_obj_move_right {
    margin-left: 15px;
  }
  .block_obj_none {
    display: none !important;
  }
  .block_obj_hidden {
    visibility: hidden !important;
  }
`;

export const BASIC_STYLE = `
      .player-mode-webfullscreen,
      .mode-webfullscreen,
      .webfullscreen,
      .player-module {
          z-index: 100001 !important;
      }
  `;

let injected = false;

/** 注入样式（幂等：追加到 <body>） */
export function injectStyles() {
  if (injected || !document.body) {
    return;
  }
  const libStyle = document.createElement('style');
  libStyle.innerHTML = LIB_STYLE;
  document.body.appendChild(libStyle);
  const basicStyle = document.createElement('style');
  basicStyle.innerHTML = BASIC_STYLE;
  document.body.appendChild(basicStyle);
  injected = true;
}

/** 测试辅助：重置注入状态 */
export function resetInjectedForTest() {
  injected = false;
}
