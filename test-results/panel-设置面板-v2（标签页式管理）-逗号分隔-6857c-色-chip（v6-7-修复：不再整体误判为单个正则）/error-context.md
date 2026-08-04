# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: panel.spec.js >> 设置面板 v2（标签页式管理） >> 逗号分隔多个正则一次添加为多个绿色 chip（v6.7 修复：不再整体误判为单个正则）
- Location: test/e2e/panel.spec.js:190:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#bilibiliConfig_words_global .block_obj_child_text').first()
Expected: "/^YY的奇妙冒险$/"
Received: "/^Y ... 险$/"
Timeout:  10000ms

Call log:
  - Expect "toHaveText" with timeout 10000ms
  - waiting for locator('#bilibiliConfig_words_global .block_obj_child_text').first()
    24 × locator resolved to <span title="/^YY的奇妙冒险$/" class="block_obj_child_text block_obj_child_green">/^Y ... 险$/</span>
       - unexpected value "/^Y ... 险$/"

```

```yaml
- text: /^Y ... 险$/
```

# Test source

```ts
  101 |     await page.locator("xpath=//span[text()='关闭']").click();
  102 |     await expect(page.locator(WRAP)).toHaveClass(/block_obj_hidden_wrap/);
  103 |     // 重建后恢复为已保存状态
  104 |     await openPanel(page);
  105 |     await expect(page.locator('#bilibiliConfig_enable')).toBeChecked();
  106 |     await page.close();
  107 |   });
  108 | 
  109 |   test('时长词条：秒输入 + 格式预览 + 落盘', async () => {
  110 |     const page = await context.newPage();
  111 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  112 |     await openPanel(page);
  113 |     await page.locator('#bilibiliConfig_tab_play').click();
  114 |     await page.selectOption('#bilibiliConfig_durationOp_play', 'lt');
  115 |     await page.fill('#bilibiliConfig_durationSeconds_play', '4664');
  116 |     // 右侧实时预览为 B 站时长格式
  117 |     await expect(page.locator('#bilibiliConfig_durationPreview_play')).toHaveText('01:17:44');
  118 |     await page.fill('#bilibiliConfig_durationSeconds_play', '15');
  119 |     await expect(page.locator('#bilibiliConfig_durationPreview_play')).toHaveText('0:15');
  120 |     await page
  121 |       .locator("xpath=//input[@id='bilibiliConfig_durationSeconds_play']/following::span[text()='添加'][1]")
  122 |       .click();
  123 |     await expect(page.locator('#bilibiliConfig_durations_play')).toContainText('短于 15 秒');
  124 |     await page.locator("xpath=//span[@title='保存设置']").click();
  125 |     await expect
  126 |       .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).durations)
  127 |       .toEqual([{ op: 'lt', seconds: 15, scopes: ['play'] }]);
  128 |     // 还原：清掉该词条避免影响后续用例
  129 |     await seedConfig(toolsPage, { version: 4, enable: true, words: [], durations: [], rules: [] });
  130 |     await page.close();
  131 |   });
  132 | 
  133 |   test('规则区默认整体折叠，点「规则」开关展开/收起（v6.3）', async () => {
  134 |     const page = await context.newPage();
  135 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  136 |     await openPanel(page);
  137 |     await page.locator('#bilibiliConfig_tab_play').click();
  138 |     const cardRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-bili-video-card"]');
  139 |     // 默认折叠：规则行不可见；头部开关与「添加规则」常驻可见
  140 |     await expect(cardRow).not.toBeVisible();
  141 |     await expect(page.locator('#bilibiliConfig_rulesToggle_play')).toBeVisible();
  142 |     await expect(page.locator('#bilibiliConfig_rules_play').getByText('添加规则', { exact: true })).toBeVisible();
  143 |     // 展开 → 行可见；再点 → 收起
  144 |     await page.locator('#bilibiliConfig_rulesToggle_play').click();
  145 |     await expect(cardRow).toBeVisible();
  146 |     await page.locator('#bilibiliConfig_rulesToggle_play').click();
  147 |     await expect(cardRow).not.toBeVisible();
  148 |     await page.close();
  149 |   });
  150 | 
  151 |   test('内置规则展示 + 命中统计徽标（找到 N · 隐藏 M，命中高亮）', async () => {
  152 |     const page = await context.newPage();
  153 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  154 |     await openPanel(page);
  155 |     await page.locator('#bilibiliConfig_tab_play').click();
  156 |     // v6.3：规则区整体默认折叠，先点「规则」开关展开；行本身默认收起（概览）
  157 |     await page.locator('#bilibiliConfig_rulesToggle_play').click();
  158 |     // builtin-bili-video-card 属播放分类，行在「播放」标签
  159 |     const cardRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-bili-video-card"]');
  160 |     await expect(cardRow).toBeVisible();
  161 |     await expect(cardRow.locator('.block_obj_rule_summary')).toContainText('bili-video-card');
  162 |     // fixture 有 6 张 .bili-video-card 卡片：该规则统计徽标命中（引擎在面板打开前已跑过多轮）
  163 |     const statsBadge = page.locator('#bilibiliConfig_pane_play .block_obj_rule_stats[data-rule-id="builtin-bili-video-card"]');
  164 |     await expect(statsBadge).toHaveText(/找到 \d+ · 隐藏 \d+/);
  165 |     await expect(statsBadge).toHaveClass(/block_obj_rule_stats_hit/);
  166 | 
  167 |     // 回归防护：统计按轮覆盖写，静态页面上数字不得持续增长（旧版累加 bug）
  168 |     const first = await statsBadge.textContent();
  169 |     await page.waitForTimeout(1500);
  170 |     const second = await statsBadge.textContent();
  171 |     expect(second).toBe(first);
  172 |     await page.close();
  173 |   });
  174 | 
  175 |   test('正则 chip 显绿色且 >9 字符截断、title 存全值', async () => {
  176 |     const page = await context.newPage();
  177 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  178 |     await openPanel(page);
  179 |     await page.fill('#bilibiliConfig_wordInput_global', '/一个很长的正则,含逗号/');
  180 |     await page
  181 |       .locator("xpath=//input[@id='bilibiliConfig_wordInput_global']/following::span[text()='添加'][1]")
  182 |       .click();
  183 |     const chipText = page.locator('#bilibiliConfig_words_global .block_obj_child_text').first();
  184 |     await expect(chipText).toHaveClass(/block_obj_child_green/);
  185 |     await expect(chipText).toHaveAttribute('title', '/一个很长的正则,含逗号/');
  186 |     await expect(chipText).toContainText(' ... ');
  187 |     await page.close();
  188 |   });
  189 | 
  190 |   test('逗号分隔多个正则一次添加为多个绿色 chip（v6.7 修复：不再整体误判为单个正则）', async () => {
  191 |     const page = await context.newPage();
  192 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  193 |     await openPanel(page);
  194 |     await page.fill('#bilibiliConfig_wordInput_global', '/^陈莴笋哦$/,/^YY的奇妙冒险$/');
  195 |     await page
  196 |       .locator("xpath=//input[@id='bilibiliConfig_wordInput_global']/following::span[text()='添加'][1]")
  197 |       .click();
  198 |     const chips = page.locator('#bilibiliConfig_words_global .block_obj_child_text');
  199 |     await expect(chips).toHaveCount(2);
  200 |     // prepend 插入：后添加的视觉在前
> 201 |     await expect(chips.nth(0)).toHaveText('/^YY的奇妙冒险$/');
      |                                ^ Error: expect(locator).toHaveText(expected) failed
  202 |     await expect(chips.nth(1)).toHaveText('/^陈莴笋哦$/');
  203 |     await expect(chips.nth(0)).toHaveClass(/block_obj_child_green/);
  204 |     await page.close();
  205 |   });
  206 | 
  207 |   test('规则可编辑：点「编辑」改选择器 + 删除，保存后写回 rules', async () => {
  208 |     const page = await context.newPage();
  209 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  210 |     await openPanel(page);
  211 |     await page.locator('#bilibiliConfig_tab_play').click();
  212 |     await page.locator('#bilibiliConfig_rulesToggle_play').click(); // 展开折叠的规则区
  213 | 
  214 |     // 编辑视频页右侧推荐行：默认收起，先点「编辑」展开再改选择器
  215 |     const pageCardRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-video-page-card"]');
  216 |     await pageCardRow.getByText('编辑', { exact: true }).click();
  217 |     await pageCardRow.locator('.block_obj_rule_selector_input').fill('.video-page-card-v2');
  218 | 
  219 |     // 删除片尾推荐行（概览行直接有删除按钮）
  220 |     const endingRow = page.locator('#bilibiliConfig_pane_play .block_obj_rule_row[data-rule-id="builtin-ending-related"]');
  221 |     await endingRow.getByText('删除', { exact: true }).click();
  222 | 
  223 |     await page.locator("xpath=//span[@title='保存设置']").click();
  224 |     await expect
  225 |       .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).rules)
  226 |       .toEqual(expect.arrayContaining([
  227 |         expect.objectContaining({ id: 'builtin-video-page-card', selector: '.video-page-card-v2', scopes: ['play'] }),
  228 |       ]));
  229 |     const rules = (await readStorageKey(toolsPage, 'bilibili_config')).rules;
  230 |     expect(rules.find(r => r.id === 'builtin-ending-related' && r.scopes[0] === 'play')).toBeUndefined();
  231 |     // 播放分类其余规则仍在（未误删）
  232 |     expect(rules.filter(r => r.scopes[0] === 'play').length).toBeGreaterThanOrEqual(3);
  233 |     await page.close();
  234 |   });
  235 | 
  236 |   test('导出下载 JSON 文件 / 导入从文件生效', async () => {
  237 |     const page = await context.newPage();
  238 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  239 |     await openPanel(page);
  240 | 
  241 |     // 导出：触发浏览器下载
  242 |     const [download] = await Promise.all([
  243 |       page.waitForEvent('download'),
  244 |       page.locator("xpath=//span[text()='导出']").click(),
  245 |     ]);
  246 |     expect(download.suggestedFilename()).toBe('biliban-settings.json');
  247 |     const stream = await download.createReadStream();
  248 |     const chunks = [];
  249 |     for await (const chunk of stream) {
  250 |       chunks.push(chunk);
  251 |     }
  252 |     const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  253 |     expect(exported.version).toBe(5);
  254 |     // v6.1：内置规则已并入 rules，导出即全量
  255 |     expect(exported.rules.some(r => r.id === 'builtin-bili-video-card')).toBe(true);
  256 | 
  257 |     // 导入：选择 JSON 文件 → 存储更新 → 面板重建显示新词条
  258 |     const filePath = path.join(os.tmpdir(), 'biliban-import-test.json');
  259 |     fs.writeFileSync(filePath, JSON.stringify({
  260 |       version: 4,
  261 |       enable: true,
  262 |       words: [{ value: '导入测试词', scopes: ['global'] }],
  263 |       durations: [],
  264 |       rules: [],
  265 |     }));
  266 |     await page.locator('#blockObj_bilibiliConfig_wrapDiv input[type="file"]').setInputFiles(filePath);
  267 |     await expect
  268 |       .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).words)
  269 |       .toEqual([{ value: '导入测试词', scopes: ['global'] }]);
  270 |     await expect(page.locator('#bilibiliConfig_words_global')).toContainText('导入测试词');
  271 |     await page.close();
  272 |   });
  273 | 
  274 |   test('输入带首尾空格的词 → 落盘为 trim 后的值', async () => {
  275 |     const page = await context.newPage();
  276 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  277 |     await openPanel(page);
  278 |     await page.fill('#bilibiliConfig_wordInput_global', '  带空格的词  ');
  279 |     await page
  280 |       .locator("xpath=//input[@id='bilibiliConfig_wordInput_global']/following::span[text()='添加'][1]")
  281 |       .click();
  282 |     await page.locator("xpath=//span[@title='保存设置']").click();
  283 |     await expect
  284 |       .poll(async () => (await readStorageKey(toolsPage, 'bilibili_config')).words)
  285 |       .toEqual(expect.arrayContaining([{ value: '带空格的词', scopes: ['global'] }]));
  286 |     // 还原
  287 |     await seedConfig(toolsPage, { version: 5, enable: true, words: [], durations: [], rules: [] });
  288 |     await page.close();
  289 |   });
  290 | 
  291 |   test('无文字选择器的 match 规则照常保存（纯时长规则不再被静默丢弃）', async () => {
  292 |     // 预置一条全局时长词条：短于 60 秒
  293 |     await seedConfig(toolsPage, {
  294 |       version: 5, enable: true, words: [], rules: [],
  295 |       durations: [{ op: 'lt', seconds: 60, scopes: ['global'] }],
  296 |     });
  297 |     const page = await context.newPage();
  298 |     await page.goto('https://www.bilibili.com/video/BV1fixture');
  299 |     await openPanel(page);
  300 |     await page.locator('#bilibiliConfig_tab_play').click();
  301 |     await page.locator('#bilibiliConfig_rules_play').getByText('添加规则', { exact: true }).click();
```