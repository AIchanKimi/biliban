// 内部迁移工具页逻辑（v5）：导入接受 v1（含油猴原形状，自动迁移）或 v2 JSON；导出 v2。
import { isCurrentVersion } from '../content/config/migrate.js';
import { normalize } from '../content/config/store.js';
import { CONFIG_KEY, INFO_RECORD_KEY } from '../content/config/defaults.js';

const dataEl = document.getElementById('data');
const statusEl = document.getElementById('status');

function setStatus(message) {
  statusEl.textContent = message;
}

function isValidConfig(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

document.getElementById('import').addEventListener('click', async () => {
  const raw = dataEl.value.trim();
  if (!raw) {
    setStatus('请先粘贴 JSON 内容。');
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    setStatus('JSON 解析失败：' + error.message);
    return;
  }
  if (!isValidConfig(parsed)) {
    setStatus('内容不是有效的配置对象。');
    return;
  }
  const migrated = !isCurrentVersion(parsed);
  const config = normalize(parsed);
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
  setStatus(
    migrated
      ? '导入成功：已从旧版本形状自动迁移（v1 的评论/白名单等废弃内容被丢弃；v2 的用户名/关键字已合并为屏蔽词）。刷新已打开的 bilibili 页面即可生效。'
      : '导入成功。刷新已打开的 bilibili 页面即可生效。'
  );
});

document.getElementById('export').addEventListener('click', async () => {
  const stored = await chrome.storage.local.get([CONFIG_KEY, INFO_RECORD_KEY]);
  dataEl.value = JSON.stringify(normalize(stored[CONFIG_KEY] ?? null), null, 2);
  setStatus('已导出当前设置（infoRecord 缓存 ' + (stored[INFO_RECORD_KEY]?.length ?? 0) + ' 条未包含）。');
});
