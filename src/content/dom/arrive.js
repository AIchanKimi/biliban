// arrive.js 的自研替代：基于 MutationObserver 的元素到达监听。
// 替代原脚本 @require arrive@2.4.1 的全部用法：
//   - document.arrive('body', ...)                     → onBodyReady()
//   - body.arrive('.manga-panel .btn-change', ...) 等  → arrive(root, selector, opts, cb)

/**
 * 等待 <body> 就绪，返回 body 元素。
 * @returns {Promise<HTMLElement>}
 */
export function onBodyReady() {
  return new Promise(resolve => {
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
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

/**
 * 监听 root 子树中匹配 selector 的元素出现。
 * @param {Node} root 观察根节点
 * @param {string} selector CSS 选择器
 * @param {{ onceOnly?: boolean, existing?: boolean, fireOnAttributesModification?: boolean }} options
 * @param {(element: Element) => void} callback
 * @returns {() => void} unbind
 */
export function arrive(root, selector, options, callback) {
  const { onceOnly = true, existing = true, fireOnAttributesModification = false } = options ?? {};
  const fired = new WeakSet();

  const fire = element => {
    if (fired.has(element)) {
      return;
    }
    fired.add(element);
    callback(element);
    if (onceOnly) {
      unbind();
    }
  };

  const scanNode = node => {
    if (!(node instanceof Element)) {
      return;
    }
    if (node.matches(selector)) {
      fire(node);
    }
    for (const element of node.querySelectorAll(selector)) {
      fire(element);
    }
  };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const added of mutation.addedNodes) {
          scanNode(added);
        }
      } else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        // 属性变更可能使元素新近匹配选择器（对等 fireOnAttributesModification）
        if (mutation.target.matches(selector)) {
          fire(mutation.target);
        }
      }
    }
  });

  const observerInit = { childList: true, subtree: true };
  if (fireOnAttributesModification) {
    observerInit.attributes = true;
    observerInit.attributeFilter = ['class'];
  }
  observer.observe(root, observerInit);

  const unbind = () => observer.disconnect();

  if (existing) {
    scanNode(root instanceof Element ? root : root.documentElement ?? root);
  }

  return unbind;
}
