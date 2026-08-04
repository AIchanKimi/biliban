// 内置选择器规则表（v5）。由 v4 handler-table.js 的 38 条裁剪而来：
//   删 10 条直播型、4 条相薄型、1 条死规则（.rank-list li.item，text '> a' 必抛零效果）。
// scopes 按旧 indexOf 门控语义逐条还原：
//   url 缺省（旧=整个 www，含视频页）→ ['home','video']
//   数组含裸 'bilibili.com' → ['global']
//   显式 url → 所属分类
// 与自定义规则同构（engine/hide-event.js 统一消费）；映射全表由单测钉死。

/**
 * @typedef {Readonly<{
 *   id: string, selector: string, scopes: string[], mode: 'match',
 *   titleSelector?: string | string[], userSelector?: string | string[] | null,
 *   userReg?: RegExp, method?: 0 | 1, resolve?: 'bv', bvSelector?: string,
 * }>} BuiltinRule
 */

export const BUILTIN_RULES = Object.freeze([
  /* 片尾推荐 */
  Object.freeze({
    id: 'builtin-ending-related',
    selector: '.bpx-player-ending-related-item',
    titleSelector: '.bpx-player-ending-related-item-title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* 搜索页 UP主块 */
  Object.freeze({
    id: 'builtin-search-user-list',
    selector: '.user-list',
    userSelector: '.user-list .user-name',
    scopes: ['search'],
    mode: 'match',
  }),
  /* 动态页主体视频卡片：视频标题 + 转发视频作者（v5.2：动态分类精简，全局词条覆盖） */
  Object.freeze({
    id: 'builtin-dyn-item',
    selector: '.bili-dyn-item',
    userSelector: '.bili-dyn-item .dyn-orig-author__name',
    titleSelector: '.bili-dyn-card-video__title',
    scopes: ['global'],
    mode: 'match',
  }),
  /* 稍后再看右侧栏 */
  Object.freeze({
    id: 'builtin-recommend-video-card',
    selector: '.recommend-video-card',
    userSelector: '.recommend-video-card .name',
    titleSelector: '.recommend-video-card .title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* 视频页右侧栏（www 域） */
  Object.freeze({
    id: 'builtin-video-page-card-small',
    selector: '.video-page-card-small',
    userSelector: '.video-page-card-small .name',
    titleSelector: '.video-page-card-small .title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* UP主空间视频主页内容（v5.3：空间分类回归） */
  Object.freeze({
    id: 'builtin-space-cube',
    selector: '.cube-list .small-item',
    titleSelector: '.small-item .title',
    scopes: ['space'],
    mode: 'match',
  }),
  /* 下拉动态卡片（旧含裸 bilibili.com → 全子域） */
  Object.freeze({
    id: 'builtin-video-card',
    selector: '.video-card',
    userSelector: '.video-card .name',
    titleSelector: '.video-card .title',
    scopes: ['global'],
    mode: 'match',
  }),
  /* 新搜索页面 */
  Object.freeze({
    id: 'builtin-search-bili-video-card',
    selector: 'div:has(> .bili-video-card)',
    userSelector: '.bili-video-card__info--author',
    titleSelector: '.bili-video-card__info--tit',
    scopes: ['search'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-video-card-common',
    selector: '.video-card-common',
    userSelector: ['a.up', 'a.ex-up'],
    titleSelector: ['a.title', 'p.ex-title'],
    method: 1,
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-video-card-reco',
    selector: '.video-card-reco',
    userSelector: 'p.up',
    titleSelector: 'p.title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-van-slide',
    selector: '.van-slide div.item',
    titleSelector: 'p.title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-rank-wrap',
    selector: '.rank-wrap',
    userSelector: 'span.name',
    titleSelector: ['p.f-title', 'p.title', 'div.txt a.link p'],
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-article-card',
    selector: '.article-card',
    userSelector: 'a.up',
    titleSelector: 'a.title',
    method: 1,
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-manga-card',
    selector: '.manga-card',
    titleSelector: 'p.manga-title',
    method: 1,
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-manga-spread',
    selector: '.manga-spread-module',
    titleSelector: 'p.t',
    method: 1,
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-groom-module',
    selector: '.groom-module',
    userSelector: 'p.author',
    userReg: /^up主：/,
    titleSelector: 'p.title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-vd-list',
    selector: 'ul.vd-list li',
    userSelector: 'a.v-author',
    titleSelector: 'a.title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  Object.freeze({
    id: 'builtin-video-page-card',
    selector: '.video-page-card, .video-page-operator-card',
    userSelector: 'div.up',
    titleSelector: '.title',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* 旧 c:2：仅标题，按 BV 异步查 UP 主名 */
  Object.freeze({
    id: 'builtin-storey-spread',
    selector: '.storey-box .spread-module',
    titleSelector: 'p.t',
    resolve: 'bv',
    bvSelector: 'a',
    scopes: ['home', 'video'],
    mode: 'match',
  }),
  /* 视频页推荐（旧 url 仅 /video/ 与 /bangumi/ 路径） */
  Object.freeze({
    id: 'builtin-ebox',
    selector: '.ebox',
    userSelector: '.author',
    titleSelector: '.etitle',
    scopes: ['video'],
    mode: 'match',
  }),
  /* 专栏排行（www/read/ranking） */
  Object.freeze({
    id: 'builtin-article-list',
    selector: '.article-list li',
    userSelector: '.nick-name',
    titleSelector: '.article-title',
    scopes: ['home'],
    mode: 'match',
  }),
  /* 频道/热门（www/v/channel、www/v/popular） */
  Object.freeze({
    id: 'builtin-rank-video-card',
    selector: '.rank-video-card, .video-card',
    userSelector: '.up-name',
    titleSelector: '.video-name',
    scopes: ['home'],
    mode: 'match',
  }),
  /* 搜索结果视频列表 */
  Object.freeze({
    id: 'builtin-search-video-item',
    selector: '.video-item',
    userSelector: 'a.up-name',
    titleSelector: 'a.title',
    scopes: ['search'],
    mode: 'match',
  }),
]);
