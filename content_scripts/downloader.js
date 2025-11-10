if (!window.videoHelper) {
  window.videoHelper = {};
}

window.videoHelper.prepareDownload = async () => {
  console.info('[VideoHelper] 使用默认下载逻辑，请在 downloader.js 中自定义。');

  const directMediaElement =
    document.querySelector('video[src]') || document.querySelector('a.download');

  if (directMediaElement?.src) {
    return {
      url: directMediaElement.src,
      filename: extractFilenameFromUrl(directMediaElement.src),
    };
  }

  return {
    url: window.location.href,
    filename: `video-${Date.now()}.mp4`,
  };
};

function extractFilenameFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const candidate = pathname.split('/').pop();
    if (candidate) {
      return decodeURIComponent(candidate);
    }
  } catch (error) {
    console.warn('[VideoHelper] 无法解析文件名，将使用默认命名。', error);
  }
  return `video-${Date.now()}.mp4`;
}

