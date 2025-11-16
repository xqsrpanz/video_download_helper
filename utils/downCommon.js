import { info, err } from './log.js';

async function getBufferFromURL(url, cookie) {
  info('getBufferFromURL begin, url:', url);
  const response = await fetch(url, {
    headers: {
      'Cookie': cookie,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  info('getBufferFromURL end, url:', url, 'size:', arrayBuffer.byteLength / 1024 / 1024, 'MB');
  return arrayBuffer;
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
      filename: `${name}.mp4`,
      saveAs: true,
    });
    info('downloadBlob end, name:', name);
  } catch (error) {
    err('downloadBlob error, name:', name, 'error:', error);
    throw error;
  }
}

export {
  getBufferFromURL,
  blobToDataURL,
  downloadBlob,
};
