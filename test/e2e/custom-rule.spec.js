import { test, expect } from '@playwright/test';
import { launchContext, getExtensionId, openToolsPage, seedConfig } from './helpers/extension.js';
import { setupBilibiliRoutes } from './helpers/bilibili-routes.js';

const NONE = 'block_obj_none';

const baseConfig = rules => ({
  version: 4,
  enable: true,
  words: [{ value: '匹配词', scopes: ['global'] }],
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
        { id: 'r-hide', selector: '.custom-junk', scopes: ['play'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true },
        { id: 'r-match', selector: '.custom-match-card', scopes: ['play'], mode: 'match', textSelectors: ['.custom-title'], userSelector: '', enabled: true },
        { id: 'r-bad', selector: '[[[invalid', scopes: ['play'], mode: 'hide', titleSelector: '', userSelector: '', enabled: true },
      ])
    );
  });
  test.afterAll(async () => context.close());

  test('mode:hide 直接隐藏（坏选择器规则不中断其余规则）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="custom-junk"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('mode:match 经 titleSelector 命中关键字后隐藏', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="custom-match"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('match 规则启用开关保存后立即生效，无需刷新', async () => {
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, baseConfig([
      { id: 'r-match', selector: '.custom-match-card', scopes: ['play'], mode: 'match', textSelectors: ['.custom-title'], durationSelector: '', enabled: true },
    ]));

    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await expect
      .poll(() => page.locator('[data-test="custom-match"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);

    // 打开面板 → 播放标签 → 关闭 r-match 启用 → 仅保存 → 不刷新即解除
    await page.waitForSelector('#blockObj_bilibiliConfig_expandSpan');
    const vp = page.viewportSize();
    await page.mouse.move(vp.width - 10, vp.height - 10);
    await page.waitForTimeout(700);
    await page.locator('#blockObj_bilibiliConfig_expandSpan').click();
    await page.locator('#bilibiliConfig_tab_play').click();
    const row = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="r-match"]');
    await row.locator('label').first().click(); // 取消启用
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(() => page.locator('[data-test="custom-match"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(false);

    // 重新启用 → 保存 → 不刷新即再次屏蔽
    await row.locator('label').first().click();
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(() => page.locator('[data-test="custom-match"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    await page.close();
  });

  test('durationSelector 扩展点：规则指定时长元素后按词条屏蔽，缺省探测找不到则不屏蔽', async () => {
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    // fixture 两张卡的时长文本都在非叶子节点（启发式探测找不到）
    await seedConfig(toolsPage, {
      version: 4,
      enable: true,
      words: [],
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
      rules: [
        { id: 'r-dursel', selector: '.dur-card', scopes: ['play'], mode: 'match', textSelectors: ['.t'], durationSelector: '.dur', enabled: true },
        { id: 'r-nodursel', selector: '.dur-card-nosel', scopes: ['play'], mode: 'match', textSelectors: ['.t'], durationSelector: '', enabled: true },
      ],
    });
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    // 有时长选择器：找到 0:45 < 60s → 屏蔽
    await expect
      .poll(() => page.locator('[data-test="card-dursel"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    // 无时长选择器：启发式找不到（非叶子）→ 不屏蔽
    await page.waitForSelector('[data-test="card-nodursel"]');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-test="card-nodursel"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test('禁用 mode:hide 规则后解除隐藏', async () => {
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(
      toolsPage,
      baseConfig([
        { id: 'r-hide', selector: '.custom-junk', scopes: ['play'], mode: 'hide', titleSelector: '', userSelector: '', enabled: false },
      ])
    );
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector('[data-test="custom-junk"]');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-test="custom-junk"]')).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });
});
