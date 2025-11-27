import { useLog } from '@/hooks';

const { time, timeEnd, err } = useLog('[DownCommon]', 'blue');

async function fetchUnit8ArrayFromURL(url: string, headers: Record<string, string>) {
  try {
    time(`fetchUnit8ArrayFromURL ${url}`);
    const response = await fetch(url, { headers });
    const arrayBuffer = await response.arrayBuffer();
    const unit8Array = new Uint8Array(arrayBuffer);
    timeEnd(`fetchUnit8ArrayFromURL ${url}`, 's', 'size:', unit8Array.byteLength / 1024 / 1024, 'MB');
    return unit8Array;
  } catch (error: any) {
    err(`fetchUnit8ArrayFromURL ${url} error: ${error?.message}`);
    throw error;
  }
}

async function blobToDataURL(blob: Blob) {
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
