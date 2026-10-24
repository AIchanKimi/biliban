// 作用域（页面分类）枚举 v6.0：词条与规则统一用 scopes 数组表达生效范围。
// 分类由 engine/category.js 从当前 URL 精确推导；不匹配的页面仅全局作用域规则生效（v6.8）。
// 'global' 覆盖全部已匹配分类（及未匹配页面的全局规则）；「全局」面板管理屏蔽词、时长词条与规则。

export const SCOPES = Object.freeze([
  Object.freeze({ value: 'global', label: '全局' }),
  Object.freeze({ value: 'search', label: '搜索' }),
  Object.freeze({ value: 'space', label: '空间' }),
  Object.freeze({ value: 'play', label: '播放' }),
  Object.freeze({ value: 'fav', label: '收藏' }),
])

export const SCOPE_VALUES = Object.freeze(SCOPES.map(scope => scope.value))

// 旧版本分类迁移映射（v6 删除了 home/video/dynamics 分类）
const LEGACY_SCOPE_MAP = Object.freeze({
  home: 'play',
  video: 'play',
  dynamics: 'global',
})

/** @param {unknown} value @returns {boolean} */
export function isValidScope(value) {
  return SCOPE_VALUES.includes(value)
}

/** @param {unknown} value @returns {string} 未知值返回空串 */
export function scopeLabel(value) {
  const scope = SCOPES.find(item => item.value === value)
  return scope ? scope.label : ''
}

/**
 * 归一化 scopes：旧分类按映射表迁移，过滤非法值、去重；空结果回落 ['global']。
 * @param {unknown} scopes
 * @returns {string[]}
 */
export function normalizeScopes(scopes) {
  const source = Array.isArray(scopes)
    ? scopes
    : []
  const result = []
  for (const raw of source) {
    const value = LEGACY_SCOPE_MAP[raw] ?? raw
    if (isValidScope(value) && !result.includes(value)) {
      result.push(value)
    }
  }
  return result.length > 0
    ? result
    : ['global']
}

/**
 * scopes 是否覆盖给定页面分类。未匹配页面（category=null）不触发。
 * @param {ReadonlyArray<string>} scopes
 * @param {string | null} category categoryFor 的结果
 * @returns {boolean}
 */
export function scopesApply(scopes, category) {
  if (!category) {
    return false
  }
  return scopes.includes('global') || scopes.includes(category)
}
