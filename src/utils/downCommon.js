import useLog from './useLog.js';
const { info, err, time, timeEnd } = useLog();

async function fetchUnit8ArrayFromURL(url, cookie) {
  time('fetchUnit8ArrayFromURL', 'url:', url);
  const response = await fetch(url, {
    headers: {
      'Cookie': cookie,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  const unit8Array = new Uint8Array(arrayBuffer);
  timeEnd('fetchUnit8ArrayFromURL', 's', 'url:', url, 'size:', unit8Array.byteLength / 1024 / 1024, 'MB');
  return unit8Array;
}

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadBlob(blob, name) {
  info('downloadBlob begin, name:', name);
  try {
    const dataURL = await blobToDataURL(blob);
    await chrome.downloads.download({
      url: dataURL,
      filename: name,
      saveAs: true,
    });
    info('downloadBlob end, name:', name);
  } catch (error) {
    err('downloadBlob error, name:', name, 'error:', error);
    throw error;
  }
}

export {
  fetchUnit8ArrayFromURL,
  blobToDataURL,
  downloadBlob,
};
