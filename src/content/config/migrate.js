import { BUILTIN_RULES } from '../rules/builtin-rules.js'
// 扩展配置迁移：v2 / v3 / v4 → v5。备份与写回由 store.loadConfig 负责。
// v2 → v3 语义：usernames 与 keywords 合并为 words。
// v3 → v4：全局 duration 开关转为一条时长词条 {op:'lt', seconds, scopes:['global']}（关闭则无）。
// v4 → v5：取消 builtinRules 双轨——内置规则并入 rules，与自定义规则完全同构。
import {
  BUILTIN_RULES_VERSION,
  CONFIG_VERSION,
  DEFAULT_CONFIG,
} from './defaults.js'

/**
 * @param {unknown} rawConfig
 * @returns {boolean} 已是当前版本形状
 */
export function isCurrentVersion(rawConfig) {
  return Boolean(rawConfig) && rawConfig.version === CONFIG_VERSION
}

/**
 * 词条列表按 值+作用域集合 去重（首次出现保留）。
 * @param {Array<{ value: unknown, scopes?: unknown }>} entries
 * @returns {Array<{ value: unknown, scopes: unknown }>}
 */
function dedupeEntries(entries) {
  const seen = new Set()
  const result = []
  for (const entry of entries) {
    const scopes = Array.isArray(entry.scopes)
      ? entry.scopes
      : ['global']
    const key = JSON.stringify([
      entry.value,
      [...scopes].sort(),
    ])
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ value: entry.value, scopes })
    }
  }
  return result
}

/** v2/v3 词条对象数组 → 词条（宽松强制，normalize 再精修） */
function fromObjectList(list) {
  const source = Array.isArray(list)
    ? list
    : []
  return source.filter(
    entry => entry && typeof entry.value === 'string' && entry.value !== '',
  )
}

/** v3 的全局 duration 开关 → 时长词条数组 */
function durationFromV3(duration) {
  if (!duration || typeof duration !== 'object' || !duration.enable) {
    return []
  }
  const min = Number(duration.minSeconds)
  if (!Number.isFinite(min) || min <= 0) {
    return []
  }
  return [
    {
      op: 'lt',
      seconds: min,
      scopes: ['global'],
    },
  ]
}

/**
 * 规则统一合并（v5）：内置规则与自定义规则并入同一列表。
 * - v4 持久化过 builtinRules → 以它为准（用户编辑过的内置规则保留）
 * - 否则以代码默认 BUILTIN_RULES 为底
 * - 内置集版本落后时按 id 补入代码中新增的内置规则（不覆盖同名已有规则）
 * - 内置在前、自定义在后，按 id 去重（先出现者优先）
 * @param {unknown} customRules
 * @param {unknown} storedBuiltins
 * @param {unknown} storedBuiltinVersion
 * @returns {Array<object>}
 */
export function mergeRulesWithBuiltins(
  customRules,
  storedBuiltins,
  storedBuiltinVersion,
) {
  const builtinBase = Array.isArray(storedBuiltins)
    ? [...storedBuiltins]
    : [...BUILTIN_RULES]
  if (storedBuiltinVersion !== BUILTIN_RULES_VERSION) {
    for (const rule of BUILTIN_RULES) {
      if (!builtinBase.some(item => item && item.id === rule.id)) {
        builtinBase.push(rule)
      }
    }
  }
  const merged = [
    ...builtinBase,
    ...(Array.isArray(customRules)
      ? customRules
      : []),
  ]
  const seen = new Set()
  const result = []
  for (const rule of merged) {
    if (!rule || !rule.id || seen.has(rule.id)) {
      continue
    }
    seen.add(rule.id)
    result.push(rule)
  }
  return result
}

/**
 * 空存储时的种子配置：DEFAULT_CONFIG 的开关/词条/时长 + 代码内置规则。
 * 只用于首次载入（存储中尚无配置）；已有配置与用户删除过的词条不会被重新灌入。
 * 种子里的规则优先于同 id 的内置规则（便于把调好的选择器作为默认值），
 * 仅补入种子中不存在的内置规则，保证扩展升级后新增内置规则仍会到位。
 * @param {Readonly<{ enable?: boolean, words?: unknown, durations?: unknown, rules?: unknown }>} [defaults]
 * @returns {{ version: number, enable: boolean, words: Array<object>, durations: Array<object>, rules: Array<object> }}
 */
export function buildSeedConfig(defaults = DEFAULT_CONFIG) {
  const seedRules = Array.isArray(defaults.rules)
    ? defaults.rules.filter(rule => rule && rule.id)
    : []
  const seedIds = new Set(seedRules.map(rule => rule.id))
  return {
    version: CONFIG_VERSION,
    enable: defaults.enable ?? true,
    words: Array.isArray(defaults.words)
      ? [...defaults.words]
      : [],
    durations: Array.isArray(defaults.durations)
      ? [...defaults.durations]
      : [],
    rules: [
      ...seedRules,
      ...BUILTIN_RULES.filter(rule => !seedIds.has(rule.id)),
    ],
  }
}

/**
 * 扩展旧版本配置 → v5（不修改入参）；不接受无版本或不支持的格式。
 * @param {Record<string, unknown> | null | undefined} rawConfig
 * @returns {{ version: number, enable: boolean, words: Array<object>, durations: Array<object>, rules: Array<object> }}
 */
export function migrateToLatest(rawConfig) {
  const source = rawConfig ?? {}
  if (source.version === 4) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      words: dedupeEntries(fromObjectList(source.words)),
      durations: Array.isArray(source.durations)
        ? source.durations
        : [],
      rules: mergeRulesWithBuiltins(
        source.rules,
        source.builtinRules,
        source.builtinVersion,
      ),
    }
  }
  if (source.version === 3) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      words: dedupeEntries(fromObjectList(source.words)),
      durations: durationFromV3(source.duration),
      rules: mergeRulesWithBuiltins(source.rules, undefined, undefined),
    }
  }
  if (source.version === 2) {
    return {
      version: CONFIG_VERSION,
      enable: source.enable ?? true,
      words: dedupeEntries([
        ...fromObjectList(source.usernames),
        ...fromObjectList(source.keywords),
      ]),
      durations: durationFromV3(source.duration),
      rules: mergeRulesWithBuiltins(source.rules, undefined, undefined),
    }
  }
  throw new Error(`不支持的配置版本：${String(source.version)}`)
}
