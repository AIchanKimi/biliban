import { describe, test, expect } from "bun:test";
import { decide } from "../../src/content/engine/decide.js";

const config = (overrides = {}) => ({
  version: 5,
  enable: true,
  words: [],
  durations: [],
  rules: [],
  ...overrides,
});

describe("字段化匹配（v6.2）", () => {
  test("普通词：任一字段包含即命中（标题/名字独立计算）", () => {
    const cfg = config({ words: [{ value: "广告", scopes: ["global"] }] });
    expect(decide(cfg, "play", { texts: ["广告标题"] })).toBe(true);
    expect(decide(cfg, "play", { texts: ["正常标题", "广告UP"] })).toBe(true);
    expect(decide(cfg, "play", { texts: ["正常标题", "正常UP"] })).toBe(false);
  });

  test("字段级精确：/^词$/ 只命中完整字段，不误伤包含该串的其它字段", () => {
    const cfg = config({
      words: [{ value: /^羊驼的睡衣$/, scopes: ["global"] }],
    });
    expect(decide(cfg, "play", { texts: ["某标题", "羊驼的睡衣"] })).toBe(true);
    expect(
      decide(cfg, "play", { texts: ["羊驼的睡衣推荐合集", "正常UP"] }),
    ).toBe(false);
  });

  test("正则逐字段匹配（不再作用于拼接文本）", () => {
    // 跨字段拼接才能命中的正则在字段化后不应命中
    const cfg = config({
      words: [{ value: /标题.*名字/, scopes: ["global"] }],
    });
    expect(decide(cfg, "play", { texts: ["前半标题", "后半名字"] })).toBe(
      false,
    );
    expect(decide(cfg, "play", { texts: ["完整标题和名字"] })).toBe(true);
  });

  test("正则 flags 生效", () => {
    const cfg = config({ words: [{ value: /^ad/i, scopes: ["global"] }] });
    expect(decide(cfg, "play", { texts: ["AD视频"] })).toBe(true);
  });

  test("/g 正则重复判定不抖动（无 lastIndex 状态污染）", () => {
    const cfg = config({ words: [{ value: /广告/g, scopes: ["global"] }] });
    expect(decide(cfg, "play", { texts: ["广告"] })).toBe(true);
    expect(decide(cfg, "play", { texts: ["广告"] })).toBe(true);
    expect(decide(cfg, "play", { texts: ["广告"] })).toBe(true);
  });

  test("字段 trim：元素文本首尾空白不影响判定", () => {
    const cfg = config({
      words: [{ value: /^羊驼的睡衣$/, scopes: ["global"] }],
    });
    expect(decide(cfg, "play", { texts: ["  羊驼的睡衣  "] })).toBe(true);
    const cfg2 = config({ words: [{ value: "广告", scopes: ["global"] }] });
    expect(decide(cfg2, "play", { texts: ["  广告  "] })).toBe(true);
  });

  test("空白字段被忽略", () => {
    const cfg = config({ words: [{ value: "广告", scopes: ["global"] }] });
    expect(decide(cfg, "play", { texts: ["", "   ", null] })).toBe(false);
  });

  test("空字符串词条不造成全屏蔽", () => {
    const cfg = config({ words: [{ value: "", scopes: ["global"] }] });
    expect(decide(cfg, "play", { texts: ["任意标题"] })).toBe(false);
  });
});

describe("作用域过滤", () => {
  test("global 覆盖全部已匹配分类", () => {
    const cfg = config({ words: [{ value: "x", scopes: ["global"] }] });
    expect(decide(cfg, "search", { texts: ["x"] })).toBe(true);
    expect(decide(cfg, "fav", { texts: ["x"] })).toBe(true);
    expect(decide(cfg, null, { texts: ["x"] })).toBe(false); // 未匹配页面不触发
  });

  test("分类词条仅本类生效", () => {
    const cfg = config({ words: [{ value: "x", scopes: ["search"] }] });
    expect(decide(cfg, "search", { texts: ["x"] })).toBe(true);
    expect(decide(cfg, "play", { texts: ["x"] })).toBe(false);
  });

  test("多作用域词条任一命中即可", () => {
    const cfg = config({ words: [{ value: "x", scopes: ["play", "fav"] }] });
    expect(decide(cfg, "fav", { texts: ["x"] })).toBe(true);
    expect(decide(cfg, "search", { texts: ["x"] })).toBe(false);
  });
});

describe("门控", () => {
  test("总开关关闭 → 全不屏蔽", () => {
    const cfg = config({
      enable: false,
      words: [{ value: "x", scopes: ["global"] }],
    });
    expect(decide(cfg, "play", { texts: ["x"] })).toBe(false);
  });

  test("无字段 → false", () => {
    const cfg = config({ words: [{ value: "x", scopes: ["global"] }] });
    expect(decide(cfg, "play", {})).toBe(false);
    expect(decide(cfg, "play", { texts: [] })).toBe(false);
  });
});
