import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

test.describe('多标签页同步（storage.onChanged）', () => {
  test('导入页更新配置 → 已打开的多个标签页实时屏蔽（无需刷新）', async () => {
    const context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, { functionEnable: true, keywordEnable: true, keywordArray: [] });

    const pageA = await context.newPage();
    await pageA.goto('https://www.bilibili.com/a');
    const pageB = await context.newPage();
    await pageB.goto('https://www.bilibili.com/b');
    await pageA.waitForSelector('[data-test="card-by-keyword"]');
    await pageB.waitForSelector('[data-test="card-by-keyword"]');

    // 初始无关键字：两页均不屏蔽
    await pageA.waitForTimeout(400);
    await expect(pageA.locator('[data-test="card-by-keyword"]')).not.toHaveClass(/block_obj_hidden/);
    await expect(pageB.locator('[data-test="card-by-keyword"]')).not.toHaveClass(/block_obj_hidden/);

    // 远端写入 → 两个内容脚本同时收到 onChanged
    await seedConfig(toolsPage, { functionEnable: true, keywordEnable: true, keywordArray: ['广告'] });
    await expect
      .poll(() => pageA.locator('[data-test="card-by-keyword"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    await expect
      .poll(() => pageB.locator('[data-test="card-by-keyword"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);

    await context.close();
  });
});
