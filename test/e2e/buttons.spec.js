import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

test.describe('评论区注入按钮', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 't.bilibili.com': 'dynamic-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
  });
  test.afterAll(async () => context.close());

  test('屏蔽按钮：注入、点击秒屏蔽、落盘用户名', async () => {
    await seedConfig(toolsPage, {
      functionEnable: true,
      commentEnable: true,
      showBlockUserBtnEnable: true,
      usernameArray: [],
    });
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    const emojiComment = page.locator('[data-test="comment-emoji"]');
    const blockBtn = emojiComment.locator('.bilibili_comment_user_block_button');
    await expect(blockBtn).toBeAttached();
    await expect(blockBtn).toHaveText('屏蔽');

    await expect(emojiComment).not.toHaveClass(/block_obj_none/);
    await blockBtn.click();
    // 点击即屏蔽 + 落盘
    await expect.poll(() => emojiComment.evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).usernameArray)
      .toContain('正常用户');
    await page.close();
  });

  test('开关关闭后移除已注入按钮', async () => {
    await seedConfig(toolsPage, {
      functionEnable: true,
      commentEnable: true,
      showBlockUserBtnEnable: false,
      usernameArray: [],
    });
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    await page.waitForSelector('.reply-list .reply-item');
    await page.waitForTimeout(500);
    expect(await page.locator('.bilibili_comment_user_block_button').count()).toBe(0);
    await page.close();
  });
});
