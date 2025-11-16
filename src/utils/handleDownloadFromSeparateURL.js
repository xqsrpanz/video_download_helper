import { info, err } from './log.js';
import { getBufferFromURL, downloadBlob } from './downCommon.js';

export default async function handleDownloadFromSeparateURL(payload, sendResponse) {
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

async function mux(videoBuffer, audioBuffer) {
  info('合并原始数据开始');
  // TODO: 合并原始数据
  return audioBuffer; // TODO: 合并原始数据
}
