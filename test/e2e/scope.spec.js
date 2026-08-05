import { test, expect } from "@playwright/test";
import {
  launchContext,
  getExtensionId,
  openToolsPage,
  seedConfig,
} from "./helpers/extension.js";
import { setupBilibiliRoutes } from "./helpers/bilibili-routes.js";

const NONE = "block_obj_none"; // method 0：display 类

const V6_CONFIG = {
  version: 4,
  enable: true,
  words: [
    { value: "讨厌的UP", scopes: ["global"] },
    { value: "广告UP", scopes: ["global"] },
    { value: "广告", scopes: ["global"] },
    { value: "搜索专属词", scopes: ["search"] },
    { value: "播放专属词", scopes: ["play"] },
  ],
  durations: [],
  rules: [
    // v6.8：全局作用域规则——浮层（顶栏悬浮窗模拟）在任意注入页面执行
    {
      id: "custom-popup",
      selector: ".bili-popup-recommend .popup-card",
      scopes: ["global"],
      mode: "match",
      textSelectors: [".popup-title", ".popup-author"],
      durationSelector: "",
      enabled: true,
    },
  ],
};

test.describe("作用域与内置规则（v6.0 分类）", () => {
  let context;

  test.beforeAll(async () => {
    context = await launchContext();
    await setupBilibiliRoutes(context, {
      "www.bilibili.com": "video-cards.html",
      "search.bilibili.com": "search.html",
      "space.bilibili.com": "space.html",
    });
    const extensionId = await getExtensionId(context);
    const toolsPage = await openToolsPage(context, extensionId);
    await seedConfig(toolsPage, V6_CONFIG);
  });
  test.afterAll(async () => context.close());

  test("全局关键字在播放页屏蔽", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/video/BV1fixture");
    await expect
      .poll(() =>
        page
          .locator('[data-test="card-by-keyword"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await expect(page.locator('[data-test="card-by-user"]')).toBeAttached();
    await page.close();
  });

  test("全局屏蔽词 + 正常卡片不受影响", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/video/BV1fixture");
    await expect
      .poll(() =>
        page
          .locator('[data-test="card-by-user"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.waitForSelector('[data-test="card-clean"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-clean"]')).not.toHaveClass(
      new RegExp(NONE),
    );
    await page.close();
  });

  test("search 作用域关键字在搜索页命中", async () => {
    const page = await context.newPage();
    await page.goto("https://search.bilibili.com/all?keyword=test");
    await expect
      .poll(() =>
        page
          .locator('[data-test="search-card-scoped"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page
          .locator('[data-test="search-card-ad"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.close();
  });

  test("search 作用域关键字在播放页不命中", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/video/BV1fixture");
    await page.waitForSelector('[data-test="card-scoped"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-test="card-scoped"]')).not.toHaveClass(
      new RegExp(NONE),
    );
    await page.close();
  });

  test("play 作用域关键字在播放页命中", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/list/ml7007879567");
    await expect
      .poll(() =>
        page
          .locator('[data-test="card-play-scoped"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.close();
  });

  test("搜索页 UP 主卡（.user-list）按文字屏蔽", async () => {
    const page = await context.newPage();
    await page.goto("https://search.bilibili.com/all?keyword=test");
    await expect
      .poll(() =>
        page
          .locator('[data-test="search-user-ad"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.waitForSelector('[data-test="search-user-clean"]');
    await page.waitForTimeout(300);
    await expect(
      page.locator('[data-test="search-user-clean"]'),
    ).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test("space 作用域：仅投稿视频页触发", async () => {
    const page = await context.newPage();
    await page.goto("https://space.bilibili.com/123/upload/video");
    await expect
      .poll(() =>
        page
          .locator('[data-test="space-card-ad"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.waitForSelector('[data-test="space-card-clean"]');
    await page.waitForTimeout(300);
    await expect(
      page.locator('[data-test="space-card-clean"]'),
    ).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });

  test("收藏页（稍后再看列表）：全局词生效", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/watchlater/list#/list");
    await expect
      .poll(() =>
        page
          .locator('[data-test="card-by-keyword"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.close();
  });

  test("首页 feed 等未匹配页面不触发屏蔽", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/");
    await page.waitForSelector('[data-test="card-by-keyword"]');
    await page.waitForTimeout(800);
    // 同一份 fixture，但首页 URL 未匹配任何分类 → feed 卡不屏蔽（全局规则仅作用于浮层容器）
    await expect(page.locator('[data-test="card-by-keyword"]')).not.toHaveClass(
      new RegExp(NONE),
    );
    await page.close();
  });

  test("v6.8 全局规则：未匹配页面浮层卡按全局词屏蔽，feed 不受影响", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/");
    // 标题命中全局词「广告」
    await expect
      .poll(() =>
        page
          .locator('[data-test="overlay-card-ad"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    // UP 主字段命中全局词「广告UP」
    await expect
      .poll(() =>
        page
          .locator('[data-test="overlay-card-by-author"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    // 干净浮层卡与页面 feed 卡均不受影响
    await page.waitForSelector('[data-test="overlay-card-clean"]');
    await page.waitForTimeout(500);
    await expect(
      page.locator('[data-test="overlay-card-clean"]'),
    ).not.toHaveClass(new RegExp(NONE));
    await expect(page.locator('[data-test="card-by-keyword"]')).not.toHaveClass(
      new RegExp(NONE),
    );
    await page.close();
  });

  test("v6.8 全局规则：已匹配页面浮层卡同样屏蔽", async () => {
    const page = await context.newPage();
    await page.goto("https://www.bilibili.com/video/BV1fixture");
    await expect
      .poll(() =>
        page
          .locator('[data-test="overlay-card-ad"]')
          .evaluate((el) => el.classList.contains("block_obj_none")),
      )
      .toBe(true);
    await page.waitForSelector('[data-test="overlay-card-clean"]');
    await page.waitForTimeout(300);
    await expect(
      page.locator('[data-test="overlay-card-clean"]'),
    ).not.toHaveClass(new RegExp(NONE));
    await page.close();
  });
});
