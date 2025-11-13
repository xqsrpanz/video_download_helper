(() => {
  const BUTTON_ID = 'video-helper-download-btn';

  if (document.getElementById(BUTTON_ID)) {
    console.info('按钮已存在，跳过注入。');
    return;
  }

  if (!window?.videoDownloadHelper) {
    window.videoDownloadHelper = {};
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
      await window?.videoDownloadHelper?.downloadVideo?.();
    } catch (error) {
      console.error('触发下载失败：', error);
      alert(`触发下载失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.classList.remove('video-helper__busy');
    }
  });

  document.body.appendChild(button);
})();
