// 作用域（页面分类）枚举 v5.3：词条与规则统一用 scopes 数组表达生效范围。
// 5 类（动态页由引擎归为 'other'，仅全局词条生效；空间为用户常用页面，v5.3 回归）。
// 分类由 engine/category.js 从当前 URL 推导；'global' 处处生效。

export const SCOPES = Object.freeze([
  Object.freeze({ value: 'global', label: '全局' }),
  Object.freeze({ value: 'home', label: '首页' }),
  Object.freeze({ value: 'video', label: '视频页' }),
  Object.freeze({ value: 'search', label: '搜索' }),
  Object.freeze({ value: 'space', label: '空间' }),
]);

export const SCOPE_VALUES = Object.freeze(SCOPES.map(scope => scope.value));

/** @param {unknown} value @returns {boolean} */
export function isValidScope(value) {
  return SCOPE_VALUES.includes(value);
}

/** @param {unknown} value @returns {string} 未知值返回空串 */
export function scopeLabel(value) {
  const scope = SCOPES.find(item => item.value === value);
  return scope ? scope.label : '';
}

/**
 * 归一化 scopes：过滤非法值、去重；空结果回落 ['global']。
 * （旧数据中的 dynamics/space 等已废弃分类在此自然回落为 global。）
 * @param {unknown} scopes
 * @returns {string[]}
 */
export function normalizeScopes(scopes) {
  const source = Array.isArray(scopes) ? scopes : [];
  const result = [];
  for (const value of source) {
    if (isValidScope(value) && !result.includes(value)) {
      result.push(value);
    }
  }
  return result.length > 0 ? result : ['global'];
}

/**
 * scopes 是否覆盖给定页面分类。
 * @param {ReadonlyArray<string>} scopes
 * @param {string | null} category categoryFor 的结果（null=扩展不作用的页面）
 * @returns {boolean}
 */
export function scopesApply(scopes, category) {
  if (!category) {
    return false;
  }
  return scopes.includes('global') || scopes.includes(category);
}
