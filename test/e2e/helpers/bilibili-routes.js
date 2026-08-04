// fixture 劫持：把真实 bilibili URL 应答为本地静态 HTML。
// 保持真实域名，保证 engine/category.js 的 URL 分类在真实主机名上执行。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "fixtures",
);

export function fixtureHtml(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8");
}

/**
 * @param {import('@playwright/test').BrowserContext} context
 * @param {Record<string, string>} mapping host → fixture 文件名
 */
export async function setupBilibiliRoutes(context, mapping) {
  for (const [host, fixture] of Object.entries(mapping)) {
    const escaped = host.replace(/\./g, "\\.");
    await context.route(new RegExp(`^https://${escaped}/`), (route) =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: fixtureHtml(fixture),
      }),
    );
  }
}
