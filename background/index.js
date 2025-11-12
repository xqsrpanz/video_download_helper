import { useInjectScript } from '../hooks/index.js';

useInjectScript();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'VIDEO_HELPER_DOWNLOAD' && sender.tab?.id) {
    handleDownloadRequest(sender.tab.id, message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => {
        console.error('[VideoHelper] 下载任务失败：', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }
  return false;
});

async function handleDownloadRequest(tabId, payload) {
  const downloadUrl = payload?.url ?? (await resolveDownloadUrl(tabId));

  if (!downloadUrl) {
    throw new Error('未提供可下载的 URL，请检查解析逻辑。');
  }

  const filename = payload?.filename ?? `download-${Date.now()}.mp4`;

  return chrome.downloads.download({
    url: downloadUrl,
    filename,
    saveAs: true,
  });
}

async function resolveDownloadUrl(tabId) {
  console.warn(
    '[VideoHelper] resolveDownloadUrl 尚未实现，请在 content_scripts/downloader.js 中补充逻辑。'
  );
  const tab = await chrome.tabs.get(tabId);
  return tab?.url ?? null;
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('[VideoHelper] 扩展已安装，等待匹配页面注入脚本。');
});
