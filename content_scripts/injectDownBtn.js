(() => {
  const BUTTON_ID = 'video-helper-download-btn';

  if (document.getElementById(BUTTON_ID)) {
    console.info('download button already exists, skipping injection.');
    return;
  }

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL('assets/styles/content.css');
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Download';

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.classList.add('video-helper__busy');
    const originalText = button.textContent;
    button.innerHTML = '<span class="video-helper__spinner"></span>';
    console.log('post message to window');
    const downloadId = crypto.randomUUID();
    window.postMessage({ type: 'VIDEO_HELPER_DOWNLOAD', downloadId }, window.location.origin);
    window.addEventListener('message', (event) => {
      if (event.data.type === 'VIDEO_HELPER_DOWNLOAD_COMPLETE' && event.data.downloadId === downloadId) {
        button.disabled = false;
        button.classList.remove('video-helper__busy');
        button.textContent = originalText;
      }
    });
  });

  document.body.appendChild(button);
})();
