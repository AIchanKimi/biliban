// 配置边界测试使用内存存储，不模拟浏览器 DOM。
export function mockChrome(initial = {}) {
  const store = structuredClone(initial)
  const listeners = new Set()
  const emit = (changes, area = 'local') => {
    for (const listener of listeners) listener(changes, area)
  }
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys) {
          return Object.fromEntries(
            (Array.isArray(keys)
              ? keys
              : [keys])
              .filter(key => key in store)
              .map(key => [
                key,
                structuredClone(store[key]),
              ]),
          )
        },
        async set(values) {
          const changes = {}
          for (const [key, value] of Object.entries(values)) {
            store[key] = structuredClone(value)
            changes[key] = {
              newValue: structuredClone(value),
            }
          }
          emit(changes)
        },
      },
      onChanged: {
        addListener: listener => listeners.add(listener),
        removeListener: listener => listeners.delete(listener),
      },
    },
  }
  return { store, emit }
}
