import { describe, test, expect } from "bun:test";
import { BUILTIN_RULES } from "../../src/content/rules/builtin-rules.js";
import { SCOPE_VALUES } from "../../src/content/config/scopes.js";

describe("builtin-rules v6.0（分类重构版）", () => {
  test("共 8 条", () => {
    expect(BUILTIN_RULES.length).toBe(8);
  });

  test("每条形状合法：id/selector/scopes/mode/textSelectors 数组", () => {
    const ids = new Set();
    for (const rule of BUILTIN_RULES) {
      expect(typeof rule.id).toBe("string");
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
      expect(typeof rule.selector).toBe("string");
      expect(rule.mode).toBe("match");
      expect(Array.isArray(rule.textSelectors)).toBe(true);
      expect(rule.textSelectors.length).toBeGreaterThan(0);
      expect(rule.scopes.length).toBeGreaterThan(0);
      for (const scope of rule.scopes) {
        expect(SCOPE_VALUES).toContain(scope);
      }
      expect(Object.isFrozen(rule)).toBe(true);
    }
  });

  test("不再有 global 作用域规则（规则归具体分类），且无已删分类", () => {
    for (const rule of BUILTIN_RULES) {
      expect(rule.scopes).not.toContain("global");
      for (const gone of ["home", "video", "dynamics"]) {
        expect(rule.scopes).not.toContain(gone);
      }
    }
  });

  test("已随页面删除的规则不复存在", () => {
    const json = JSON.stringify(BUILTIN_RULES.map((r) => r.selector));
    for (const gone of [
      ".bili-dyn-item",
      ".recommend-list",
      ".carousel-module",
    ]) {
      expect(json).not.toContain(gone);
    }
  });

  test("关键规则的作用域与选择器", () => {
    const byId = (id) => BUILTIN_RULES.find((r) => r.id === id);
    expect(byId("builtin-bili-video-card").scopes).toEqual([
      "search",
      "space",
      "play",
      "fav",
    ]);
    expect(byId("builtin-bili-video-card").textSelectors).toContain(
      ".bili-video-card__info--tit",
    );
    expect(byId("builtin-bili-video-card").durationSelector).toBe(
      ".bili-video-card__stats__duration",
    );
    expect(byId("builtin-space-cube").scopes).toEqual(["space"]);
    expect(byId("builtin-search-user-list").scopes).toEqual(["search"]);
    expect(byId("builtin-ending-related").scopes).toEqual(["play"]);
    expect(byId("builtin-video-page-card").scopes).toEqual(["play"]);
  });
});
