// 全局常量：DOM id 前缀、类名、时序（v5 清理：移除评论按钮/大爆炸/旧 URL 门控正则）

// 面板与字段 DOM id
export const PANEL_INIT_ID = 'bilibiliConfig'
export const BLOCK_OBJ_ID = `blockObj_${PANEL_INIT_ID}`
export const WRAP_ID = `${BLOCK_OBJ_ID}_wrapDiv`
export const FIELD_ID_PREFIX = `${PANEL_INIT_ID}_`

// hideOperation 类名（Block_Obj BLOCK_STYLE）
export const HIDE_NONE_CLASS = 'block_obj_none' // display: none !important
export const HIDE_HIDDEN_CLASS = 'block_obj_hidden' // visibility: hidden !important

// 悬浮触发器类名
export const EXPAND_BOX_CLASS = 'block_obj_expand_box'
export const EXPAND_BOX_SHOW_CLASS = 'block_obj_show_expand_box'
export const EXPAND_SPAN_CLASS = 'block_obj_expand_span'

// 面板结构类名
export const WRAP_DIV_CLASS = 'block_obj_wrap_div'
export const WRAP_SHOW_CLASS = 'block_obj_show_wrap'
export const WRAP_HIDDEN_CLASS = 'block_obj_hidden_wrap'
export const MAIN_FIELDSET_CLASS = 'block_obj_main_fieldset'
export const UL_NODE_CLASS = 'block_obj_ul_node'

// 字段渲染类名
export const CHECKBOX_INPUT_CLASS = 'block_obj_checkbox_input'
export const CHECKBOX_LABEL_CLASS = 'block_obj_checkbox_label'
export const SEPARATOR_TEXT_CLASS = 'block_obj_separator_text'
export const INPUT_DIV_CLASS = 'block_obj_input_div'
export const INPUT_CLASS = 'block_obj_input block_obj_keyword_input'
export const INPUT_BTN_CLASS = 'block_obj_input_btn'
export const LIST_DIV_CLASS = 'block_obj_list_div'
export const LIST_TEXTAREA_DIV_CLASS = 'block_obj_list_textarea_div'
export const LIST_EXPAND_CLASS = 'block_obj_list_textarea_expand'
export const LI_HIDE_CLASS = 'block_obj_li_hide'

// chip 类名
export const CHIP_CLASS = 'block_obj_child_span'
export const CHIP_TEXT_CLASS = 'block_obj_child_text'
export const CHIP_GREEN_CLASS = 'block_obj_child_green'
export const CHIP_DEL_CLASS = 'block_obj_child_del'
export const CHIP_FILTERED_CLASS = 'block_obj_child_filtered'
export const CHIP_TEMP_BADGE_CLASS
  = 'block_obj_child_badge block_obj_child_badge_temp'

// 面板底部按钮类名
export const SAVE_BUTTON_CLASS = 'block_obj_button block_obj_save_button'
export const CLOSE_BUTTON_CLASS = 'block_obj_button'
export const TOOLS_BUTTON_CLASS = 'block_obj_button block_obj_tools_button'
export const BUTTON_CLICKED_CLASS = 'block_obj_button_clicked'

// v5 面板新控件类名
export const TAB_BAR_CLASS = 'block_obj_tab_bar'
export const TAB_CLASS = 'block_obj_tab'
export const TAB_ACTIVE_CLASS = 'block_obj_tab block_obj_tab_active'
export const TAB_CURRENT_CLASS = 'block_obj_tab_current' // 当前页面所属分类（含全局）
export const SCOPE_PANE_CLASS = 'block_obj_scope_pane'
export const SCOPE_PANE_EXPANDED_CLASS = 'block_obj_scope_pane_expanded'
export const SELECT_CLASS = 'block_obj_select'
export const NUMBER_INPUT_CLASS = 'block_obj_input block_obj_number_input'
export const RULE_ROW_CLASS = 'block_obj_rule_row'
export const RULE_STATS_CLASS = 'block_obj_rule_stats'
export const RULE_STATS_HIT_CLASS = 'block_obj_rule_stats_hit'
export const RULE_EDIT_CLASS = 'block_obj_rule_edit'
export const LI_WORDS_CLASS = 'block_obj_li_words'
export const LI_LIST_CLASS = 'block_obj_li_list'

// v6.3 规则区折叠控件
export const RULES_HEADER_CLASS = 'block_obj_rules_header'
export const RULES_TOGGLE_CLASS = 'block_obj_rules_toggle'
export const RULES_BODY_CLASS = 'block_obj_rules_body'

// v6.6 总开关 toggle（隐藏原生 input + 伪元素轨道/滑块）
export const SWITCH_INPUT_CLASS = 'block_obj_switch_input'
export const SWITCH_LABEL_CLASS = 'block_obj_switch'

// 时序（毫秒）
export const BUTTON_FLASH_MS = 1000 // buttonClicked title 闪烁
export const CANCEL_REBUILD_MS = 800 // 取消后重建延迟
