// 引导装配（v5）：配置（含 v1 迁移）→ 屏蔽引擎 → 面板/触发器 → observer → 多标签同步。
// v5 行为修复：页面分类实时取自 location.href（SPA 首页→视频页跳转即时生效）。
import { onBodyReady } from './dom/arrive.js';
import { loadConfig, toRuntimeConfig, saveConfig, subscribe, loadInfoRecord, saveInfoRecord } from './config/store.js';
import { mergeTempEntries } from './config/temp-store.js';
import { createHideHandler } from './engine/hide-handler.js';
import { createHideEvent } from './engine/hide-event.js';
import { createScheduler } from './engine/scheduler.js';
import { createUsernameResolver } from './resolver/username-resolver.js';
import { createWwwPage } from './pages/www.js';
import { initPageTriggers } from './pages/triggers.js';
import { injectStyles } from './panel/styles.js';
import { createPanel } from './panel/panel.js';
import { initTrigger } from './panel/trigger.js';

export async function start() {
  await onBodyReady();
  injectStyles();

  // v1 存储在此自动迁移（备份键 + 写回），返回规范化 v2 存储形状
  const storageConfig = await loadConfig();
  let runtimeConfig = toRuntimeConfig(storageConfig);
  // 每次判定时现算合并临时词条（temp-store 恒为最新，保存/清空无需改动这里）
  const getConfig = () => mergeTempEntries(runtimeConfig);

  const hideHandler = createHideHandler({ getConfig });
  const initialInfoRecord = await loadInfoRecord();
  const resolveUsername = createUsernameResolver({ hideHandler, initialInfoRecord, saveInfoRecord });

  // hideEvent 的延迟绑定（面板回调在 hideEvent 定义前装配）
  let hideEventRef = () => {};

  const panel = createPanel({
    initialConfig: storageConfig,
    persist: saveConfig,
    onSaved: saved => {
      runtimeConfig = toRuntimeConfig(saved);
      hideEventRef();
    },
    onTempCleared: () => hideEventRef(),
  });
  panel.init();

  const homeExtra = createWwwPage({ hideHandler, resolveUsername });
  const hideEvent = createHideEvent({ getConfig, hideHandler, resolveUsername, homeExtra });
  hideEventRef = hideEvent;

  initTrigger({ onToggle: () => panel.toggle() });
  hideEvent(); // 首次执行

  const scheduleHideEvent = createScheduler(hideEvent);
  new MutationObserver(() => scheduleHideEvent()).observe(document.body, {
    childList: true,
    subtree: true,
  });
  initPageTriggers({ hideEvent });

  // 多标签页同步：远端变更 → 重建面板 + 替换配置 + 重跑屏蔽（临时词条不受影响）
  subscribe(remoteConfig => {
    panel.rebuild(remoteConfig);
    runtimeConfig = toRuntimeConfig(remoteConfig);
    hideEvent();
  });
}
