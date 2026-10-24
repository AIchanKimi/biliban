// 页面分类（v6.0）：由当前 URL 精确推导，不匹配的页面扩展不触发。
//   搜索: search.bilibili.com/*
//   空间: space.bilibili.com/{uid}/upload/video
//   播放: www.bilibili.com/video/*、/bangumi/*、/list/ml*、/list/watchlater*
//   收藏: www.bilibili.com/watchlater/*、space.bilibili.com/{uid}/favlist/*
// 其他页面（首页 feed、频道、动态等）返回 null → 仅全局作用域规则生效（v6.8，如顶栏悬浮窗）。
// hideEvent 每次执行实时读取 location.href（SPA 友好）。

/**
 * @param {string | null | undefined} href
 * @returns {'search' | 'space' | 'play' | 'fav' | null} 未匹配页面返回 null
 */
export function categoryFor(href) {
  if (typeof href !== 'string' || href === '') {
    return null
  }
  let url
  try {
    url = new URL(href)
  }
  catch {
    return null
  }
  const path = url.pathname
  if (url.hostname === 'search.bilibili.com') {
    return 'search'
  }
  if (url.hostname === 'space.bilibili.com') {
    if (/^\/\d+\/upload\/video(?:\/|$)/.test(path)) {
      return 'space'
    }
    if (/^\/\d+\/favlist(?:\/|$)/.test(path)) {
      return 'fav'
    }
    return null
  }
  if (url.hostname === 'www.bilibili.com') {
    // 注意顺序：/list/watchlater 属「播放」，/watchlater 属「收藏」
    if (path.startsWith('/video/') || path.startsWith('/bangumi/')) {
      return 'play'
    }
    if (path.startsWith('/list/watchlater') || path.startsWith('/list/ml')) {
      return 'play'
    }
    if (path.startsWith('/watchlater')) {
      return 'fav'
    }
    return null
  }
  return null
}
