// 配置默认值与存储常量（对等 target.js 414–435、453–462）

export const CONFIG_KEY = 'bilibili_config';
export const INFO_RECORD_KEY = 'infoRecord';

// 默认配置（frozen）——字段与默认值逐字对等 target.js 414–435
export const DEFAULT_CONFIG = Object.freeze({
  functionEnable: true,
  usernameEnable: true,
  keywordEnable: true,
  whitelistEnable: false,
  commentEnable: false,
  commentKeywordEnable: false,
  commentFans: false,
  convertEmojiEnable: false,
  showBlockUserBtnEnable: false,
  showBangBtnEnable: false,
  liveEnable: false,
  picEnable: false,
  messageReplyEnable: false,
  messageReplyDelEnable: false,
  dynamicVideo: false,
  dynamicContent: false,
  usernameArray: [],
  keywordArray: [],
  commentArray: [],
  whitelistArray: [],
});

// getConfig() 读取时执行 字符串→RegExp 转换的 key（对等 Block_Obj regConversion）
export const REG_CONVERSION_KEYS = Object.freeze(['keywordArray', 'commentArray']);

// 旧 key 迁移对（对等 target.js 453–462 的 Block_Obj 构造参数）
export const LEGACY_MIGRATIONS = Object.freeze([
  Object.freeze({ key: 'keywordArray', ori: 'regArray' }),
  Object.freeze({ key: 'commentArray', ori: 'commentRegArray' }),
]);
