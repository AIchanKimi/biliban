import { describe, test, expect } from "bun:test";
import {
  canonicalJson,
  sortKeysForCanonicalJson,
} from "../../src/content/config/store.js";

describe("canonicalJson（自身写入回显过滤的键序无关比对）", () => {
  test("键顺序不同的对象产生相同规范 JSON", () => {
    const a = { functionEnable: true, keywordArray: ["x"], usernameArray: [] };
    const b = { usernameArray: [], functionEnable: true, keywordArray: ["x"] };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  test("嵌套对象同样按键排序", () => {
    const a = { outer: { b: 1, a: 2 } };
    const b = { outer: { a: 2, b: 1 } };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  test("数组保持顺序（顺序是语义）", () => {
    expect(canonicalJson({ arr: [1, 2] })).not.toBe(
      canonicalJson({ arr: [2, 1] }),
    );
  });

  test("值不同则结果不同", () => {
    expect(canonicalJson({ a: 1 })).not.toBe(canonicalJson({ a: 2 }));
  });

  test("原始值与 null 直通", () => {
    expect(sortKeysForCanonicalJson(null)).toBeNull();
    expect(sortKeysForCanonicalJson("s")).toBe("s");
    expect(sortKeysForCanonicalJson(3)).toBe(3);
  });
});
