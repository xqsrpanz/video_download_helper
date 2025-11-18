import useLog from './useLog.js';
import { downloadBlob } from './downCommon.js';
import rpc from './rpc.js';
import { ensureFFmpegLoaded } from '../hooks/useOffscreenDocument.js';

const { info, err } = useLog();

export default async function handleDownloadFromSeparateURL(payload, sendResponse) {
  info('download begin, download type: SEPERATE_URL, payload:', payload);
  try {
    const { videoURL, audioURL, name, cookie, option = 0 } = payload;
    if (!videoURL || !audioURL) {
      throw new Error('视频或音频 URL 缺失');
    }

    await ensureFFmpegLoaded();

    const uuid = crypto.randomUUID();

    await rpc({ scope: 'FFMPEG_SERVICE', command: 'WRITE_FILE', payload: {
      name: `${uuid}_video.m4s`,
      url: videoURL,
      cookie,
    }});

    await rpc({ scope: 'FFMPEG_SERVICE', command: 'WRITE_FILE', payload: {
      name: `${uuid}_audio.m4s`,
      url: audioURL,
      cookie,
    }});

    // const resultBuffer = await mux(videoBuffer, audioBuffer);
    // const resultBlob = new Blob([resultBuffer], { type: 'video/mp4' });
    // await downloadBlob(resultBlob, `${name}.mp4`);

    // info('下载任务完成, download type: SEPERATE_URL, 文件名:', `${name}.mp4`);
    sendResponse({ success: true, message: '下载任务完成' });
  } catch (error) {
    err('下载任务失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}
