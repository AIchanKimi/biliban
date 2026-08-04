// 全局常量：DOM id 前缀、类名、时序、URL 正则（均取自 target.js / Block_Obj v3.0.3 源码）

// 面板与字段 DOM id（Block_Obj: 'blockObj_' + init.id；字段 {init.id}_{fieldId}）
export const PANEL_INIT_ID = 'bilibiliConfig';
export const BLOCK_OBJ_ID = `blockObj_${PANEL_INIT_ID}`;
export const WRAP_ID = `${BLOCK_OBJ_ID}_wrapDiv`;
export const FIELD_ID_PREFIX = `${PANEL_INIT_ID}_`;
export const PANEL_TITLE = 'bilibili_屏蔽设置';

// hideOperation 类名（Block_Obj BLOCK_STYLE）
export const HIDE_NONE_CLASS = 'block_obj_none'; // display: none !important
export const HIDE_HIDDEN_CLASS = 'block_obj_hidden'; // visibility: hidden !important

// 悬浮触发器类名
export const EXPAND_BOX_CLASS = 'block_obj_expand_box';
export const EXPAND_BOX_SHOW_CLASS = 'block_obj_show_expand_box';
export const EXPAND_SPAN_CLASS = 'block_obj_expand_span';

// 面板结构类名
export const WRAP_DIV_CLASS = 'block_obj_wrap_div';
export const WRAP_SHOW_CLASS = 'block_obj_show_wrap';
export const WRAP_HIDDEN_CLASS = 'block_obj_hidden_wrap';
export const MAIN_FIELDSET_CLASS = 'block_obj_main_fieldset';
export const UL_NODE_CLASS = 'block_obj_ul_node';

// 字段渲染类名
export const CHECKBOX_LI_CLASS = 'block_obj_checkbox_li';
export const CHECKBOX_INPUT_CLASS = 'block_obj_checkbox_input';
export const CHECKBOX_LABEL_CLASS = 'block_obj_checkbox_label';
export const SEPARATOR_LI_CLASS = 'block_obj_separator_li';
export const SEPARATOR_TEXT_CLASS = 'block_obj_separator_text';
export const SEPARATOR_SYMBOL_CLASS = 'block_obj_separator_symbol';
export const INPUT_DIV_CLASS = 'block_obj_input_div';
export const INPUT_SPAN_CLASS = 'block_obj_input_span';
export const INPUT_CLASS = 'block_obj_input block_obj_keyword_input';
export const INPUT_BTN_CLASS = 'block_obj_input_btn';
export const LIST_DIV_CLASS = 'block_obj_list_div';
export const LIST_TEXTAREA_DIV_CLASS = 'block_obj_list_textarea_div';
export const LIST_EXPAND_CLASS = 'block_obj_list_textarea_expand';
export const LI_HIDE_CLASS = 'block_obj_li_hide';
export const MOVE_RIGHT_CLASS = 'block_obj_move_right';

// chip 类名
export const CHIP_CLASS = 'block_obj_child_span';
export const CHIP_TEXT_CLASS = 'block_obj_child_text';
export const CHIP_GREEN_CLASS = 'block_obj_child_green';
export const CHIP_DEL_CLASS = 'block_obj_child_del';
export const CHIP_TRUNCATE_LIMIT = 9;

// 面板底部按钮类名
export const BUTTON_CLASS = 'block_obj_button';
export const SAVE_BUTTON_CLASS = 'block_obj_button block_obj_save_button';
export const CANCEL_BUTTON_CLASS = 'block_obj_button block_obj_cancel_button';
export const BUTTON_CLICKED_CLASS = 'block_obj_button_clicked';

// 面板字段模块 classname（对等 target.js 93–106 MODULE）
export const MODULE_CLASSNAMES = Object.freeze({
  USERNAME: 'li_username',
  WHITELIST: 'li_whitelist',
  VIDEO_KEYWORD: 'li_video_keyword',
  COMMENT_KEYWORD: 'li_comment_keyword',
});

// 列表 id → 模块 classname（'i'/'l' 共享，展开按钮依赖）
export const LIST_CLASS_BY_FIELD = Object.freeze({
  whitelistArray: 'li_whitelist',
  usernameArray: 'li_username',
  keywordArray: 'li_video_keyword',
  commentArray: 'li_comment_keyword',
});

// 注入按钮类名（对等 target.js BASIC_STYLE 与 hideComment）
export const COMMENT_BLOCK_BTN_CLASS = 'bilibili_comment_user_block_button';
export const REPLY_BLOCK_BTN_CLASS = 'bilibili_reply_user_block_button';
export const COMMENT_BANG_BTN_CLASS = 'bilibili_comment_bang_button';
export const REPLY_BANG_BTN_CLASS = 'bilibili_reply_bang_button';

// 大爆炸类名
export const BIG_BANG_OVERLAY_CLASS = 'block_obj_presentation_div';
export const BIG_BANG_DIALOG_CLASS = 'block_obj_dialog_div';
export const BIG_BANG_TOP_CLASS = 'block_obj_big_bang_top_part';
export const BIG_BANG_H3_CLASS = 'block_obj_big_bang_h3';
export const BIG_BANG_DESELECT_CLASS = 'block_obj_big_bang_deselect_btn';
export const BIG_BANG_MIDDLE_CLASS = 'block_obj_big_bang_middle_part';
export const BIG_BANG_TEXT_CLASS = 'block_obj_big_bang_text';
export const BIG_BANG_SELECTED_CLASS = 'block_obj_big_bang_text_selected';
export const BIG_BANG_BOTTOM_CLASS = 'block_obj_big_bang_bottom_part';
export const BIG_BANG_ADD_CLASS = 'block_obj_big_bang_add_btn';
export const BIG_BANG_COPY_CLASS = 'block_obj_big_bang_copy_btn';

// v5 面板新控件类名
export const SELECT_CLASS = 'block_obj_select';
export const NUMBER_INPUT_CLASS = 'block_obj_input block_obj_number_input';
export const CHIP_BADGE_CLASS = 'block_obj_child_badge';
export const CHIP_TEMP_BADGE_CLASS = 'block_obj_child_badge block_obj_child_badge_temp';
export const RULE_ROW_CLASS = 'block_obj_rule_row';
export const RULE_MORE_CLASS = 'block_obj_rule_more';
export const LI_USERNAME_CLASS = 'block_obj_li_username';
export const LI_KEYWORD_CLASS = 'block_obj_li_keyword';

// 时序（毫秒）
export const INTERVAL_TIME = 100; // resolver 请求节流基数
export const SAVE_FLASH_MS = 1000; // 「已保存」文本闪烁
export const BUTTON_FLASH_MS = 1000; // buttonClicked title 闪烁
export const CANCEL_REBUILD_MS = 800; // 取消后重建延迟
export const HOMEPAGE_CLICK_DELAY_MS = 250; // 首页 .btn.next/.prev
export const PANEL_TRIGGER_DELAY_MS = 1000; // 漫画换一换 / 直播 tab

// URL 门控正则（逐字对等 target.js）
export const WWW_HOME_RE = /www\.bilibili\.com\/?(\/\?spm_id_from=.*)?$/; // 723
export const DYNAMIC_PAGES_RE = /(t|manga|space)\.bilibili\.com/; // 1253
export const MESSAGE_REPLY_RE = /message\.bilibili\.com\/#\/reply/; // 1308
export const LIVE_ROOM_RE = /live\.bilibili\.com\/\d+/; // 1334
export const LIVE_ALL_RE = /live\.bilibili\.com\/all/; // 767
