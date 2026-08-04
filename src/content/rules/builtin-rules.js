// 内置选择器规则表（v6.0 分类重构版，集版本 3）。
// 规则选择器模型：selector（卡片容器）+ textSelectors（文字选择器数组）+ durationSelector（可选）。
// v6.0：分类重定义为 搜索/空间/播放/收藏；首页 feed 等未匹配页面不再触发，
//   相关规则（动态卡 .bili-dyn-item、首页侧栏等）随之删除；「全局」不再承载规则。

export const BUILTIN_RULES = Object.freeze([
  /* 新版视频卡片（搜索结果 / 播放列表 / 收藏列表 / 空间投稿通用组件） */
  Object.freeze({
    id: 'builtin-bili-video-card',
    selector: 'div:has(> .bili-video-card)',
    textSelectors: Object.freeze(['.bili-video-card__info--tit', '.bili-video-card__info--author']),
    durationSelector: '.bili-video-card__stats__duration',
    scopes: ['search', 'space', 'play', 'fav'],
    mode: 'match',
  }),
  /* 旧版视频卡（部分列表页仍在用） */
  Object.freeze({
    id: 'builtin-video-card',
    selector: '.video-card',
    textSelectors: Object.freeze(['.video-card .title', '.video-card .name']),
    scopes: ['search', 'space', 'play', 'fav'],
    mode: 'match',
  }),
  /* UP主空间投稿列表 */
  Object.freeze({
    id: 'builtin-space-cube',
    selector: '.cube-list .small-item',
    textSelectors: Object.freeze(['.small-item .title']),
    scopes: ['space'],
    mode: 'match',
  }),
  /* 搜索结果 UP 主卡 */
  Object.freeze({
    id: 'builtin-search-user-list',
    selector: '.user-list',
    textSelectors: Object.freeze(['.user-list .user-name']),
    scopes: ['search'],
    mode: 'match',
  }),
  /* 播放页右侧推荐 */
  Object.freeze({
    id: 'builtin-video-page-card',
    selector: '.video-page-card, .video-page-operator-card',
    textSelectors: Object.freeze(['.title', 'div.up']),
    scopes: ['play'],
    mode: 'match',
  }),
  /* 播放页右侧小卡 */
  Object.freeze({
    id: 'builtin-video-page-card-small',
    selector: '.video-page-card-small',
    textSelectors: Object.freeze(['.title', '.name']),
    scopes: ['play'],
    mode: 'match',
  }),
  /* 稍后再看/播放列表侧栏 */
  Object.freeze({
    id: 'builtin-recommend-video-card',
    selector: '.recommend-video-card',
    textSelectors: Object.freeze(['.title', '.name']),
    scopes: ['play'],
    mode: 'match',
  }),
  /* 播放器片尾推荐 */
  Object.freeze({
    id: 'builtin-ending-related',
    selector: '.bpx-player-ending-related-item',
    textSelectors: Object.freeze(['.bpx-player-ending-related-item-title']),
    scopes: ['play'],
    mode: 'match',
  }),
]);
