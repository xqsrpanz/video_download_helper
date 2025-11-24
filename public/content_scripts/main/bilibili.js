(() => {
  // 是否注入
  if (window?.isVideoDownloadHelperInjected) return;
  window.isVideoDownloadHelperInjected = true;

  // 函数声明
  // log
  function log(...message) {
    console.log('[BILIBILI]', ...message);
  }

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO') {
      try {
        const __playinfo__ = window.__playinfo__;
        if (!__playinfo__?.data?.dash) {
          throw new Error('无法获取视频信息，请确保页面已完全加载');
        }
        
        const videoURL = __playinfo__.data.dash.video[0].base_url;
        const audioURL = __playinfo__.data.dash.audio[0].base_url;
        const name = document.querySelector('#viewbox_report > div.video-info-title > div > h1')?.textContent || 'bilibili_video';
        const cookie = document.cookie;
        const downloadId = event.data.downloadId;
        log('[VARS]', { videoURL, audioURL, name, cookie, downloadId });
        window.postMessage({
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_RES',
          downloadId,
          payload: {
            type: 'SEPERATE_URL',
            downloadId,
            videoURL,
            audioURL,
            name: name.trim(),
            cookie,
            option: 0, // 0: 下载全部并合并, 1: 仅音频, 2: 仅视频            
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
