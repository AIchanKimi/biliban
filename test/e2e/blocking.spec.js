import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const HIDDEN = 'block_obj_hidden'; // method 1：visibility 类
const NONE = 'block_obj_none'; // method 0：display 类

const BASE_CONFIG = {
  functionEnable: true,
  usernameEnable: true,
  keywordEnable: true,
  usernameArray: ['讨厌的UP', '广告UP'],
  keywordArray: ['广告', '/隐藏正则/'],
};

test.describe('视频卡片屏蔽（www）', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, BASE_CONFIG);
  });
  test.afterAll(async () => context.close());

  test('按用户名屏蔽（method 1 → visibility 类，保留布局）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-by-user"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    await expect(page.locator('[data-test="card-by-user"]')).toBeAttached(); // 不从 DOM 移除
    await page.close();
  });

  test('按关键字屏蔽标题', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-by-keyword"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    await page.close();
  });

  test('正常卡片不被屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector('.video-card-common');
    await page.waitForTimeout(500); // 等待屏蔽引擎首跑完成
    await expect(page.locator('[data-test="card-clean"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('c:1 用户名去前缀（up主：讨厌的UP → 讨厌的UP）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-c1"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('liveEnable 关闭时直播卡片不屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector('.live-card');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-live"]')).not.toHaveClass(new RegExp(HIDDEN));
    await page.close();
  });

  test('白名单优先于黑名单（远端同步实时生效）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="card-by-user"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(true);
    // 从导入页更新配置：启用白名单并加入 广告UP → onChanged 实时推送，无需刷新
    await seedConfig(toolsPage, { ...BASE_CONFIG, whitelistEnable: true, whitelistArray: ['广告UP'] });
    await expect
      .poll(() => page.locator('[data-test="card-by-user"]').evaluate(el => el.classList.contains('block_obj_hidden')))
      .toBe(false);
    await page.close();
  });

  test('存储形状与 Tampermonkey 兼容（正则存 /pattern/flags 字符串）', async () => {
    await seedConfig(toolsPage, { ...BASE_CONFIG, keywordArray: ['广告', '/a,b/i'] });
    const stored = await readStorageKey(toolsPage, 'bilibili_config');
    expect(stored.keywordArray).toEqual(['广告', '/a,b/i']);
    expect(typeof stored.functionEnable).toBe('boolean');
  });
});
