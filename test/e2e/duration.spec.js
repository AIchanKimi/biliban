import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const HIDDEN = 'block_obj_hidden'; // .video-card-common 规则 method 1

const baseConfig = durations => ({
  version: 4,
  enable: true,
  words: [],
  durations,
  rules: [],
});

test.describe('时长按蔽（词条化）', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, baseConfig([{ op: 'lt', seconds: 60, scopes: ['global'] }]));
  });
  test.afterAll(async () => context.close());

  test('「短于 1 分钟」词条：短卡片隐藏，长卡片保留', async () => {
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

  test('改小阈值后原被屏蔽的卡片恢复（每轮重算比较）', async () => {
    await seedConfig(toolsPage, baseConfig([{ op: 'lt', seconds: 10, scopes: ['global'] }]));
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector('[data-test="card-short"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="card-short"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('「长于」词条：长卡片隐藏，短卡片保留', async () => {
    await seedConfig(toolsPage, baseConfig([{ op: 'gt', seconds: 600, scopes: ['global'] }]));
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await expect
      .poll(() => page.locator('[data-test="card-long"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    await page.waitForSelector('[data-test="card-short"]');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-test="card-short"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('清空词条后全部恢复', async () => {
    await seedConfig(toolsPage, baseConfig([]));
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector('[data-test="card-short"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="card-short"]')).not.toHaveClass(new RegExp(HIDDEN));
    await expect(page.locator('[data-test="card-long"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });
});
