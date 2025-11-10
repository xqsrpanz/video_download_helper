(() => {
  const BUTTON_ID = 'video-helper-download-btn';

  if (document.getElementById(BUTTON_ID)) {
    console.debug('[VideoHelper] 按钮已存在，跳过注入。');
    return;
  }

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL('assets/styles/content.css');
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = '下载视频';

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.classList.add('video-helper__busy');
    try {
      const payload = await window.videoHelper?.prepareDownload?.();
      const response = await chrome.runtime.sendMessage({
        type: 'VIDEO_HELPER_DOWNLOAD',
        payload,
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? '未知错误');
      }
    } catch (error) {
      console.error('[VideoHelper] 触发下载失败：', error);
      alert(`触发下载失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.classList.remove('video-helper__busy');
    }
  });

  document.body.appendChild(button);

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content_scripts/downloader.js');
  script.type = 'module';
  document.documentElement.appendChild(script);
})();

