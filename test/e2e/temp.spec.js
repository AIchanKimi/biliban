import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const WRAP = '#blockObj_bilibiliConfig_wrapDiv';
const TRIGGER = '#blockObj_bilibiliConfig_expandSpan';
const NONE = 'block_obj_none';
const TEMP_KEY = 'bilibili_temp_entries';
const HOUR = 3600_000;

async function openPanel(page) {
  await page.waitForSelector(TRIGGER);
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width - 10, viewport.height - 10);
  await expect(page.locator('.block_obj_expand_box')).toHaveClass(/block_obj_show_expand_box/);
  await page.waitForTimeout(600);
  await page.locator(TRIGGER).click();
  await expect(page.locator(WRAP)).toHaveClass(/block_obj_show_wrap/);
}

async function addTempKeyword(page, value) {
  await page.locator('#bilibiliConfig_tab_search').click();
  await page.fill('#bilibiliConfig_wordInput_search', value);
  await page.check('#bilibiliConfig_wordTemp_search');
  await page
    .locator("xpath=//input[@id='bilibiliConfig_wordInput_search']/following::span[text()='添加'][1]")
    .click();
}

test.describe('临时屏蔽（过期制，固定 1 小时）', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'search.bilibili.com': 'search.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, {
      version: 4,
      enable: true,
      words: [],
      durations: [],
      rules: [],
    });
  });
  test.afterAll(async () => context.close());

  test('面板添加临时词 → 保存后立即屏蔽，落在独立存储键而非配置', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await openPanel(page);
    await addTempKeyword(page, '广告');
    await expect(page.locator('#bilibiliConfig_words_search .block_obj_child_badge_temp')).toHaveText('临时');
    await page.locator("xpath=//span[@title='仅保存设置']").click();

    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    // 持久配置中无该词；独立键中带 expiresAt（v6.5 固定 1 小时后）
    const stored = await readStorageKey(toolsPage, 'bilibili_config');
    expect(stored.words).toEqual([]);
    const tempStored = await readStorageKey(toolsPage, TEMP_KEY);
    expect(tempStored.length).toBe(1);
    expect(tempStored[0].value).toBe('广告');
    expect(tempStored[0].expiresAt).toBeGreaterThan(Date.now() + 0.9 * HOUR);
    expect(tempStored[0].expiresAt).toBeLessThanOrEqual(Date.now() + HOUR + 5000);
    await page.close();
  });

  test('刷新页面后临时词仍然生效（不再随刷新消失）', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.reload();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('过期词条自动失效并被清除', async () => {
    // 直接写入一条已过期的临时词（替换全部）
    await toolsPage.evaluate(
      async ([key, entry]) => chrome.storage.local.set({ [key]: [entry] }),
      [TEMP_KEY, { kind: 'word', value: '广告', scopes: ['search'], expiresAt: Date.now() - 1000 }]
    );
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await page.waitForSelector('[data-test="search-card-ad"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="search-card-ad"]')).not.toHaveClass(new RegExp(NONE));
    // 过期项被 prune 写回清除
    await expect
      .poll(async () => ((await readStorageKey(toolsPage, TEMP_KEY)) ?? []).length)
      .toBe(0);
    await page.close();
  });

  test('「清空临时词」立即解除屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await openPanel(page);
    await addTempKeyword(page, '广告');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);

    // v6.4：「清空临时词」上收至页脚，作用于当前分类标签
    await page.locator(WRAP).getByText('清空临时词', { exact: true }).click();
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(false);
    await page.close();
  });
});
