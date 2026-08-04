import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const WRAP = '#blockObj_bilibiliConfig_wrapDiv';
const TRIGGER = '#blockObj_bilibiliConfig_expandSpan';
const NONE = 'block_obj_none';

async function openPanel(page) {
  await page.waitForSelector(TRIGGER);
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width - 10, viewport.height - 10);
  await expect(page.locator('.block_obj_expand_box')).toHaveClass(/block_obj_show_expand_box/);
  await page.waitForTimeout(600);
  await page.locator(TRIGGER).click();
  await expect(page.locator(WRAP)).toHaveClass(/block_obj_show_wrap/);
}

async function addTempKeyword(page, value, scope) {
  await page.fill('#bilibiliConfig_keywordInput', value);
  await page.selectOption('#bilibiliConfig_keywordScope', scope);
  await page.check('#bilibiliConfig_keywordTemp');
  await page
    .locator("xpath=//input[@id='bilibiliConfig_keywordInput']/following::span[text()='添加'][1]")
    .click();
}

test.describe('临时屏蔽（仅标签页内存）', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'search.bilibili.com': 'search.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, {
      version: 2,
      enable: true,
      duration: { enable: false, minSeconds: 300 },
      usernames: [],
      keywords: [],
      rules: [],
    });
  });
  test.afterAll(async () => context.close());

  test('面板添加临时词 → 保存后立即屏蔽，且不落盘', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await openPanel(page);
    await addTempKeyword(page, '广告', 'search');
    // chip 带临时徽标
    await expect(page.locator('#bilibiliConfig_keywords .block_obj_child_badge_temp')).toHaveText('临时');
    await page.locator("xpath=//span[@title='仅保存设置']").click();

    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    // 存储中无该词（临时不落盘）
    const stored = await readStorageKey(toolsPage, 'bilibili_config');
    expect(stored.keywords).toEqual([]);
    await page.close();
  });

  test('刷新页面后临时词失效', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await openPanel(page);
    await addTempKeyword(page, '广告', 'search');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);

    await page.reload();
    await page.waitForSelector('[data-test="search-card-ad"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="search-card-ad"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('「清空临时词」立即解除屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await openPanel(page);
    await addTempKeyword(page, '广告', 'search');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);

    // 关键字组的清空按钮是第二个
    await page.locator("xpath=(//span[text()='清空临时词'])[2]").click();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(false);
    await page.close();
  });
});
