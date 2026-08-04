import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const HIDDEN = 'block_obj_hidden'; // .video-card-common 规则 method 1

const baseConfig = duration => ({
  version: 3,
  enable: true,
  duration,
  words: [],
  rules: [],
});

test.describe('时长按蔽', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, baseConfig({ enable: true, minSeconds: 60 }));
  });
  test.afterAll(async () => context.close());

  test('短于阈值的卡片隐藏，长于阈值的保留', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await expect
      .poll(() => page.locator('[data-test="card-short"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    await page.waitForSelector('[data-test="card-long"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-long"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('调小阈值后原被屏蔽的卡片恢复（每轮重算比较）', async () => {
    await seedConfig(toolsPage, baseConfig({ enable: true, minSeconds: 10 }));
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector('[data-test="card-short"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="card-short"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('关闭时长按蔽后全部恢复', async () => {
    await seedConfig(toolsPage, baseConfig({ enable: false, minSeconds: 60 }));
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector('[data-test="card-short"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="card-short"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });
});
