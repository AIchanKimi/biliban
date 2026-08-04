// classic content script 入口（MV3 content_scripts 不支持 ES module）
// 通过动态 import 加载模块树；整个 import 图必须在 manifest 的 web_accessible_resources 中声明。
(async () => {
  try {
    // 供 E2E 发现扩展 id（非敏感信息）
    document.documentElement.setAttribute("data-biliban-id", chrome.runtime.id);
    const main = await import(chrome.runtime.getURL("src/content/main.js"));
    await main.start();
  } catch (error) {
    console.error("[bilibili_block] 模块加载失败:", error);
  }
})();
