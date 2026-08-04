// 页面分类（v5.2 精简）：由当前 URL 推导作用域分类。
// 用户可见分类：home/video/search；动态（t./opus）与空间页归为内部 'other'，
// 仅全局词条/规则生效（面板不提供这两个分类）。
// v5 行为修复保留：hideEvent 每次执行实时读取 location.href（SPA 友好）。

/**
 * @param {string | null | undefined} href
 * @returns {'home' | 'video' | 'search' | 'other' | null} 扩展不注入的页面返回 null
 */
export function categoryFor(href) {
  if (typeof href !== 'string' || href === '') {
    return null;
  }
  if (href.includes('search.bilibili.com')) {
    return 'search';
  }
  if (href.includes('t.bilibili.com') || href.includes('www.bilibili.com/opus/') || href.includes('space.bilibili.com')) {
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
