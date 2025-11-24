import useLog from './useLog.js';

const { time, timeEnd } = useLog('[DownCommon]', 'blue');

async function fetchUnit8ArrayFromURL(url, cookie) {
  time(`fetchUnit8ArrayFromURL ${url}`);
  const response = await fetch(url, {
    headers: {
      'Cookie': cookie,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  const unit8Array = new Uint8Array(arrayBuffer);
  timeEnd(`fetchUnit8ArrayFromURL ${url}`, 's', 'size:', unit8Array.byteLength / 1024 / 1024, 'MB');
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

export {
  fetchUnit8ArrayFromURL,
  blobToDataURL,
};
