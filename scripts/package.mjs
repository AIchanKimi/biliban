import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { zipSync } from 'fflate'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = name => readFileSync(join(root, name))
const manifest = JSON.parse(read('manifest.json'))
const pkg = JSON.parse(read('package.json'))
if (pkg.version !== manifest.version)
  throw new Error('package.json 与 manifest.json 版本不一致')
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${manifest.version}`)
  throw new Error('版本标签必须与 manifest.json 一致，例如 v6.9.0')

// 白名单收集：测试、node_modules、个人 JSON 和开发配置都不会进入分发包。
const files = {}
function collect(directory) {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const name = `${directory}/${entry.name}`
    if (entry.isDirectory())
      collect(name)
    else if (entry.isFile())
      files[name] = read(name)
  }
}
collect('src/content')
collect('icons')
collect('docs/images')
for (const name of [
  'manifest.json',
  'README.md',
  'LICENSE',
  'NOTICE',
]) files[name] = read(name)
const references = [
  ...manifest.content_scripts.flatMap(script => script.js),
  ...manifest.web_accessible_resources.flatMap(resource => resource.resources),
  ...Object.values(manifest.icons),
]
for (const name of references) {
  if (!files[name])
    throw new Error(`分发包缺少 manifest 引用：${name}`)
}
const filename = `biliban-${manifest.version}.zip`
const target = join(root, 'dist', filename)
mkdirSync(dirname(target), { recursive: true })
const archive = Buffer.from(zipSync(files, { level: 9 }))
writeFileSync(target, archive)
const digest = createHash('sha256').update(archive).digest('hex')
writeFileSync(`${target}.sha256`, `${digest}  ${filename}\n`)
console.info(`${relative(root, target)} (${Object.keys(files).length} files, ${archive.length} bytes)`)
