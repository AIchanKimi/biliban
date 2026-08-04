// 选择器处理器规则表 —— 逐字移植 target.js 131–413 的 handler 数组。
// 禁止规范化/重排：包含全部怪癖属性（clientInformation、userReg、c/bv 标记）。
// 每条规则字段含义：
//   index  卡片容器选择器
//   user   用户名元素选择器（字符串或数组，数组取首个命中）
//   text   标题元素选择器（同上）
//   method hideOperation 方法（0=display类隐藏 1=visibility类隐藏 3=inline visibility）
//   type   { live | pic | comment } 类型门控
//   url    作用域名（字符串或数组，indexOf 匹配；缺省=仅 www.bilibili.com）
//   c: 1   用户名需经 userReg 去前缀；c: 2  需按 bv 选择器异步查用户名
//   comment: true  命中后额外执行 hideComment()

export const HANDLER_RULES = Object.freeze([
  /*       片尾推荐 */
  Object.freeze({
    index: '.bpx-player-ending-related-item',
    text: '.bpx-player-ending-related-item-title',
  }),
  /*       搜索页 UP主块 */
  Object.freeze({
    index: '.user-list',
    user: '.user-list .user-name',
    url: 'search.bilibili.com',
  }),
  /*       动态页主体视频卡片 视频标题 转发视频作者 */
  Object.freeze({
    index: '.bili-dyn-item',
    user: '.bili-dyn-item .dyn-orig-author__name',
    text: '.bili-dyn-card-video__title',
    url: 't.bilibili.com',
  }),
  /*       稍后再看右侧栏 */
  Object.freeze({
    index: '.recommend-video-card',
    user: '.recommend-video-card .name',
    text: '.recommend-video-card .title',
  }),
  /*       视频页右侧栏 */
  Object.freeze({
    index: '.video-page-card-small',
    user: '.video-page-card-small .name',
    text: '.video-page-card-small .title',
  }),
  /*       up主空间视频主页内容 */
  Object.freeze({
    index: '.cube-list .small-item',
    text: '.small-item .title',
    url: 'space.bilibili.com',
  }),
  /*       下拉动态卡片 */
  Object.freeze({
    index: '.video-card',
    user: '.video-card .name',
    text: '.video-card .title',
    url: ['search.bilibili.com', 't.bilibili.com', 'space.bilibili.com', 'bilibili.com'],
  }),
  /*       新搜索页面 */
  Object.freeze({
    index: 'div:has(> .bili-video-card)',
    user: '.bili-video-card__info--author',
    text: '.bili-video-card__info--tit',
    url: 'search.bilibili.com',
  }),
  Object.freeze({
    index: '.video-card-common',
    user: ['a.up', 'a.ex-up'],
    text: ['a.title', 'p.ex-title'],
    method: 1,
  }),
  Object.freeze({
    clientInformation: 0,
    index: '.video-card-reco',
    user: 'p.up',
    text: 'p.title',
  }),
  Object.freeze({
    index: '.van-slide div.item',
    user: null,
    text: 'p.title',
  }),
  Object.freeze({
    index: '.rank-wrap',
    user: 'span.name',
    text: ['p.f-title', 'p.title', 'div.txt a.link p'],
  }),
  Object.freeze({
    index: '.article-card',
    user: 'a.up',
    text: 'a.title',
    method: 1,
  }),
  Object.freeze({
    index: '.live-card',
    user: 'p.name',
    text: 'p.desc',
    method: 1,
    type: Object.freeze({
      live: true,
    }),
  }),
  Object.freeze({
    index: '.card-live-module',
    user: '.auther',
    text: 'p.t',
    method: 1,
    type: Object.freeze({
      live: true,
    }),
  }),
  Object.freeze({
    index: '.live-rank-item',
    user: 'div.txt > p',
    text: 'p.p2',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
  }),
  Object.freeze({
    index: '.manga-card',
    user: null,
    text: 'p.manga-title',
    method: 1,
  }),
  Object.freeze({
    index: '.manga-spread-module',
    user: null,
    text: 'p.t',
    method: 1,
  }),
  Object.freeze({
    c: 1,
    index: '.groom-module',
    user: 'p.author',
    userReg: /^up主：/,
    text: 'p.title',
  }),
  Object.freeze({
    index: 'ul.vd-list li',
    user: 'a.v-author',
    text: 'a.title',
  }),
  Object.freeze({
    index: '.video-page-card, .video-page-operator-card',
    user: 'div.up',
    text: '.title',
  }),
  Object.freeze({
    index: '.rank-list li.item',
    user: null,
    text: '> a',
  }),
  Object.freeze({
    c: 2,
    index: '.storey-box .spread-module',
    bv: 'a',
    text: 'p.t',
  }),
  Object.freeze({
    index: '.ebox',
    user: '.author',
    text: '.etitle',
    url: ['www.bilibili.com/video/', 'www.bilibili.com/bangumi/'],
    comment: true,
  }),
  Object.freeze({
    index: '.article-list li',
    user: '.nick-name',
    text: '.article-title',
    url: 'www.bilibili.com/read/ranking',
  }),
  Object.freeze({
    index: '.rank-video-card, .video-card',
    user: '.up-name',
    text: '.video-name',
    url: ['www.bilibili.com/v/channel', 'www.bilibili.com/v/popular'],
  }),
  Object.freeze({
    index: '.video-item',
    user: 'a.up-name',
    text: 'a.title',
    url: 'search.bilibili.com',
  }),
  Object.freeze({
    index: '.live-user-item',
    user: '.uname',
    text: null,
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'search.bilibili.com',
  }),
  Object.freeze({
    index: '.live-room-item',
    user: '.uname span',
    text: '.item-title',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'search.bilibili.com',
  }),
  Object.freeze({
    index: '.photo-item',
    user: '.up-name',
    text: '.title',
    method: 0,
    type: Object.freeze({
      pic: true,
    }),
    url: 'search.bilibili.com',
  }),
  Object.freeze({
    index: '.rank-item',
    user: '.room-anchor',
    text: '.room-title',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'live.bilibili.com',
    comment: true,
  }),
  Object.freeze({
    index: '.room-card-wrapper',
    user: '.room-anchor > span',
    text: '.room-title',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'live.bilibili.com',
  }),
  Object.freeze({
    index: '.ysly-room-ctnr li',
    user: '.uname',
    text: '.room-name',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'live.bilibili.com',
  }),
  Object.freeze({
    index: 'ul.list li',
    user: '.room-anchor > span',
    text: '.room-title',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
    url: 'live.bilibili.com',
  }),
  Object.freeze({
    index: '.card-items li',
    user: '.uname',
    text: '.room-name',
    method: 0,
    type: Object.freeze({
      live: true,
    }),
  }),
  Object.freeze({
    index: '.content li',
    user: '.user-container a span',
    text: '.article-title a',
    method: 0,
    type: Object.freeze({
      pic: true,
    }),
    url: 'h.bilibili.com',
    comment: true,
  }),
  Object.freeze({
    index: '.rank-list > div',
    user: ['.name', '.user-name'],
    text: ['.title', '.work-name'],
    method: 0,
    type: Object.freeze({
      pic: true,
    }),
    url: 'h.bilibili.com',
  }),
  Object.freeze({
    index: '.canvas-card',
    user: '.user-container a span',
    text: '.article-title a',
    method: 1,
    type: Object.freeze({
      pic: true,
    }),
    url: 'h.bilibili.com',
  }),
]);
