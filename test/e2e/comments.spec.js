import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const NONE = /block_obj_none/;

const CONFIG = {
  functionEnable: true,
  commentEnable: true,
  commentKeywordEnable: true,
  convertEmojiEnable: true,
  dynamicVideo: true,
  dynamicContent: true,
  usernameEnable: true,
  keywordEnable: true,
  usernameArray: ['讨厌的UP'],
  keywordArray: ['广告'],
  commentArray: ['垃圾', '[鸡腿]'],
};

test.describe('动态与评论屏蔽（t.bilibili.com）', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 't.bilibili.com': 'dynamic-cards.html' });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, CONFIG);
    await toolsPage.close();
  });
  test.afterAll(async () => context.close());

  test('评论按用户名屏蔽', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('[data-test="comment-blocked-user"]').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });

  test('表情细节：[鸡腿] 完整中括号词经转换文本命中', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('[data-test="comment-emoji"]').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });

  test('子回复按关键字屏蔽，主评论不受影响', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('.sub-reply-item').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    const main = page.locator('[data-test="comment-with-sub"]');
    await page.waitForTimeout(300);
    await expect(main).not.toHaveClass(NONE);
    await page.close();
  });

  test('动态卡片：视频标题命中 keywordArray（dynamicVideo）', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('[data-test="dyn-title"]').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });

  test('动态卡片：正文命中 commentArray（dynamicContent）', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('[data-test="dyn-content"]').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });

  test('动态卡片：转发者在黑名单（repostUser + dynamicVideo）', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await expect.poll(() => page.locator('[data-test="dyn-repost"]').evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });

  test('正常动态与评论不被误伤', async () => {
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await page.waitForSelector('[data-test="dyn-clean"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="dyn-clean"]')).not.toHaveClass(NONE);
    await page.close();
  });
});
