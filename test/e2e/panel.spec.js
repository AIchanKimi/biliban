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

test.describe('设置面板 v2（标签页式管理）', () => {
  let context, toolsPage;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, { 'www.bilibili.com': 'video-cards.html' });
    const extensionId = await getExtensionId(context);
    toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, { version: 2, enable: true, duration: { enable: false, minSeconds: 300 }, usernames: [], keywords: [], rules: [] });
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

  test('六个分类标签齐全，默认停在「全局」', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);
    for (const [scope, label] of [['global', '全局'], ['home', '首页'], ['video', '视频页'], ['search', '搜索'], ['dynamics', '动态'], ['space', '空间']]) {
      await expect(page.locator(`#bilibiliConfig_tab_${scope}`)).toHaveText(label);
    }
    await expect(page.locator('#bilibiliConfig_tab_global')).toHaveClass(/block_obj_tab_active/);
    await expect(page.locator('#bilibiliConfig_pane_global')).toBeVisible();
    await expect(page.locator('#bilibiliConfig_pane_search')).not.toBeVisible();
    await page.close();
  });

  test('切到「搜索」添加关键字 → 仅保存：落盘 scopes=[search]，切换标签不丢未保存编辑', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);

    await page.locator('#bilibiliConfig_tab_search').click();
    await expect(page.locator('#bilibiliConfig_pane_search')).toBeVisible();

    await page.fill('#bilibiliConfig_keywordInput_search', '测试关键字');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_keywordInput_search']/following::span[text()='添加'][1]")
      .click();
    await expect(page.locator('#bilibiliConfig_keywords_search')).toContainText('测试关键字');

    // 切走再切回：未保存编辑仍在（所有分类页常驻 DOM，仅切换显隐）
    await page.locator('#bilibiliConfig_tab_global').click();
    await page.locator('#bilibiliConfig_tab_search').click();
    await expect(page.locator('#bilibiliConfig_keywords_search')).toContainText('测试关键字');

    // 用 title 锚定（闪烁期间 textContent 变化，text() 定位器会跟丢）
    const onlySave = page.locator("xpath=//span[@title='仅保存设置']");
    await onlySave.click();
    await expect(onlySave).toHaveText('已保存');
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).keywords)
      .toEqual([{ value: '测试关键字', scopes: ['search'] }]);
    await page.close();
  });

  test('取消：收起面板并在 800ms 后丢弃未保存编辑', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);
    const checkbox = page.locator('#bilibiliConfig_durationEnable');
    await expect(checkbox).not.toBeChecked();
    // Block_Obj 样式 checkbox：input 被 clip 隐藏、label::before 是可视控件，点击 label 切换
    await page.locator('label[for="bilibiliConfig_durationEnable"]').click();
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
    await page.fill('#bilibiliConfig_keywordInput_global', '/一个很长的正则,含逗号/');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_keywordInput_global']/following::span[text()='添加'][1]")
      .click();
    const chipText = page.locator('#bilibiliConfig_keywords_global .block_obj_child_text').first();
    await expect(chipText).toHaveClass(/block_obj_child_green/);
    await expect(chipText).toHaveAttribute('title', '/一个很长的正则,含逗号/');
    await expect(chipText).toContainText(' ... ');
    await page.close();
  });

  test('规则编辑器：在当前分类添加规则行 → 保存 → 落盘（scopes 取当前分类）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/');
    await openPanel(page);
    await page.locator('#bilibiliConfig_rules_global').getByText('添加规则', { exact: true }).click();
    const row = page.locator('#bilibiliConfig_rules_global .block_obj_rule_row').last();
    await row.locator('input[type="text"]').first().fill('.my-new-card');
    await row.locator('select').selectOption('hide');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).rules)
      .toEqual([
        expect.objectContaining({ selector: '.my-new-card', scopes: ['global'], mode: 'hide', enabled: true }),
      ]);
    await page.close();
  });
});
