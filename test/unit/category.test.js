import { describe, test, expect } from "bun:test";
import { categoryFor } from "../../src/content/engine/category.js";

describe("categoryFor（URL → 页面分类，v6.0 精确匹配）", () => {
  test("搜索子域全部命中", () => {
    expect(categoryFor("https://search.bilibili.com/all?keyword=x")).toBe(
      "search",
    );
    expect(categoryFor("https://search.bilibili.com/video?keyword=x")).toBe(
      "search",
    );
  });

  test("空间：仅投稿视频页命中", () => {
    expect(categoryFor("https://space.bilibili.com/123/upload/video")).toBe(
      "space",
    );
    expect(
      categoryFor("https://space.bilibili.com/123/upload/video?tid=0"),
    ).toBe("space");
    expect(categoryFor("https://space.bilibili.com/123")).toBeNull();
    expect(categoryFor("https://space.bilibili.com/123/dynamic")).toBeNull();
  });

  test("播放：视频页 / 番剧 / 收藏播放列表 / 稍后再看播放列表", () => {
    expect(categoryFor("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(
      "play",
    );
    expect(categoryFor("https://www.bilibili.com/bangumi/play/ss123")).toBe(
      "play",
    );
    expect(
      categoryFor("https://www.bilibili.com/list/ml7007879567?favid=1"),
    ).toBe("play");
    expect(categoryFor("https://www.bilibili.com/list/watchlater")).toBe(
      "play",
    );
    expect(categoryFor("https://www.bilibili.com/list/watchlater#/list")).toBe(
      "play",
    );
  });

  test("收藏：稍后再看列表页 / 空间收藏列表", () => {
    expect(categoryFor("https://www.bilibili.com/watchlater")).toBe("fav");
    expect(categoryFor("https://www.bilibili.com/watchlater/list#/list")).toBe(
      "fav",
    );
    expect(categoryFor("https://space.bilibili.com/123/favlist")).toBe("fav");
    expect(categoryFor("https://space.bilibili.com/123/favlist?fid=1")).toBe(
      "fav",
    );
  });

  test("顺序边界：/watchlater（收藏）与 /list/watchlater（播放）不误判", () => {
    expect(categoryFor("https://www.bilibili.com/watchlater/list#/list")).toBe(
      "fav",
    );
    expect(categoryFor("https://www.bilibili.com/list/watchlater")).toBe(
      "play",
    );
  });

  test("其他页面不匹配（首页 feed / 频道 / 动态 / 直播等）", () => {
    expect(categoryFor("https://www.bilibili.com/")).toBeNull();
    expect(
      categoryFor("https://www.bilibili.com/?spm_id_from=333.999"),
    ).toBeNull();
    expect(categoryFor("https://www.bilibili.com/v/popular/all")).toBeNull();
    expect(categoryFor("https://www.bilibili.com/v/channel")).toBeNull();
    expect(categoryFor("https://www.bilibili.com/read/ranking")).toBeNull();
    expect(categoryFor("https://www.bilibili.com/opus/987654")).toBeNull();
    expect(categoryFor("https://t.bilibili.com/")).toBeNull();
    expect(categoryFor("https://live.bilibili.com/12345")).toBeNull();
    expect(categoryFor("https://example.com/")).toBeNull();
    expect(categoryFor("")).toBeNull();
    expect(categoryFor(null)).toBeNull();
    expect(categoryFor("not-a-url")).toBeNull();
  });
});
