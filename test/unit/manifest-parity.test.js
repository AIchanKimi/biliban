import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');

function listJsFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...listJsFiles(full));
    } else if (entry.endsWith('.js')) {
      result.push(relative(ROOT, full).split('\\').join('/'));
    }
  }
  return result;
}

describe('manifest.json 与模块树的一致性（WAR 清单漂移防护）', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const warResources = manifest.web_accessible_resources.flatMap(entry => entry.resources);

  test('content_scripts 仅声明 entry.js（classic 入口）', () => {
    expect(manifest.content_scripts[0].js).toEqual(['src/content/entry.js']);
  });

  test('src/content 下除 entry.js 外的每个模块都在 web_accessible_resources 中', () => {
    const modules = listJsFiles(CONTENT_DIR).filter(path => !path.endsWith('entry.js'));
    const missing = modules.filter(path => !warResources.includes(path));
    expect(missing).toEqual([]);
  });

  test('WAR 中不存在已删除/改名的幽灵模块', () => {
    const modules = new Set(listJsFiles(CONTENT_DIR).filter(path => !path.endsWith('entry.js')));
    const ghosts = warResources.filter(path => !modules.has(path));
    expect(ghosts).toEqual([]);
  });

  test('content_scripts matches 收窄为 v5 的 4 个子站（live/h/manga/message 已移除）', () => {
    expect(manifest.content_scripts[0].matches).toEqual([
      '*://www.bilibili.com/*',
      '*://search.bilibili.com/*',
      '*://space.bilibili.com/*',
      '*://t.bilibili.com/*',
    ]);
  });

  test('host_permissions 覆盖 API（BV→用户名查询）', () => {
    expect(manifest.host_permissions).toContain('https://api.bilibili.com/*');
  });

  test('run_at 为 document_start（对等 @run-at document-start）', () => {
    expect(manifest.content_scripts[0].run_at).toBe('document_start');
    expect(manifest.content_scripts[0].all_frames).toBe(false);
  });
});
