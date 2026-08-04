import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes, setupApiRoute } from './helpers/bilibili-routes.js';

test.describe('BV → 用户名异步查询（c:2 规则）', () => {
  test('查询到的 UP 名命中黑名单后卡片隐藏，并持久化 infoRecord', async () => {
    const context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    await setupApiRoute(context, { ownerName: '异步UP' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, {
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [{ value: '异步UP', scopes: ['global'] }],
      keywords: [],
      rules: [],
    });

    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-c2-first"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await expect
      .poll(() => page.locator('[data-test="card-c2-second"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);

    const infoRecord = await readStorageKey(toolsPage, 'infoRecord');
    expect(infoRecord.length).toBe(2);
    expect(infoRecord.map(r => r.user)).toEqual(['异步UP', '异步UP']);
    expect(infoRecord[0].time).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await context.close();
  });

  test('非 200 响应触发 sendStatus 闩锁：后续请求不再发出', async () => {
    const context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    let requestCount = 0;
    await setupApiRoute(context, { status: 412, onRequest: () => requestCount++ });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, {
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [{ value: '异步UP', scopes: ['global'] }],
      keywords: [],
      rules: [],
    });

    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector('[data-test="card-c2-second"]');
    await page.waitForTimeout(1500); // 两卡的节流窗口 0ms + 100ms 均过
    expect(requestCount).toBe(1); // 第二张卡的请求被闩锁拦下
    await expect(page.locator('[data-test="card-c2-first"]')).not.toHaveClass(/block_obj_none/);
    await context.close();
  });
});
