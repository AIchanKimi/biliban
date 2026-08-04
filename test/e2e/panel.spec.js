import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    await seedConfig(toolsPage, { version: 4, enable: true, words: [], rules: [] });
  });
  test.afterAll(async () => context.close());

  test('鼠标移至右下角 → 触发器滑入（默认藏在屏外）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await page.waitForSelector(TRIGGER);
    const box = page.locator('.block_obj_expand_box');
    await expect(box).not.toHaveClass(/block_obj_show_expand_box/);
    await openPanel(page);
    await expect(box).toHaveClass(/block_obj_show_expand_box/);
    await page.close();
  });

  test('五个分类标签齐全（v6.0），默认停在「全局」', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    for (const [scope, label] of [['global', '全局'], ['search', '搜索'], ['space', '空间'], ['play', '播放'], ['fav', '收藏']]) {
      await expect(page.locator(`#bilibiliConfig_tab_${scope}`)).toHaveText(label);
    }
    await expect(page.locator('#bilibiliConfig_tab_global')).toHaveClass(/block_obj_tab_active/);
    await expect(page.locator('#bilibiliConfig_pane_global')).toBeVisible();
    await expect(page.locator('#bilibiliConfig_pane_search')).not.toBeVisible();
    // 当前页面（/video/* → 播放）：全局 + 播放 带「当前页面」标记，其余不带
    await expect(page.locator('#bilibiliConfig_tab_global')).toHaveClass(/block_obj_tab_current/);
    await expect(page.locator('#bilibiliConfig_tab_play')).toHaveClass(/block_obj_tab_current/);
    await expect(page.locator('#bilibiliConfig_tab_search')).not.toHaveClass(/block_obj_tab_current/);
    await page.close();
  });

  test('切到「搜索」添加关键字 → 仅保存：落盘 scopes=[search]，切换标签不丢未保存编辑', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);

    await page.locator('#bilibiliConfig_tab_search').click();
    await expect(page.locator('#bilibiliConfig_pane_search')).toBeVisible();

    await page.fill('#bilibiliConfig_wordInput_search', '测试关键字');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_wordInput_search']/following::span[text()='添加'][1]")
      .click();
    await expect(page.locator('#bilibiliConfig_words_search')).toContainText('测试关键字');

    // 切走再切回：未保存编辑仍在（所有分类页常驻 DOM，仅切换显隐）
    await page.locator('#bilibiliConfig_tab_global').click();
    await page.locator('#bilibiliConfig_tab_search').click();
    await expect(page.locator('#bilibiliConfig_words_search')).toContainText('测试关键字');

    // 用 title 锚定（闪烁期间 textContent 变化，text() 定位器会跟丢）
    const onlySave = page.locator("xpath=//span[@title='仅保存设置']");
    await onlySave.click();
    await expect(onlySave).toHaveText('已保存');
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).words)
      .toEqual([{ value: '测试关键字', scopes: ['search'] }]);
    await page.close();
  });

  test('取消：收起面板并在 800ms 后丢弃未保存编辑', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    const checkbox = page.locator('#bilibiliConfig_enable');
    await expect(checkbox).toBeChecked();
    // Block_Obj 样式 checkbox：input 被 clip 隐藏、label::before 是可视控件，点击 label 切换
    await page.locator('label[for="bilibiliConfig_enable"]').click();
    await expect(checkbox).not.toBeChecked();
    await page.locator("xpath=//span[text()='取消']").click();
    await expect(page.locator(WRAP)).toHaveClass(/block_obj_hidden_wrap/);
    // 重建后恢复为已保存状态
    await openPanel(page);
    await expect(page.locator('#bilibiliConfig_enable')).toBeChecked();
    await page.close();
  });

  test('时长词条：秒输入 + 格式预览 + 落盘', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.locator('#bilibiliConfig_tab_play').click();
    await page.selectOption('#bilibiliConfig_durationOp_play', 'lt');
    await page.fill('#bilibiliConfig_durationSeconds_play', '4664');
    // 右侧实时预览为 B 站时长格式
    await expect(page.locator('#bilibiliConfig_durationPreview_play')).toHaveText('01:17:44');
    await page.fill('#bilibiliConfig_durationSeconds_play', '15');
    await expect(page.locator('#bilibiliConfig_durationPreview_play')).toHaveText('0:15');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_durationSeconds_play']/following::span[text()='添加'][1]")
      .click();
    await expect(page.locator('#bilibiliConfig_durations_play')).toContainText('短于 15 秒');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).durations)
      .toEqual([{ op: 'lt', seconds: 15, scopes: ['play'] }]);
    // 还原：清掉该词条避免影响后续用例
    await seedConfig(toolsPage, { version: 4, enable: true, words: [], durations: [], rules: [] });
    await page.close();
  });

  test('内置规则展示 + 命中统计徽标（找到 N · 隐藏 M，命中高亮）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.locator('#bilibiliConfig_tab_play').click();
    // builtin-bili-video-card 属播放分类，行在「播放」标签；规则行默认收起（概览）
    const cardRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-bili-video-card"]');
    await expect(cardRow).toBeVisible();
    await expect(cardRow.locator('.block_obj_rule_summary')).toContainText('bili-video-card');
    // fixture 有 6 张 .bili-video-card 卡片：该规则统计徽标命中（引擎在面板打开前已跑过多轮）
    const statsBadge = page.locator('#bilibiliConfig_pane_play .block_obj_rule_stats[data-rule-id="builtin-bili-video-card"]');
    await expect(statsBadge).toHaveText(/找到 \d+ · 隐藏 \d+/);
    await expect(statsBadge).toHaveClass(/block_obj_rule_stats_hit/);

    // 回归防护：统计按轮覆盖写，静态页面上数字不得持续增长（旧版累加 bug）
    const first = await statsBadge.textContent();
    await page.waitForTimeout(1500);
    const second = await statsBadge.textContent();
    expect(second).toBe(first);
    await page.close();
  });

  test('正则 chip 显绿色且 >9 字符截断、title 存全值', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.fill('#bilibiliConfig_wordInput_global', '/一个很长的正则,含逗号/');
    await page
      .locator("xpath=//input[@id='bilibiliConfig_wordInput_global']/following::span[text()='添加'][1]")
      .click();
    const chipText = page.locator('#bilibiliConfig_words_global .block_obj_child_text').first();
    await expect(chipText).toHaveClass(/block_obj_child_green/);
    await expect(chipText).toHaveAttribute('title', '/一个很长的正则,含逗号/');
    await expect(chipText).toContainText(' ... ');
    await page.close();
  });

  test('规则可编辑：点「编辑」改选择器 + 删除，保存后写回 rules', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.locator('#bilibiliConfig_tab_play').click();

    // 编辑视频页右侧推荐行：默认收起，先点「编辑」展开再改选择器
    const pageCardRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-video-page-card"]');
    await pageCardRow.getByText('编辑', { exact: true }).click();
    await pageCardRow.locator('.block_obj_rule_selector_input').fill('.video-page-card-v2');

    // 删除片尾推荐行（概览行直接有删除按钮）
    const endingRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-ending-related"]');
    await endingRow.getByText('删除', { exact: true }).click();

    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).rules)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'builtin-video-page-card', selector: '.video-page-card-v2', scopes: ['play'] }),
      ]));
    const rules = (await readStorageKey(toolsPage, 'bilibili_config')).rules;
    expect(rules.find(r => r.id === 'builtin-ending-related' && r.scopes[0] === 'play')).toBeUndefined();
    // 播放分类其余规则仍在（未误删）
    expect(rules.filter(r => r.scopes[0] === 'play').length).toBeGreaterThanOrEqual(3);
    await page.close();
  });

  test('导出设置下载 JSON 文件 / 导入设置从文件生效', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);

    // 导出：触发浏览器下载
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator("xpath=//span[text()='导出设置']").click(),
    ]);
    expect(download.suggestedFilename()).toBe('biliban-settings.json');
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(exported.version).toBe(5);
    // v6.1：内置规则已并入 rules，导出即全量
    expect(exported.rules.some(r => r.id === 'builtin-bili-video-card')).toBe(true);

    // 导入：选择 JSON 文件 → 存储更新 → 面板重建显示新词条
    const filePath = path.join(os.tmpdir(), 'biliban-import-test.json');
    fs.writeFileSync(filePath, JSON.stringify({
      version: 4,
      enable: true,
      words: [{ value: '导入测试词', scopes: ['global'] }],
      durations: [],
      rules: [],
    }));
    await page.locator('#blockObj_bilibiliConfig_wrapDiv input[type="file"]').setInputFiles(filePath);
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).words)
      .toEqual([{ value: '导入测试词', scopes: ['global'] }]);
    await expect(page.locator('#bilibiliConfig_words_global')).toContainText('导入测试词');
    await page.close();
  });

  test('无文字选择器的 match 规则照常保存（纯时长规则不再被静默丢弃）', async () => {
    // 预置一条全局时长词条：短于 60 秒
    await seedConfig(toolsPage, {
      version: 5, enable: true, words: [], rules: [],
      durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
    });
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.locator('#bilibiliConfig_tab_play').click();
    await page.locator('#bilibiliConfig_rules_play').getByText('添加规则', { exact: true }).click();
    const row = page.locator('#bilibiliConfig_rules_play .block_obj_rule_row').last();
    await row.getByText('编辑', { exact: true }).click();
    await row.locator('.block_obj_rule_selector_input').fill('.dur-card');
    await row.locator('.block_obj_rule_duration_input').fill('.dur');
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    // 落盘：textSelectors 为空也保留（回归：v6.0 曾静默丢弃此类规则）
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).rules)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ selector: '.dur-card', mode: 'match', textSelectors: [], durationSelector: '.dur' }),
      ]));
    // 生效：0:45 < 60s → 隐藏
    await page.reload();
    await expect
      .poll(() => page.locator('[data-test="card-dursel"]').evaluate(el => el.classList.contains('block_obj_none')))
      .toBe(true);
    // 还原
    await seedConfig(toolsPage, { version: 5, enable: true, words: [], durations: [], rules: [] });
    await page.close();
  });

  test('规则编辑器：在当前分类添加规则行 → 保存 → 落盘（scopes 取当前分类）', async () => {
    const page = await context.newPage();
    await page.goto('https://www.bilibili.com/video/BV1fixture');
    await openPanel(page);
    await page.locator('#bilibiliConfig_tab_play').click();
    await page.locator('#bilibiliConfig_rules_play').getByText('添加规则', { exact: true }).click();
    const row = page.locator('#bilibiliConfig_rules_play .block_obj_rule_row').last();
    await row.getByText('编辑', { exact: true }).click();
    await row.locator('.block_obj_rule_selector_input').fill('.my-new-card');
    await row.locator('select').selectOption('hide');
    // 「启用」勾选可经 label 点击关闭（回归：label[for] 绑定修复）
    await row.locator('label').first().click();
    await expect(row.locator('input[type="checkbox"]')).not.toBeChecked();
    await page.locator("xpath=//span[@title='仅保存设置']").click();
    await expect
      .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).rules)
      .toEqual([
        expect.objectContaining({ selector: '.my-new-card', scopes: ['play'], mode: 'hide', enabled: false }),
      ]);
    await page.close();
  });
});
