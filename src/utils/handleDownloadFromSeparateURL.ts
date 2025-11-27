import { rpc } from './rpc';
import { useLog, ensureFFmpegLoaded } from '@/hooks';

const { info, err } = useLog('[handleDownloadFromSeparateURL]');

export async function handleDownloadFromSeparateURL(payload: any, sendResponse: (response: any) => void, tabId: number) {
  info('download begin, download type: SEPERATE_URL, payload:', payload);
  try {
    const { videoURL, audioURL, name, headers, downloadId } = payload;
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
      headers,
    }});

    const audioPromise = rpc({ scope: 'FFMPEG_SERVICE', command: 'WRITE_FILE', payload: {
      name: `${downloadId}_audio.m4s`,
      url: audioURL,
      headers,
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
  } catch (error: any) {
    err('下载任务失败:', error);
    sendResponse({ success: false, error: error?.message });
  }
}
