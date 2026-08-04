// 引导装配：配置 → 屏蔽引擎 → 面板/触发器 → observer → 页面触发器 → 多标签同步。
// OLD_URL 只在启动时捕获一次（对等原脚本，不跟踪 SPA 跳转）。
import { onBodyReady } from './dom/arrive.js';
import {
  loadRaw,
  normalize,
  toRuntimeConfig,
  saveConfig,
  subscribe,
  loadInfoRecord,
  saveInfoRecord,
} from './config/store.js';
import { createHideHandler } from './engine/hide-handler.js';
import { createHideEvent } from './engine/hide-event.js';
import { createScheduler } from './engine/scheduler.js';
import { createUsernameResolver } from './resolver/username-resolver.js';
import { createWwwPage } from './pages/www.js';
import { createDynamicsPage } from './pages/dynamics.js';
import { createMessageReplyPage } from './pages/message-reply.js';
import { createLiveChatPage } from './pages/live-chat.js';
import { createHideComment } from './pages/hide-comment.js';
import { initPageTriggers } from './pages/triggers.js';
import { injectStyles } from './panel/styles.js';
import { createPanel } from './panel/panel.js';
import { initTrigger } from './panel/trigger.js';
import { createButtonFactory } from './buttons/button-factory.js';

export async function start() {
  const oldUrl = location.href;
  await onBodyReady();
  injectStyles();

  const { rawConfig } = await loadRaw();
  const storageConfig = normalize(rawConfig);
  let currentConfig = toRuntimeConfig(rawConfig);
  const getConfig = () => currentConfig;

  const hideHandler = createHideHandler({ getConfig });
  const initialInfoRecord = await loadInfoRecord();
  const resolveUsername = createUsernameResolver({ hideHandler, initialInfoRecord, saveInfoRecord });

  // hideEvent 的延迟绑定（面板 onSaved 回调在 hideEvent 定义前装配）
  let hideEventRef = () => {};

  const panel = createPanel({
    initialConfig: storageConfig,
    persist: saveConfig,
    onSaved: saved => {
      currentConfig = toRuntimeConfig(saved);
      hideEventRef();
    },
  });
  panel.init();

  const { createBlockBtn, createBigBangBtn } = createButtonFactory({ saveFromDom: () => panel.save() });

  const hideComment = createHideComment({ getConfig, hideHandler, createBlockBtn, createBigBangBtn });
  const pages = {
    www: createWwwPage({ hideHandler, resolveUsername }),
    dynamics: createDynamicsPage({ getConfig, hideHandler, hideComment }),
    messageReply: createMessageReplyPage({ getConfig, hideHandler }),
    liveChat: createLiveChatPage({ hideHandler }),
    hideComment,
  };

  const hideEvent = createHideEvent({ oldUrl, hideHandler, resolveUsername, pages });
  hideEventRef = hideEvent;

  initTrigger({ onToggle: () => panel.toggle() });
  hideEvent(); // 首次执行（对等 target.js 711）

  const scheduleHideEvent = createScheduler(hideEvent);
  new MutationObserver(() => scheduleHideEvent()).observe(document.body, {
    childList: true,
    subtree: true,
  });
  initPageTriggers({ oldUrl, hideEvent });

  // 多标签页同步（对等 GM_addValueChangeListener）：远端变更 → 重建面板 + 重跑屏蔽
  subscribe(remoteConfig => {
    panel.rebuild(remoteConfig);
    currentConfig = toRuntimeConfig(remoteConfig);
    hideEvent();
  });
}
