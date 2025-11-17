import { info, err } from './log.js';
import { getBufferFromURL, downloadBlob } from './downCommon.js';
import { ensureFFmpegLoaded } from '../hooks/useOffscreenDocument.js';

export default async function handleDownloadFromSeparateURL(payload, sendResponse) {
  info('download begin, download type: SEPERATE_URL, payload:', payload);
  try {
    const { videoURL, audioURL, name, cookie, option = 0 } = payload;
    if (!videoURL || !audioURL) {
      throw new Error('视频或音频 URL 缺失');
    }

    await ensureFFmpegLoaded();

    // 使用 Promise 包装 sendMessage 以正确处理异步响应
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { scope: 'FFMPEG_SERVICE', command: 'LOAD', payload: {} },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'FFmpeg 实例加载失败'));
          }
        }
      );
    });

    info('FFmpeg 实例加载成功', response);
    return;

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

async function mux(videoBuffer, audioBuffer) {
  info('合并原始数据开始');
  // TODO: 合并原始数据
  return audioBuffer; // TODO: 合并原始数据
}
