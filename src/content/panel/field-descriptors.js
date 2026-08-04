// 设置面板字段描述符 —— 逐字移植 target.js 468–698（blockObj.init 的 field 数组）。
// 类型：'c' 复选框、's' 分隔（有 label 为橙色标题，无则横线）、'i' 输入行、'l' 列表、'br' 换行。
import { MODULE_CLASSNAMES } from '../constants.js';

export const FIELD_DESCRIPTORS = Object.freeze([
  Object.freeze({
    id: 'functionEnable',
    label: '启用屏蔽功能',
    title: '总开关',
    type: 'c',
    default: true,
  }),
  Object.freeze({
    id: 'whitelistEnable',
    label: '启用白名单',
    title: '白名单用户的视频(或直播间/相薄)以及评论(或回复)不会被屏蔽',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    label: '屏蔽视频(或直播间/相薄)：',
    type: 's',
  }),
  Object.freeze({
    id: 'usernameEnable',
    label: '按用户名',
    title: '屏蔽指定用户发布的视频(或直播间/相薄)',
    type: 'c',
    default: true,
  }),
  Object.freeze({
    id: 'keywordEnable',
    label: '按关键字或正则',
    title: '屏蔽标题中包含指定关键字或匹配正则表达式的视频(或直播间/相薄)',
    type: 'c',
    default: true,
    move_right: true,
  }),
  Object.freeze({
    id: 'liveEnable',
    label: '直播间',
    title: '扩展作用范围以同时允许屏蔽直播间',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    id: 'picEnable',
    label: '相薄',
    title: '扩展作用范围以同时允许屏蔽相薄',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    id: 'dynamicVideo',
    label: '动态',
    title: '允许屏蔽转发、分享指定用户的动态\n允许屏蔽视频标题匹配关键字或正则的动态',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    label: '屏蔽评论(或回复)：',
    type: 's',
  }),
  Object.freeze({
    id: 'commentEnable',
    label: '按用户名',
    title: '屏蔽指定用户发布的评论(或回复)',
    type: 'c',
    default: false,
  }),
  Object.freeze({
    id: 'commentKeywordEnable',
    label: '按关键字或正则',
    title: '屏蔽内容中包含指定关键字或匹配正则表达式的评论(或回复)',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    id: 'commentFans',
    label: '按粉丝勋章',
    title: '屏蔽直播间中挂有指定粉丝勋章用户发布的弹幕评论\n屏蔽动态、视频播放等页面中挂有指定粉丝勋章用户发布的评论',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    id: 'dynamicContent',
    label: '动态',
    title: '允许屏蔽动态内容(包含转发、分享)匹配关键字或正则的动态',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    type: 'br',
  }),
  Object.freeze({
    id: 'convertEmojiEnable',
    label: '表情转成文字',
    title:
      '判定时将表情包转换成对应的标识文字，例：[鸡腿]、[tv_白眼]等\n注意：使用关键字来匹配表情时，必须包含完整的中括号对；\n如 "鸡腿" 是无法匹配表情 [鸡腿] 的，需使用 "[鸡腿]" 进行匹配',
    type: 'c',
    default: false,
  }),
  Object.freeze({
    id: 'showBlockUserBtnEnable',
    label: '显示屏蔽用户按钮',
    title: '在评论在底部显示一个屏蔽该用户的按钮',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    id: 'showBangBtnEnable',
    label: '显示"爆炸"按钮',
    title: '在评论底部显示一个可以拆分并选择文本内容的按钮',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    type: 'br',
  }),
  Object.freeze({
    id: 'messageReplyEnable',
    label: '消息中心里的回复',
    title: '扩展作用范围以同时允许屏蔽消息中心里的回复',
    type: 'c',
    default: false,
  }),
  Object.freeze({
    id: 'messageReplyDelEnable',
    label: '自动删除回复通知',
    title: '同时将屏蔽的回复通知自动删除\n删除的记录可在控制台中查看\n请谨慎启用该选项，因为删除操作是不可逆的！',
    type: 'c',
    default: false,
    move_right: true,
  }),
  Object.freeze({
    type: 's',
  }),
  Object.freeze({
    type: 's',
    label: '白名单 (用户名)：',
    classname: MODULE_CLASSNAMES.WHITELIST,
  }),
  Object.freeze({
    id: 'whitelistInput',
    label: '输入：',
    placeholder: ' 同时输入多个时以半角逗号分隔 ',
    type: 'i',
    list_id: 'whitelistArray',
    classname: MODULE_CLASSNAMES.WHITELIST,
  }),
  Object.freeze({
    id: 'whitelistArray',
    type: 'l',
    default: [],
    classname: MODULE_CLASSNAMES.WHITELIST,
  }),
  Object.freeze({
    type: 's',
  }),
  Object.freeze({
    type: 's',
    label: '黑名单 (用户名/粉丝勋章名)：',
    classname: MODULE_CLASSNAMES.USERNAME,
  }),
  Object.freeze({
    id: 'usernameInput',
    label: '输入：',
    placeholder: ' 同时输入多个时以半角逗号分隔 ',
    type: 'i',
    list_id: 'usernameArray',
    classname: MODULE_CLASSNAMES.USERNAME,
  }),
  Object.freeze({
    id: 'usernameArray',
    type: 'l',
    default: [],
    classname: MODULE_CLASSNAMES.USERNAME,
  }),
  Object.freeze({
    type: 's',
  }),
  Object.freeze({
    type: 's',
    label: '视频(或直播间/相薄)关键字或正则：',
    classname: MODULE_CLASSNAMES.VIDEO_KEYWORD,
  }),
  Object.freeze({
    id: 'videoKeywordInput',
    label: '输入：',
    placeholder: ' 正则表达式格式: /Pattern/Modifier ',
    type: 'i',
    list_id: 'keywordArray',
    classname: MODULE_CLASSNAMES.VIDEO_KEYWORD,
  }),
  Object.freeze({
    id: 'keywordArray',
    type: 'l',
    default: [],
    classname: MODULE_CLASSNAMES.VIDEO_KEYWORD,
  }),
  Object.freeze({
    type: 's',
  }),
  Object.freeze({
    type: 's',
    label: '评论(或回复)关键字或正则：',
    classname: MODULE_CLASSNAMES.COMMENT_KEYWORD,
  }),
  Object.freeze({
    id: 'commentKeywordInput',
    label: '输入：',
    placeholder: ' 正则表达式格式: /Pattern/Modifier ',
    type: 'i',
    list_id: 'commentArray',
    classname: MODULE_CLASSNAMES.COMMENT_KEYWORD,
  }),
  Object.freeze({
    id: 'commentArray',
    type: 'l',
    default: [],
    classname: MODULE_CLASSNAMES.COMMENT_KEYWORD,
  }),
  Object.freeze({
    type: 's',
  }),
]);

// 复选框字段 id 列表（collectConfigFromDom 使用）
export const CHECKBOX_FIELD_IDS = Object.freeze(
  FIELD_DESCRIPTORS.filter(f => f.type === 'c' && f.id).map(f => f.id)
);

// 列表字段 id 列表（collectConfigFromDom 使用）
export const LIST_FIELD_IDS = Object.freeze(
  FIELD_DESCRIPTORS.filter(f => f.type === 'l' && f.id).map(f => f.id)
);
