// fixture 劫持：把真实 bilibili URL 应答为本地静态 HTML。
// OLD_URL 与全部 URL 门控/正则保持真实（localhost 端口会破坏 message#/reply、live/\d+ 等门控）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures');

export function fixtureHtml(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8');
}

/**
 * @param {import('@playwright/test').BrowserContext} context
 * @param {Record<string, string>} mapping host → fixture 文件名
 */
export async function setupBilibiliRoutes(context, mapping) {
  for (const [host, fixture] of Object.entries(mapping)) {
    const escaped = host.replace(/\./g, '\\.');
    await context.route(new RegExp(`^https://${escaped}/`), route =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: fixtureHtml(fixture),
      })
    );
  }
}

/**
 * 拦截 BV→用户名 API。
 * @param {import('@playwright/test').BrowserContext} context
 * @param {{ status?: number, ownerName?: string, onRequest?: () => void }} options
 */
export async function setupApiRoute(context, { status = 200, ownerName = '异步UP', onRequest } = {}) {
  await context.route('https://api.bilibili.com/x/web-interface/view**', route => {
    onRequest?.();
    if (status !== 200) {
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code: -412 }) });
    }
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: { owner: { name: ownerName } } }),
    });
  });
}
