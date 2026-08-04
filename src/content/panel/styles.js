// 样式：
//   LIB_STYLE   —— Block_Obj v3.0.3 BLOCK_STYLE 逐字移植（GPL-3.0+ 兼容）
//   BASIC_STYLE —— target.js 107–130 逐字（全屏播放器 z-index 覆盖 + 注入按钮样式）

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
  .block_obj_separator_symbol {
    background-color: #303030;
    height: 2px;
    margin-bottom: 5px;
    margin-top: 5px;
    min-width: 400px;
  }
  .block_obj_input_div {
    margin-top: 5px;
  }
  .block_obj_input {
    background-color: #C0C0C0;
    border: 1px solid #C0C0C0;
    color: #000;
    font-size: 13px;
    min-height: 1.5em;
    margin-left: 5px;
    margin-right: 5px;
    padding-left: 4px;
  }
  .block_obj_keyword_input {
    width: 220px;
  }
  .block_obj_input_btn {
    background-color: #3da9cc;
    border-radius: 3px;
    border: 1px solid #73C9E5;
    box-shadow: 0 0 4px #73C9E5;
    color: #FFF;
    cursor: pointer;
    display: inline-block;
    min-height: 1em;
    margin-left: 5px;
    text-align: center;
    vertical-align: bottom;
    white-space: nowrap;
    width: 30px;
  }
  .block_obj_list_div {
    margin-top: 5px;
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
  .block_obj_child_del {
    color: #A9181C;
    cursor: pointer;
  }
  .block_obj_list_textarea_expand {
    max-height: 720px;
  }
  .block_obj_li_hide {
    display: none;
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
  .block_obj_presentation_div {
    display: flex;
    position: fixed;
    background-color: rgba(0, 0, 0, .5);
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100000;
    align-items: center;
    justify-content: center;
  }
  .block_obj_dialog_div {
    position: relative;
    width: 400px;
    background-color: #4e5654;
    border: 0 solid #000;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
  }
  .block_obj_big_bang_top_part {
    margin-top: 5px;
    margin-bottom: 5px;
  }
  .block_obj_big_bang_h3 {
    font-size: 20px;
    color: #fff;
    margin-left: 5px;
    background-color: #4e5654;
    border-color: #4e5654;
  }
  .block_obj_big_bang_deselect_btn {
    float: right;
    margin-top: 5px;
    margin-right: 5px;
    color: #2a2a92;
    cursor: pointer;
  }
  .block_obj_big_bang_middle_part {
    margin-top: 5px;
    margin-bottom: 5px;
    max-height: 500px;
    overflow-y: auto;
  }
  .block_obj_big_bang_text {
    background-color: #3e3939;
    color: #fff;
    padding: 5px;
    margin: 4px;
    font-size: 16px;
    display: inline-block;
    border-radius: 99px;
    cursor: pointer;
    user-select: none;
  }
  .block_obj_big_bang_text_selected {
    background-color: #3636b1 !important;
  }
  .block_obj_big_bang_bottom_part {
    margin-top: 5px;
    margin-bottom: 5px;
    text-align: center;
  }
  .block_obj_big_bang_add_btn, .block_obj_big_bang_copy_btn {
    display: inline-block;
    padding: 10px;
    color: #fff;
    background-color: #325561;
    cursor: pointer;
    border-radius: 99px;
    margin-left: 20px;
    margin-right: 20px;
  }
  .block_obj_big_bang_add_btn:hover, .block_obj_big_bang_copy_btn:hover {
    color: #2a2a92;
  }
`;

export const BASIC_STYLE = `
      .player-mode-webfullscreen,
      .mode-webfullscreen,
      .webfullscreen,
      .player-module {
          z-index: 100001 !important;
      }
      .bilibili_reply_bang_button,
      .bilibili_comment_bang_button,
      .bilibili_reply_user_block_button,
      .bilibili_comment_user_block_button {
          display: inline-block;
          padding-left: 5px;
          border-radius: 4px;
          cursor: pointer;
      }
      .bilibili_reply_bang_button:hover,
      .bilibili_comment_bang_button:hover,
      .bilibili_reply_user_block_button:hover,
      .bilibili_comment_user_block_button:hover {
          color: #ec6490;
/*           background-color: #e5e9ef; */
      }
  `;

let injected = false;

/** 注入样式（幂等；对等 Block_Obj init：追加到 <body>） */
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
