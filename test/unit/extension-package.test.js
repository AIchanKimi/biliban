import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
function modules(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = join(dir, item.name)
    return item.isDirectory()
      ? modules(full)
      : item.name.endsWith('.js')
        ? [
            relative(root, full),
          ]
        : []
  })
}
test('扩展打包：所有内容脚本模块可被加载，清单中没有失效路径', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
  const exposed = manifest.web_accessible_resources.flatMap(item => item.resources)
  const contentScripts = manifest.content_scripts.flatMap(item => item.js)
  const actual = modules(join(root, 'src/content'))
  expect([
    ...exposed,
    ...contentScripts,
  ].sort()).toEqual(actual.sort())
})
