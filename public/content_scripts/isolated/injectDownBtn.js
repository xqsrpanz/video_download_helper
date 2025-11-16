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
    const downloadId = crypto.randomUUID();

    const listenerForPrepareDownloadInfo = (event) => {
      const allowedTypes = ['VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_RESPONSE', 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO_ERROR'];
      if (!allowedTypes.includes(event.data.type) || event.data.downloadId !== downloadId) return;

      if (event.data.type === allowedTypes[0]) {
        console.log('[injectDownBtn] sending message to background', event.data.payload);
        chrome.runtime.sendMessage({
          type: event.data.payload.type,
          downloadId,
          payload: event.data.payload,
        }, (response) => {
          console.log('[injectDownBtn] received response from background', response);
          if (!response.success && response.error) {
            alert(response.error.message);
          }
          downloadFinalCallback();
        });
      } else if (event.data.type === allowedTypes[1]) {
        alert(event.data.error.message);
        downloadFinalCallback();
      }
    };

    window.addEventListener('message', listenerForPrepareDownloadInfo);
    window.postMessage({ type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO', downloadId }, window.location.origin);

    const downloadFinalCallback = () => {
      button.disabled = false;
      button.classList.remove('video-helper__busy');
      button.textContent = originalText;
      window.removeEventListener('message', listenerForPrepareDownloadInfo);
    };
  });

  document.body.appendChild(button);
})();
