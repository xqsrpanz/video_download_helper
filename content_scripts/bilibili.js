(() => {
  if (window?.videoDownloadHelper?.downloadVideo) {
    console.info('downloadVideo already exists, skipping injection.');
    return;
  }
  window.videoDownloadHelper.downloadVideo = async () => {
    
  };
})();
