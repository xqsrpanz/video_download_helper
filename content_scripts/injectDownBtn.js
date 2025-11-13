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
    console.log('post message to window');
    window.postMessage({ type: 'VIDEO_HELPER_DOWNLOAD' }, '*');
    button.disabled = false;
    button.classList.remove('video-helper__busy');
  });

  document.body.appendChild(button);
})();
