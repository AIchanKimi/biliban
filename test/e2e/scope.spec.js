import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes, setupApiRoute } from './helpers/bilibili-routes.js';

const NONE = 'block_obj_none'; // method 0：display 类

const V4_CONFIG = {
  version: 4,
  enable: true,
  words: [
    { value: '讨厌的UP', scopes: ['global'] }, // UP主名精确匹配
    { value: '广告UP', scopes: ['global'] },
    { value: '广告', scopes: ['global'] }, // 标题包含匹配
    { value: '搜索专属词', scopes: ['search'] },
    { value: '动态广告', scopes: ['global'] }, // v5.2：动态页由全局词条覆盖
  ],
  durations: [],
  rules: [],
};

test.describe('作用域与内置规则', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, {
      'www.bilibili.com': 'video-cards.html',
      'search.bilibili.com': 'search.html',
      't.bilibili.com': 'dynamic-cards.html',
      'space.bilibili.com': 'space.html',
    });
    await setupApiRoute(context, { ownerName: '正常UP' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, V4_CONFIG);
  });
  test.afterAll(async () => context.close());

  test('全局关键字在 www 屏蔽（新版卡片结构，method 0）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-by-keyword"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await expect(page.locator('[data-test="card-by-keyword"]')).toBeAttached();
    await page.close();
  });

  test('全局用户名屏蔽 + 正常卡片不受影响', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-by-user"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.waitForSelector('[data-test="card-clean"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-clean"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('search 作用域关键字在搜索页命中', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await expect
      .poll(() => page.locator('[data-test="search-card-scoped"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    // 搜索页全局词同样生效
    await expect
      .poll(() => page.locator('[data-test="search-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('search 作用域关键字在 www 不命中', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector('[data-test="card-scoped"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-scoped"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('搜索页 UP 主卡（.user-list）按文字屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://search.bilibili.com/all?keyword=test');
    await expect
      .poll(() => page.locator('[data-test="search-user-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.waitForSelector('[data-test="search-user-clean"]');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-test="search-user-clean"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('space 作用域（v5.3 回归）：空间页卡片被全局词屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://space.bilibili.com/123/video');
    await expect
      .poll(() => page.locator('[data-test="space-card-ad"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.waitForSelector('[data-test="space-card-clean"]');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-test="space-card-clean"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('动态页（other 分类）由全局词条覆盖：标题关键字与作者用户名', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect
      .poll(() => page.locator('[data-test="dyn-by-title"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await expect
      .poll(() => page.locator('[data-test="dyn-by-user"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.waitForSelector('[data-test="dyn-clean"]');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-test="dyn-clean"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });
});

test.describe('首页特殊逻辑（轮播/排行榜）', () => {
  test('轮播三联 method 3（inline visibility）+ 排行榜按用户名', async () => {
    const context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'www-home.html' });
    await setupApiRoute(context, { ownerName: '正常UP' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, {
      version: 4,
      enable: true,
      words: [
        { value: '某排行榜UP', scopes: ['global'] },
        { value: '广告', scopes: ['global'] },
      ],
      rules: [],
    });

    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    // 轮播：命中的第二联（title/pic/trig）inline visibility hidden
    await expect
      .poll(() =>
        page.locator('.carousel-module ul.title a').nth(1).evaluate(el => el.style.visibility)
      )
      .toBe('hidden');
    await expect
      .poll(() => page.locator('.carousel-module ul.pic li').nth(1).evaluate(el => el.style.visibility))
      .toBe('hidden');
    // 未命中的第一联不受影响
    await expect
      .poll(() => page.locator('.carousel-module ul.title a').nth(0).evaluate(el => el.style.visibility))
      .not.toBe('hidden');
    // 排行榜：用户名命中 → display 类
    await expect
      .poll(() => page.locator('.rank-item').first().evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await context.close();
  });
});
