(() => {
  // 是否注入
  if (window?.isVideoDownloadHelperInjected) return;
  window.isVideoDownloadHelperInjected = true;

  // 函数声明
  // log
  function log(...message) {
    console.log('[PORNHUB]', ...message);
  }

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    const allowFroms = ['popup', 'isolated'];
    if (allowFroms.includes(event.data.from) && event.data.type === 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO') {
      try {
        const downloadId = event.data.downloadId;
        const name = document.querySelector('div.title-container > h1 > span')?.textContent ?? 'pornhub_video';

        window.postMessage({
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO',
          downloadId,
          from: 'main',
          payload: {
            type: 'FROM_REQ',
            downloadId,
            name: name.trim(),
            source: 'pornhub',
          }
        }, window.location.origin);
      } catch (error) {
        console.error('获取下载信息失败:', error);
        window.postMessage({ 
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO', 
          downloadId: event.data.downloadId,
          from: 'main',
          error: error.message
        }, window.location.origin);
      }
    }
  });
})();
