// 旧 key 迁移：regArray → keywordArray、commentRegArray → commentArray。
// 对等 Block_Obj init() 的 regConversion 合并逻辑，并修复其崩溃 bug：
// 原实现 config[key].concat(config[ori]) 在目标 key 缺失时抛 TypeError，
// 这里将缺失的目标 key 视为空数组。
import { LEGACY_MIGRATIONS } from './defaults.js';

/**
 * 应用旧 key 迁移，返回新对象（不修改入参）。
 * 迁移后 ori key 被移除（下次保存即持久化，对等原实现）。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {Record<string, unknown>}
 */
export function applyMigrations(rawConfig) {
  const result = { ...(rawConfig ?? {}) };
  for (const { key, ori } of LEGACY_MIGRATIONS) {
    const legacy = result[ori];
    if (Array.isArray(legacy)) {
      const current = Array.isArray(result[key]) ? result[key] : [];
      result[key] = [...current, ...legacy];
      delete result[ori];
    }
  }
  return result;
}
