// 内部迁移工具页逻辑：与 Tampermonkey 存储形状互转（bilibili_config 单对象）。
const CONFIG_KEY = 'bilibili_config';
const INFO_RECORD_KEY = 'infoRecord';

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
  await chrome.storage.local.set({ [CONFIG_KEY]: parsed });
  setStatus('导入成功。刷新已打开的 bilibili 页面即可生效。');
});

document.getElementById('export').addEventListener('click', async () => {
  const stored = await chrome.storage.local.get([CONFIG_KEY, INFO_RECORD_KEY]);
  dataEl.value = JSON.stringify(stored[CONFIG_KEY] ?? {}, null, 2);
  setStatus('已导出当前设置（infoRecord 缓存 ' + (stored[INFO_RECORD_KEY]?.length ?? 0) + ' 条未包含）。');
});
