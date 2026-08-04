# 哔哩哔哩 - 屏蔽指定内容（浏览器扩展版）

按 **用户名 / 关键字 / 正则表达式** 屏蔽 bilibili 的视频（直播间/相薄）与评论（回复）；支持粉丝勋章屏蔽、白名单、动态屏蔽、消息中心回复屏蔽与自动删除、多标签页实时同步。

本扩展是油猴脚本 [哔哩哔哩 - 屏蔽指定内容](https://greasyfork.org/zh-CN/scripts/397669)（v4.8.0，作者 pana，GPL-3.0+）的独立浏览器扩展替代版，功能逐一对等，摆脱油猴环境与第三方 CDN 依赖。

- 许可证：**GPL-3.0-or-later**（继承原脚本与 Block_Obj 库）
- 目标浏览器：**Edge / Chrome（Manifest V3）**，无构建步骤、零运行时依赖

## 安装（Edge）

1. 打开 `edge://extensions`（Chrome 为 `chrome://extensions`）
2. 开启左下角「开发人员模式」
3. 点击「加载解压缩的扩展」，选择本项目根目录（含 `manifest.json`）

## 从油猴脚本迁移设置

两者的存储形状完全一致（`bilibili_config` 单对象，正则存 `/pattern/flags` 字符串），可一键迁移：

1. Tampermonkey 仪表盘 → 打开原脚本 → 「储存」标签页
2. 复制 `bilibili_config` 对应的 JSON 值
3. 打开扩展的导入页：`chrome-extension://<扩展ID>/src/tools/import-export.html`
   （扩展 ID 可在任意 bilibili 页面控制台执行 `document.documentElement.dataset.bilibanId` 查看）
4. 粘贴后点「导入」，刷新已打开的 bilibili 页面即可生效

导出按钮可用于备份或在浏览器之间迁移。

## 使用

- **设置面板**：鼠标移到页面 **右下角** 弹出蓝色圆形「屏蔽」按钮，点击打开设置面板
  - 「保存并关闭」/「仅保存」（闪「已保存」）/「取消」（丢弃未保存编辑）
  - 四个列表（白名单 / 黑名单用户名与粉丝勋章名 / 视频关键字 / 评论关键字）：输入后点「添加」或按回车；多个以半角逗号分隔；正则格式 `/Pattern/Modifier`（含逗号时整体作为一个条目）
  - 列表小按钮：添加 / 删除 / 清空 / 复制 / 展开(恢复)
- **多标签页同步**：任一标签页保存设置后，其余已打开的 bilibili 页面实时生效，无需刷新
- **BV 号异步查询**：仅拥有标题的推荐位视频会经 bilibili API 查询 UP 主名后按用户名屏蔽（结果缓存 3 天；请求被风控拦截时自动停止后续查询，与原脚本行为一致）
- **消息中心自动删除**：`messageReplyDelEnable` 开启后被屏蔽的回复通知会被自动删除（不可逆，删除记录见控制台），顶部显示删除计数

## 开发

要求：[bun](https://bun.sh) ≥ 1.x；E2E 需要本机安装 Edge。

```bash
bun install          # 安装 dev 依赖（仅 @playwright/test）
bun test             # 单元测试（node:test 风格，160 例）
bun run test:cov     # + 覆盖率（纯函数模块 ≥ 89%）
bun run e2e          # E2E：真实加载扩展，fixture 劫持 bilibili 域名（无头，不弹窗）
E2E_HEADED=1 bun run e2e   # 有头模式调试
```

### 目录结构

```
src/content/        # 内容脚本（ES Modules，经 entry.js 动态 import 加载）
  entry.js          # classic 入口（MV3 content_scripts 不支持 module）
  main.js           # 引导装配
  config/           # 存储层：默认值/迁移/正则序列化/chrome.storage 读写与订阅
  matcher/          # 纯函数判定：文本/用户名/白名单/表情转文字
  rules/            # 38 条选择器规则表（逐字移植自原脚本）
  engine/           # 屏蔽引擎：URL 门控、判定执行、rAF 调度
  resolver/         # BV → 用户名异步查询（节流 + 3 天缓存）
  panel/            # 设置面板 + 悬浮触发器 + 大爆炸弹窗（Block_Obj UI 重建）
  buttons/          # 评论区注入按钮工厂
  pages/            # 首页/动态/消息中心/直播弹幕/评论区 特殊逻辑
src/tools/          # 导入导出迁移页
test/unit/          # bun test 单元测试
test/fixtures/      # E2E 用静态 bilibili 页面骨架
test/e2e/           # Playwright 规格（真实加载扩展 + 路由劫持）
```

### 测试策略

- **单元测试**：匹配判定、正则序列化、迁移、列表真值恢复、大爆炸选段等纯函数模块（覆盖率见 `bun run test:cov`）
- **E2E**：Playwright 以 `--load-extension` 真实加载扩展，用 `context.route()` 把真实 bilibili 域名应答为本地 fixture，保证 URL 门控与页面分支逻辑在真实域名上执行；API 请求被拦截以保证密封性

## 致谢

原脚本与 Block_Obj 库：© pana，GPL-3.0+。本扩展的面板 UI 行为与 CSS 按 Block_Obj v3.0.3 逐字移植。
