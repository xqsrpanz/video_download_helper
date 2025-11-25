(() => {
  // 是否注入
  if (window?.isVideoDownloadHelperInjected) return;
  window.isVideoDownloadHelperInjected = true;

  // 函数声明
  // log
  function log(...message) {
    console.log('[BILIBILI]', ...message);
  }
  // getURL
  function getMcdnURL(list) {
    for (const item of list) {
      const urls = [item?.base_url, item?.baseUrl, ...item?.backup_url ?? [], ...item?.backupUrl ?? []];
      for (const url of urls) {
        if (url?.includes('mcdn.bilivideo.cn')) {
          return url;
        }
      }
    }
    return null;
  }

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO') {
      try {
        const __playinfo__ = window.__playinfo__;
        if (!__playinfo__?.data?.dash) {
          throw new Error('无法获取视频信息，请确保页面已完全加载');
        }
        
        const videoURL = getMcdnURL(__playinfo__.data.dash.video);
        const audioURL = getMcdnURL(__playinfo__.data.dash.audio);
        const name = document.querySelector('#viewbox_report > div.video-info-title > div > h1')?.textContent || 'bilibili_video';
        const headers = {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'cookie': document.cookie,
          'Referer': window.location.href,
        };
        const downloadId = event.data.downloadId;

        if (!videoURL || !audioURL) {
          throw new Error('该视频没有支持此种下载方式的源');
        }

        window.postMessage({
          type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_RES',
          downloadId,
          payload: {
            type: 'SEPERATE_URL',
            downloadId,
            videoURL,
            audioURL,
            name: name.trim(),
            headers,
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
