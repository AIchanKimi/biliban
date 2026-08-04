import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const NONE = 'block_obj_none';

const baseConfig = rules => ({
  version: 2,
  enable: true,
  duration: { enable: false, minSeconds: 300 },
  usernames: [],
  keywords: [{ value: '匹配词', scopes: ['global'] }],
  rules,
});

test.describe('自定义规则（目标元素编辑）', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(
      toolsPage,
      baseConfig([
        { id: 'r-hide', selector: '.custom-junk', scopes: ['home'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true },
        { id: 'r-match', selector: '.custom-match-card', scopes: ['home'], mode: 'match', titleSelector: '.custom-title', userSelector: '', enabled: true },
        { id: 'r-bad', selector: '[[[invalid', scopes: ['home'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true },
      ])
    );
  });
  test.afterAll(async () => context.close());

  test('mode:hide 直接隐藏（坏选择器规则不中断其余规则）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await expect
      .poll(() => page.locator('[data-test="custom-junk"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('mode:match 经 titleSelector 命中关键字后隐藏', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await expect
      .poll(() => page.locator('[data-test="custom-match"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('禁用 mode:hide 规则后解除隐藏', async () => {
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(
      toolsPage,
      baseConfig([
        { id: 'r-hide', selector: '.custom-junk', scopes: ['home'], mode: 'hide', titleSelector: '', userSelector: '', enabled: false },
      ])
    );
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector('[data-test="custom-junk"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="custom-junk"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });
});
