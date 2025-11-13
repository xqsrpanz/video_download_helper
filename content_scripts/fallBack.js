(() => {
  if (window?.videoDownloadHelper?.downloadVideo) {
    console.info('downloadVideo already exists, skipping injection.');
    return;
  }

  if (!window?.videoDownloadHelper) {
    window.videoDownloadHelper = {};
  }

  window.videoDownloadHelper.downloadVideo = async () => {
    throw new Error('There is no implemented downloadVideo function.');
  };
})();
