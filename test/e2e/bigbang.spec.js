import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

test.describe('「爆炸」按钮与大爆炸弹窗', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 't.bilibili.com': 'dynamic-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
  });
  test.afterAll(async () => context.close());

  test('拆字选择 → 添加 → commentArray 落盘并生效', async () => {
    await seedConfig(toolsPage, {
      functionEnable: true,
      commentEnable: true,
      commentKeywordEnable: true,
      convertEmojiEnable: true,
      showBangBtnEnable: true,
      commentArray: [],
    });
    const page = await context.newPage();
    await page.goto('https://t.bilibili.com/');
    const emojiComment = page.locator('[data-test="comment-emoji"]');
    const bangBtn = emojiComment.locator('.bilibili_comment_bang_button');
    await expect(bangBtn).toBeAttached();
    await bangBtn.click();

    // 弹窗打开：评论原文转换后 '送你[鸡腿]' → 去空白拆字
    const overlay = page.locator('.block_obj_presentation_div');
    await expect(overlay).toBeAttached();
    await expect(page.locator('.block_obj_big_bang_h3')).toHaveText('大爆炸');
    const pills = page.locator('.block_obj_big_bang_text');
    expect(await pills.count()).toBeGreaterThanOrEqual(2);

    // 选中前两个字（连续 → 单段）
    await pills.nth(0).click();
    await pills.nth(1).click();
    await page.locator('.block_obj_big_bang_add_btn').click();
    await expect(overlay).not.toBeAttached();

    const added = (await readStorageKey(toolsPage, 'bilibili_config')).commentArray;
    expect(added.length).toBe(1);
    // 新词生效后评论被屏蔽
    await expect.poll(() => emojiComment.evaluate(el => el.classList.contains('block_obj_none'))).toBe(true);
    await page.close();
  });
});
