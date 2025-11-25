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
    if (event.data.type === 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO') {
      try {
        const downloadId = event.data.downloadId;
        const name = document.querySelector('#videoTitle > span')?.textContent ?? 'pornhub_video';

        window.postMessage({
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_RES',
          downloadId,
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
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_ERR', 
          downloadId: event.data.downloadId,
          error: error.message
        }, window.location.origin);
      }
    }
  });
})();
