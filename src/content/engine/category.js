// 页面分类（v5）：由当前 URL 推导作用域分类。
// v5 行为修复：hideEvent 每次执行实时读取 location.href（v4 只在启动时捕获一次，
// 导致首页 SPA 跳进视频页后 video 作用域规则永不生效）。

/**
 * @param {string | null | undefined} href
 * @returns {'home' | 'video' | 'search' | 'dynamics' | 'space' | null} 扩展不注入的页面返回 null
 */
export function categoryFor(href) {
  if (typeof href !== 'string' || href === '') {
    return null;
  }
  if (href.includes('search.bilibili.com')) {
    return 'search';
  }
  if (href.includes('t.bilibili.com')) {
    return 'dynamics';
  }
  if (href.includes('space.bilibili.com')) {
    return 'space';
  }
  if (href.includes('www.bilibili.com')) {
    if (href.includes('www.bilibili.com/opus/')) {
      return 'dynamics';
    }
    if (href.includes('/video/') || href.includes('/bangumi/')) {
      return 'video';
    }
    return 'home';
  }
  return null;
}
