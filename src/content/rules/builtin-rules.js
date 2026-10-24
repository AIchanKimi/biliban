// 内置选择器规则表（v6.9 初始基线：作者实际使用并验证过的 8 条）。
// 规则模型：selector（卡片容器）+ textSelectors（文字选择器数组）+ durationSelector（可选）。
// 只在空存储首次载入时作为种子；已保存的配置不会被覆盖，也不回灌用户删掉的规则。
// 这张表是初始数据；通用引擎测试不约束其中的数量、id 或具体选择器。

export const BUILTIN_RULES = Object.freeze([
  /* 旧版视频卡（全局规则：未匹配页面也执行） */
  Object.freeze({
    id: '6349e5e9-2ead-45dc-8dae-3d066a26d18f',
    selector: '.video-card',
    textSelectors: Object.freeze(['.title', '.name']),
    durationSelector: '',
    scopes: ['global'],
    mode: 'match',
  }),
  /* 动态列表视频卡（全局规则） */
  Object.freeze({
    id: '2934c36b-f4df-41da-bbb5-98ea11c01b12',
    selector: '.bili-dyn-list__item',
    textSelectors: Object.freeze(['.bili-dyn-card-video__title']),
    durationSelector: '.duration-time',
    scopes: ['global'],
    mode: 'match',
  }),
  /* 新版视频卡片（搜索） */
  Object.freeze({
    id: 'builtin-bili-video-card',
    selector: 'div:has(> .bili-video-card)',
    textSelectors: Object.freeze([
      '.bili-video-card__info--tit',
      '.bili-video-card__info--author',
    ]),
    durationSelector: '',
    scopes: ['search'],
    mode: 'match',
  }),
  /* 搜索结果 UP 主卡 */
  Object.freeze({
    id: 'builtin-search-user-list',
    selector: '.user-list',
    textSelectors: Object.freeze(['.user-list .user-name']),
    durationSelector: '',
    scopes: ['search'],
    mode: 'match',
  }),
  /* UP 主空间投稿列表 */
  Object.freeze({
    id: '470d33f0-2c67-4d4d-a16c-afd035190972',
    selector: '.upload-video-card',
    textSelectors: Object.freeze([
      '.bili-video-card__title a',
      '.title',
    ]),
    durationSelector: '.bili-cover-card__stats > div:nth-child(3)',
    scopes: ['space'],
    mode: 'match',
  }),
  /* 播放器片尾推荐（历史 id 沿用，避免已装用户出现重复规则） */
  Object.freeze({
    id: 'builtin-video-page-card',
    selector: '.bpx-player-ending-related-item',
    textSelectors: Object.freeze([
      '.bpx-player-ending-related-item-title',
    ]),
    durationSelector: '',
    scopes: ['play'],
    mode: 'match',
  }),
  /* 播放页右侧小卡（历史 id 沿用） */
  Object.freeze({
    id: 'builtin-ending-related',
    selector: '.video-page-card-small',
    textSelectors: Object.freeze(['.title', '.name']),
    durationSelector: '.duration',
    scopes: ['play'],
    mode: 'match',
  }),
  /* 收藏/稍后再看列表的旧版视频卡 */
  Object.freeze({
    id: '86e17c3d-086e-42de-ae8f-6a8efb933c3d',
    selector: '.video-card',
    textSelectors: Object.freeze(['.video-card']),
    durationSelector: '',
    scopes: ['fav'],
    mode: 'match',
  }),
])
