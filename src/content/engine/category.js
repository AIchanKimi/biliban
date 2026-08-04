// 页面分类（v5.3）：由当前 URL 推导作用域分类。
// 用户可见分类：home/video/search/space；动态（t./opus）归为内部 'other'，仅全局词条生效。
// v5 行为修复保留：hideEvent 每次执行实时读取 location.href（SPA 友好）。

/**
 * @param {string | null | undefined} href
 * @returns {'home' | 'video' | 'search' | 'space' | 'other' | null} 扩展不注入的页面返回 null
 */
export function categoryFor(href) {
  if (typeof href !== 'string' || href === '') {
    return null;
  }
  if (href.includes('search.bilibili.com')) {
    return 'search';
  }
  if (href.includes('space.bilibili.com')) {
    return 'space';
  }
  if (href.includes('t.bilibili.com') || href.includes('www.bilibili.com/opus/')) {
    return 'other';
  }
  if (href.includes('www.bilibili.com')) {
    if (href.includes('/video/') || href.includes('/bangumi/')) {
      return 'video';
    }
    return 'home';
  }
  return null;
}
