import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig, readStorageKey } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const WRAP = '#blockObj_bilibiliConfig_wrapDiv';
const TRIGGER = '#blockObj_bilibiliConfig_expandSpan';

/** 模拟真实交互：鼠标移至右下角 → 触发区滑入 → 等过渡完成 → 点击打开面板 */
async function openPanel(page) {
  // 必须等触发区挂载后再移动鼠标：元素晚于鼠标就位时 mouseenter 不会补发
  await page.waitForSelector(TRIGGER);
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width - 10, viewport.height - 10);
  await expect(page.locator('.block_obj_expand_box')).toHaveClass(/block_obj_show_expand_box/);
  await page.waitForTimeout(600); // 0.5s 滑入过渡结束，按钮坐标稳定
  await page.locator(TRIGGER).click();
  await expect(page.locator(WRAP)).toHaveClass(/block_obj_show_wrap/);
}

test.describe('设置面板与悬浮触发器', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'www-home.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, { functionEnable: true });
  });
  test.afterAll(async () => context.close());

  test('鼠标移至右下角 → 触发器滑入（默认藏在屏外）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await page.waitForSelector(TRIGGER);
    const box = page.locator('.block_obj_expand_box');
    await expect(box).not.toHaveClass(/block_obj_show_expand_box/);
    await openPanel(page);
    await expect(box).toHaveClass(/block_obj_show_expand_box/);
    await page.close();
  });

  test('输入关键字 → 添加 → 仅保存：落盘且闪烁「已保存」', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);

    await page.fill('#bilibiliConfig_videoKeywordInput', '测试关键字');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_videoKeywordInput']/following::span[text()='添加'][1]")
      .click();
    await expect(page.locator('#bilibiliConfig_keywordArray')).toContainText('测试关键字');

    // 用 title 锚定（闪烁期间 textContent 变化，text() 定位器会跟丢）
    const onlySave = page.locator("xpath=//span[@title='仅保存设置']");
    await onlySave.click();
    await expect(onlySave).toHaveText('已保存');
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).keywordArray)
      .toContain('测试关键字');
    await page.close();
  });

  test('取消：收起面板并在 800ms 后丢弃未保存编辑', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);
    const checkbox = page.locator('#bilibiliConfig_whitelistEnable');
    await expect(checkbox).not.toBeChecked();
    // 原样对等 Block_Obj：input 被 clip 隐藏、label::before 是可视控件，点击 label（for 关联）切换
    await page.locator('label[for="bilibiliConfig_whitelistEnable"]').click();
    await expect(checkbox).toBeChecked();
    await page.locator("xpath=//span[text()='取消']").click();
    await expect(page.locator(WRAP)).toHaveClass(/block_obj_hidden_wrap/);
    // 重建后恢复为已保存状态
    await openPanel(page);
    await expect(checkbox).not.toBeChecked();
    await page.close();
  });

  test('正则 chip 显绿色且 >9 字符截断、title 存全值', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);
    await page.fill('#bilibiliConfig_videoKeywordInput', '/一个很长的正则,含逗号/');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_videoKeywordInput']/following::span[text()='添加'][1]")
      .click();
    const chipText = page.locator('#bilibiliConfig_keywordArray .block_obj_child_text').first();
    await expect(chipText).toHaveClass(/block_obj_child_green/);
    await expect(chipText).toHaveAttribute('title', '/一个很长的正则,含逗号/');
    await expect(chipText).toContainText(' ... ');
    await page.close();
  });
});
