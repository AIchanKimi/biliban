// E2E 助手：以 --load-extension 启动 Edge persistent context，发现扩展 id，
// 经真实导入页（import-export.html）播种/读取 chrome.storage。
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXTENSION_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export async function launchContext() {
  // 扩展加载走 Chromium new headless（无窗口且支持 --load-extension）；
  // 调试时 E2E_HEADED=1 bun run e2e 可打开可见窗口。
  const headed = Boolean(process.env.E2E_HEADED);
  return chromium.launchPersistentContext('', {
    headless: false,
    channel: 'msedge',
    acceptDownloads: true,
    args: [
      ...(headed ? [] : ['--headless=new']),
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--disable-popup-blocking',
    ],
  });
}

/** 通过任意被注入页面的 data-biliban-id 属性发现扩展 id */
export async function getExtensionId(context, probeUrl = 'https://www.bilibili.com/') {
  const page = await context.newPage();
  await page.goto(probeUrl);
  const id = await page.evaluate(() => document.documentElement.getAttribute('data-biliban-id'));
  await page.close();
  if (!id) {
    throw new Error('扩展未注入：content script entry 没有执行');
  }
  return id;
}

/** 打开导入页（保留页面引用供后续读取存储） */
export async function openToolsPage(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/tools/import-export.html`);
  return page;
}

/** 经真实导入路径写入 bilibili_config（同时验证迁移工具） */
export async function seedConfig(toolsPage, config) {
  await toolsPage.fill('#data', JSON.stringify(config));
  await toolsPage.click('#import');
  await toolsPage.waitForSelector('#status:has-text("导入成功")');
}

/** 在扩展页上下文中读取 storage key */
export async function readStorageKey(toolsPage, key) {
  return toolsPage.evaluate(async k => {
    const stored = await chrome.storage.local.get(k);
    return stored[k];
  }, key);
}
