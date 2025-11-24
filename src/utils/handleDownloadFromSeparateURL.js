import useLog from './useLog.js';
import rpc from './rpc.js';
import { ensureFFmpegLoaded } from '../hooks/useOffscreenDocument.js';

const { info, err } = useLog();

export default async function handleDownloadFromSeparateURL(payload, sendResponse, tabId) {
  info('download begin, download type: SEPERATE_URL, payload:', payload);
  try {
    const { videoURL, audioURL, name, cookie, downloadId } = payload;
    if (!videoURL || !audioURL) {
      throw new Error('视频或音频 URL 缺失');
    }

    if (!tabId) {
      throw new Error('缺少 tabId，无法通知 content script 下载文件');
    }

    await ensureFFmpegLoaded();

    const videoPromise = rpc({ scope: 'FFMPEG_SERVICE', command: 'WRITE_FILE', payload: {
      name: `${downloadId}_video.m4s`,
      url: videoURL,
      cookie,
    }});

    const audioPromise = rpc({ scope: 'FFMPEG_SERVICE', command: 'WRITE_FILE', payload: {
      name: `${downloadId}_audio.m4s`,
      url: audioURL,
      cookie,
    }});

    await Promise.all([videoPromise, audioPromise]);

    await rpc({ scope: 'FFMPEG_SERVICE', command: 'EXEC', payload: {
      args: ['-i', `${downloadId}_video.m4s`, '-i', `${downloadId}_audio.m4s`, '-vcodec', 'copy', '-acodec', 'copy', `${downloadId}.mp4`],
    }});

    sendResponse({ success: true, message: '视频合成完成，开始分块下载...', payload: {
      type: 'FROM_FFMPEG',
      fileName: name,
      ffmpegFileName: `${downloadId}.mp4`,
    } });
  } catch (error) {
    err('下载任务失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}
