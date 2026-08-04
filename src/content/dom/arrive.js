// arrive.js 的自研替代：等待 <body> 就绪（替代原脚本 @require arrive@2.4.1 的
// document.arrive('body', ...) 用法）。其余元素到达监听由 main.js 的 MutationObserver 承担。

/**
 * 等待 <body> 就绪，返回 body 元素。
 * @returns {Promise<HTMLElement>}
 */
export function onBodyReady() {
  return new Promise((resolve) => {
    if (document.body) {
      resolve(document.body);
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        resolve(document.body);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}
