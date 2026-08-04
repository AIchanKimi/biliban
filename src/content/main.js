// 引导装配（v5.5）：配置（含迁移）→ 临时词条载入 → 屏蔽引擎 → 面板/触发器 → observer → 多标签同步。
// 页面分类实时取自 location.href（SPA 友好）；临时词条独立存储、带过期时间、跨标签同步。
import { onBodyReady } from "./dom/arrive.js";
import {
  loadConfig,
  toRuntimeConfig,
  saveConfig,
  subscribe,
} from "./config/store.js";
import {
  initTempStore,
  mergeTempEntries,
  subscribeTemp,
} from "./config/temp-store.js";
import { createHideHandler } from "./engine/hide-handler.js";
import { createHideEvent } from "./engine/hide-event.js";
import { createScheduler } from "./engine/scheduler.js";
import { injectStyles } from "./panel/styles.js";
import { createPanel } from "./panel/panel.js";
import { initTrigger } from "./panel/trigger.js";

export async function start() {
  await onBodyReady();
  injectStyles();

  // 存储迁移（备份键 + 写回）与临时词条载入（顺带清除过期项）
  const initialConfig = await loadConfig();
  await initTempStore();

  let storageShape = initialConfig; // 存储形状（面板 rebuild 用）
  let runtimeConfig = toRuntimeConfig(initialConfig);
  // 每次判定时现算合并临时词条（过期项自动被过滤）
  const getConfig = () => mergeTempEntries(runtimeConfig);

  const hideHandler = createHideHandler({ getConfig });

  // hideEvent 的延迟绑定（面板回调在 hideEvent 定义前装配）
  let hideEventRef = () => {};

  const panel = createPanel({
    initialConfig: storageShape,
    persist: saveConfig,
    onSaved: (saved) => {
      storageShape = saved;
      runtimeConfig = toRuntimeConfig(saved);
      hideEventRef();
    },
  });
  panel.init();

  const hideEvent = createHideEvent({ getConfig, hideHandler });
  hideEventRef = hideEvent;

  initTrigger({ onToggle: () => panel.toggle() });
  hideEvent(); // 首次执行

  const scheduleHideEvent = createScheduler(hideEvent);
  new MutationObserver(() => scheduleHideEvent()).observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 多标签页同步：配置远端变更 → 重建面板 + 替换配置 + 重跑屏蔽
  subscribe((remoteConfig) => {
    storageShape = remoteConfig;
    panel.rebuild(remoteConfig);
    runtimeConfig = toRuntimeConfig(remoteConfig);
    hideEvent();
  });

  // 临时词条远端变更（其他标签页增删）→ 镜像已在 temp-store 内更新，重建面板并重跑
  subscribeTemp(() => {
    panel.rebuild(storageShape);
    hideEvent();
  });
}
