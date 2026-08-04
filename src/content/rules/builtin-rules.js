// 内置选择器规则表（v5.5 重构版，集版本 2）。
// 规则选择器模型：selector（卡片容器）+ textSelectors（文字选择器数组，提取文本给屏蔽词匹配）
//   + durationSelector（可选，时长文本定位）。UP 主选择器已废弃（统一为文字匹配）。
// 相比旧 23 条，裁掉了大量失效的旧版布局规则（.video-card-common/.groom-module/.rank-wrap/
//   .manga-*/.van-slide/ul.vd-list/.video-card-reco/.storey-box/.video-item/.article-list/
//   .rank-video-card/.article-card），保留并修正当前 B 站仍在用的卡片容器。
// div:has(> .bili-video-card) 改为全局：首页 feed 与搜索结果为同一卡片组件。

export const BUILTIN_RULES = Object.freeze([
  /* 新版视频卡片（首页 feed / 搜索结果 / 频道页通用组件） */
  Object.freeze({
    id: 'builtin-bili-video-card',
    selector: 'div:has(> .bili-video-card)',
    textSelectors: Object.freeze(['.bili-video-card__info--tit', '.bili-video-card__info--author']),
    durationSelector: '.bili-video-card__stats__duration',
    scopes: ['global'],
    mode: 'match',
  }),
  /* 旧版下拉视频卡（部分列表页仍在用） */
  Object.freeze({
    id: 'builtin-video-card',
    selector: '.video-card',
    textSelectors: Object.freeze(['.video-card .title', '.video-card .name']),
    scopes: ['global'],
    mode: 'match',
  }),
  /* 动态页视频卡片：标题 + 作者 */
  Object.freeze({
    id: 'builtin-dyn-item',
    selector: '.bili-dyn-item',
    textSelectors: Object.freeze(['.bili-dyn-card-video__title', '.bili-dyn-item .dyn-orig-author__name']),
    scopes: ['global'],
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
  /* 视频页右侧推荐 */
  Object.freeze({
    id: 'builtin-video-page-card',
    selector: '.video-page-card, .video-page-operator-card',
    textSelectors: Object.freeze(['.title', 'div.up']),
    scopes: ['video'],
    mode: 'match',
  }),
  /* 视频页右侧小卡 */
  Object.freeze({
    id: 'builtin-video-page-card-small',
    selector: '.video-page-card-small',
    textSelectors: Object.freeze(['.title', '.name']),
    scopes: ['video'],
    mode: 'match',
  }),
  /* 稍后再看右侧栏 */
  Object.freeze({
    id: 'builtin-recommend-video-card',
    selector: '.recommend-video-card',
    textSelectors: Object.freeze(['.title', '.name']),
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* 播放器片尾推荐 */
  Object.freeze({
    id: 'builtin-ending-related',
    selector: '.bpx-player-ending-related-item',
    textSelectors: Object.freeze(['.bpx-player-ending-related-item-title']),
    scopes: ['video'],
    mode: 'match',
  }),
]);
