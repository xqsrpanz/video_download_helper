import { log, err, info, warn } from '../utils/log.js';
import { useInjectScript } from '../hooks/index.js';

useInjectScript();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SEPERATE_URL' && message?.payload) {
    handleDownloadFromSeparateURL(message.payload, sendResponse);
    return true; // 保持消息通道开放以支持异步响应
  }
  return false;
});

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadBlob(blob, name) {
  const dataURL = await blobToDataURL(blob);
  return chrome.downloads.download({
    url: dataURL,
    filename: `${name}.mp4`,
    saveAs: true,
  });
}

async function handleDownloadFromSeparateURL(payload, sendResponse) {
  info('download begin, download type: SEPERATE_URL, payload:', payload);

  try {
    const { videoURL, audioURL, name, cookie, option = 0 } = payload;
    if (!videoURL || !audioURL) {
      throw new Error('视频或音频 URL 缺失');
    }

    const [videoBuffer, audioBuffer] = await Promise.all([
      getBufferFromURL(videoURL, cookie),
      getBufferFromURL(audioURL, cookie),
    ]);

    const resultBuffer = await mux(videoBuffer, audioBuffer);
    const resultBlob = new Blob([resultBuffer], { type: 'video/mp4' });
    await downloadBlob(resultBlob, `${name}.mp4`);

    info('下载任务完成, download type: SEPERATE_URL, 文件名:', `${name}.mp4`);
    sendResponse({ success: true, message: '下载任务完成' });
  } catch (error) {
    err('下载任务失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getBufferFromURL(url, cookie) {
  info('获取原始数据开始, url:', url);
  const response = await fetch(url, {
    headers: {
      'Cookie': cookie,
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  info('获取原始数据完成, url:', url, '大小:', arrayBuffer.byteLength / 1024 / 1024, 'MB');
  return arrayBuffer;
}

async function mux(videoBuffer, audioBuffer) {
  info('合并原始数据开始');
  // TODO: 合并原始数据
}

chrome.runtime.onInstalled.addListener(() => {
  info('扩展已安装，等待匹配页面注入脚本');
});
