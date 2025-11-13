(() => {
  if (window?.videoDownloadHelper?.downloadVideo) {
    console.info('downloadVideo already exists, skipping injection.');
    return;
  }
  window.videoDownloadHelper.downloadVideo = async () => {
    throw new Error('There is no implemented downloadVideo function.');
  };
})();
