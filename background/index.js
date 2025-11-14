import { err, info, warn } from '../utils/log.js';
import { useInjectScript } from '../hooks/index.js';

useInjectScript();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SEPERATE_URL' && message?.payload) {
    info('download type: SEPERATE_URL', message);
    handleDownloadRequest(message.payload)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => {
        err('下载任务失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放以支持异步响应
  }
  return false;
});

/**
 * 处理下载请求
 * @param {Object} payload - 包含 videoURL, audioURL, name, cookie, option
 */
async function handleDownloadRequest(payload) {
  const { videoURL, audioURL, name, cookie, option = 0 } = payload;

  if (!videoURL || !audioURL) {
    throw new Error('视频或音频 URL 缺失');
  }

  info('开始下载任务:', { name, option });

  try {
    if (option === 0) {
      // 下载全部并合并
      return await downloadAndMerge(videoURL, audioURL, name, cookie);
    } else if (option === 1) {
      // 仅下载音频
      return await downloadSingleFile(audioURL, `${name}.mp3`, cookie);
    } else if (option === 2) {
      // 仅下载视频
      return await downloadSingleFile(videoURL, `${name}.mp4`, cookie);
    }
  } catch (error) {
    err('下载处理失败:', error);
    throw error;
  }
}

/**
 * 下载单个文件
 */
async function downloadSingleFile(url, filename, cookie) {
  // 使用 chrome.downloads API 直接下载，避免内存开销
  // 需要通过 fetch 添加 cookie，然后创建 blob URL
  const downloadId = await downloadWithCookie(url, filename, cookie);
  info('文件下载已启动:', { filename, downloadId });
  return { downloadId, filename };
}

/**
 * 使用 cookie 下载文件（流式下载，减少内存占用）
 * 由于 chrome.downloads.download 不能直接设置 cookie，我们需要通过 fetch 创建 blob URL
 * 优化：使用流式读取，避免一次性加载整个文件到内存
 */
async function downloadWithCookie(url, filename, cookie) {
  try {
    // 在 Service Worker 中使用 fetch 获取流
    const response = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': navigator.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 使用流式读取，避免一次性加载到内存
    // 注意：虽然还是需要最终创建 blob，但使用流可以更好地控制内存
    const reader = response.body.getReader();
    const chunks = [];
    let totalSize = 0;
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    info('开始流式下载:', { filename, contentLength });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalSize += value.length;
        
        // 可以在这里添加进度回调
        if (contentLength > 0 && totalSize % (1024 * 1024 * 5) === 0) {
          // 每 5MB 输出一次进度（可选）
          info(`下载进度: ${((totalSize / contentLength) * 100).toFixed(1)}%`);
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 将流数据合并为 blob
    const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);

    info('文件下载完成，开始保存:', { filename, size: totalSize });

    // 使用 chrome.downloads API 下载
    const downloadId = await chrome.downloads.download({
      url: blobUrl,
      filename: sanitizeFilename(filename),
      saveAs: true,
      conflictAction: 'uniquify'
    });

    // 下载完成后清理 blob URL（监听下载完成事件）
    chrome.downloads.onChanged.addListener(function listener(delta) {
      if (delta.id === downloadId && delta.state?.current === 'complete') {
        URL.revokeObjectURL(blobUrl);
        chrome.downloads.onChanged.removeListener(listener);
        info('文件已保存，已清理内存:', { filename });
      } else if (delta.id === downloadId && delta.state?.current === 'interrupted') {
        URL.revokeObjectURL(blobUrl);
        chrome.downloads.onChanged.removeListener(listener);
        warn('下载中断，已清理内存:', { filename });
      }
    });

    return downloadId;
  } catch (error) {
    err('下载文件失败:', error);
    throw error;
  }
}

/**
 * 下载并合并音频和视频
 * 尝试使用流式合并，如果不可行则分别下载
 */
async function downloadAndMerge(videoURL, audioURL, name, cookie) {
  try {
    // 尝试流式合并
    const merged = await tryStreamMerge(videoURL, audioURL, name, cookie);
    if (merged) {
      return merged;
    }

    // 如果流式合并不可行，回退到分别下载
    warn('流式合并不可行，将分别下载音频和视频');
    const videoId = await downloadWithCookie(videoURL, `${name}_video.temp`, cookie);
    const audioId = await downloadWithCookie(audioURL, `${name}_audio.temp`, cookie);
    
    info('音视频文件下载已启动，请使用以下 FFmpeg 命令合并:');
    const ffmpegCmd = `ffmpeg -i "${name}_video.temp" -i "${name}_audio.temp" -vcodec copy -acodec copy "${name}.mp4"\nrm "${name}_video.temp"\nrm "${name}_audio.temp"`;
    console.log(ffmpegCmd);
    
    return { 
      videoId, 
      audioId, 
      ffmpegCommand: ffmpegCmd,
      merged: false 
    };
  } catch (error) {
    err('合并下载失败:', error);
    throw error;
  }
}

/**
 * 尝试使用流式合并音频和视频
 * 这是一个实验性功能，因为需要解析和重建 MP4 格式
 */
async function tryStreamMerge(videoURL, audioURL, name, cookie) {
  try {
    // 并行获取两个流
    const [videoResponse, audioResponse] = await Promise.all([
      fetch(videoURL, {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://www.bilibili.com/',
          'User-Agent': navigator.userAgent
        }
      }),
      fetch(audioURL, {
        headers: {
          'Cookie': cookie,
          'Referer': 'https://www.bilibili.com/',
          'User-Agent': navigator.userAgent
        }
      })
    ]);

    if (!videoResponse.ok || !audioResponse.ok) {
      return null;
    }

    // 获取完整数据
    const [videoBlob, audioBlob] = await Promise.all([
      videoResponse.blob(),
      audioResponse.blob()
    ]);

    // 尝试合并 MP4
    // 注意：这是一个简化实现，可能不适用于所有情况
    const mergedBlob = await mergeMP4Streams(videoBlob, audioBlob);
    
    if (mergedBlob) {
      const blobUrl = URL.createObjectURL(mergedBlob);
      const downloadId = await chrome.downloads.download({
        url: blobUrl,
        filename: sanitizeFilename(`${name}.mp4`),
        saveAs: true,
        conflictAction: 'uniquify'
      });

      chrome.downloads.onChanged.addListener(function listener(delta) {
        if (delta.id === downloadId && (delta.state?.current === 'complete' || delta.state?.current === 'interrupted')) {
          URL.revokeObjectURL(blobUrl);
          chrome.downloads.onChanged.removeListener(listener);
        }
      });

      info('流式合并成功');
      return { downloadId, filename: `${name}.mp4`, merged: true };
    }

    return null;
  } catch (error) {
    warn('流式合并失败，将回退到分别下载:', error);
    return null;
  }
}

/**
 * 合并两个 MP4 流
 * 
 * 在浏览器中直接合并 MP4 流是一个复杂的问题，因为需要：
 * 1. 解析 MP4 文件结构（ftyp, moov, mdat, trak boxes 等）
 * 2. 合并音视频轨道的元数据
 * 3. 重建文件头和索引
 * 
 * 可行的方案：
 * 1. **使用 ffmpeg.wasm**（推荐，但会增加插件体积 20-30MB）
 *    - 需要在 content script 或 options page 中使用
 *    - Service Worker 对 WASM 支持有限
 * 
 * 2. **使用 MP4Box.js**（体积较小，但功能有限）
 *    - 可以解析和操作 MP4 格式
 *    - 合并功能需要额外实现
 * 
 * 3. **服务端合并**（最佳性能，但需要服务器）
 *    - 将流发送到后端，使用 FFmpeg 合并后返回
 * 
 * 4. **提示用户使用本地 FFmpeg**（当前方案）
 *    - 分别下载音频和视频
 *    - 提供 FFmpeg 命令供用户执行
 * 
 * 当前实现返回 null，回退到分别下载的方案
 */
async function mergeMP4Streams(videoBlob, audioBlob) {
  warn('直接合并 MP4 流需要复杂的格式解析或额外的库支持');
  warn('当前版本不支持直接合并，将回退到分别下载方案');
  warn('如需实现流式合并，建议使用 ffmpeg.wasm 或服务端方案');
  
  return null;
  
  // TODO: 如果将来要实现，可以参考以下方案：
  // 
  // 方案 1: 使用 ffmpeg.wasm（在 content script 中使用）
  // ```javascript
  // import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
  // const ffmpeg = createFFmpeg({ log: true });
  // await ffmpeg.load();
  // ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoURL));
  // ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioURL));
  // await ffmpeg.run('-i', 'video.mp4', '-i', 'audio.mp3', '-c', 'copy', 'output.mp4');
  // const data = ffmpeg.FS('readFile', 'output.mp4');
  // return new Blob([data.buffer], { type: 'video/mp4' });
  // ```
  //
  // 方案 2: 使用 MP4Box.js 手动合并
  // 需要解析两个文件的 boxes，合并 moov box，重建 mdat
}

/**
 * 清理文件名，移除非法字符
 */
function sanitizeFilename(filename) {
  // Windows 文件名非法字符: < > : " / \ | ? *
  return filename.replace(/[<>:"/\\|?*]/g, '_');
}

chrome.runtime.onInstalled.addListener(() => {
  info('扩展已安装，等待匹配页面注入脚本');
});
