import { FFmpeg } from '@ffmpeg/ffmpeg';
import useLog from '../utils/useLog.js';
import { fetchUnit8ArrayFromURL } from '../utils/downCommon.js';

const { info, err, time, timeEnd } = useLog('[Offscreen][FFmpeg]', 'red');

/**
 * Offscreen document 入口脚本（仅提供“FFmpeg 服务”）：
 * - 自己内部维护一个 FFmpeg 单例实例
 * - 对外通过 chrome.runtime.onMessage 提供通用的 FFmpeg RPC 接口
 * - 不包含任何业务逻辑（不做下载、不做 URL 解析等）
 *
 * 建议的消息格式（从 background / popup / content 等发起）：
 * chrome.runtime.sendMessage({
 *   scope: 'FFMPEG_SERVICE',
 *   command: 'EXEC',        // 'EXEC' | 'WRITE_FILE' | 'GET_FILE_INFO' | 'GET_FILE_CHUNK' | ...
 *   payload: { ... }        // 每个 command 自己约定的参数
 * }, response => { ... });
 */

let ffmpegInstance = null;
let ffmpegLoadingPromise = null;

// 文件数据缓存，用于优化分块读取性能
const fileCache = new Map();

async function loadFFmpeg() {
  const baseURL = '/assets/deps/ffmpeg';
  const coreURL = `${baseURL}/ffmpeg-core.js`;
  const wasmURL = `${baseURL}/ffmpeg-core.wasm`;
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: chrome.runtime.getURL(coreURL),
    wasmURL: chrome.runtime.getURL(wasmURL),
  });
  return ffmpeg;
}

async function getFFmpegInstance() {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoadingPromise) return await ffmpegLoadingPromise;
  ffmpegLoadingPromise = loadFFmpeg();
  ffmpegInstance = await ffmpegLoadingPromise;
  return ffmpegInstance;
}


async function withFFmpeg(fn) {
  const ffmpeg = await getFFmpegInstance();
  return fn(ffmpeg);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.scope !== 'FFMPEG_SERVICE') {
    return false;
  }

  (async () => {
    try {
      const { command, payload } = message || {};

      switch (command) {
        case 'WRITE_FILE': {
          time(`WRITE_FILE ${payload?.name}`);
          const { name, url, headers } = payload || {};
          const buffer = await fetchUnit8ArrayFromURL(url, headers);
          info('write file fetch source end, name:', name, 'buffer size:', buffer.byteLength / 1024 / 1024, 'MB');
          await withFFmpeg((ffmpeg) => ffmpeg.writeFile(name, buffer));
          sendResponse({ success: true });
          timeEnd(`WRITE_FILE ${name}`, 's');
          break;
        }


        case 'EXEC': {
          time(`EXEC ${payload?.args?.join(' ')}`);
          const { args } = payload || {};
          await withFFmpeg((ffmpeg) => ffmpeg.exec(args));
          sendResponse({ success: true });
          timeEnd(`EXEC ${args?.join(' ')}`, 's');
          break;
        }

        case 'GET_FILE_INFO': {
          const { name, chunkSize = 10 * 1024 * 1024 } = payload || {};
          
          // 读取文件数据（如果缓存中没有）
          let data = fileCache.get(name);
          if (!data) {
            data = await withFFmpeg((ffmpeg) => ffmpeg.readFile(name));
            fileCache.set(name, data);
          }
          
          const fileSize = data.byteLength;
          const totalChunks = Math.ceil(fileSize / chunkSize);
          
          sendResponse({ 
            success: true, 
            fileSize, 
            chunkSize, 
            totalChunks 
          });
          break;
        }

        case 'GET_FILE_CHUNK': {
          const { name, chunkIndex, chunkSize } = payload || {};
          
          // 读取文件数据（如果缓存中没有）
          let data = fileCache.get(name);
          if (!data) {
            data = await withFFmpeg((ffmpeg) => ffmpeg.readFile(name));
            fileCache.set(name, data);
          }
          
          const fileSize = data.byteLength;
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, fileSize);
          const chunk = data.slice(start, end);
          
          // 将块转换为 base64 字符串传输
          const blob = new Blob([chunk]);
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result;
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          sendResponse({ 
            success: true, 
            chunkIndex, 
            chunkData: base64,
            chunkSize: chunk.byteLength
          });
          break;
        }

        case 'CLEAR_FILE_CACHE_AND_DONE': {
          const { name } = payload || {};
          if (name) {
            fileCache.delete(name);
          }
          sendResponse({ success: true });
          break;
        }

        default: {
          err('[Offscreen][FFMPEG_SERVICE] Unknown command:', command);
          sendResponse({
            success: false,
            error: `Unknown ffmpeg command: ${String(command)}`,
          });
        }
      }
    } catch (error) {
      err('[Offscreen][FFMPEG_SERVICE] Error while handling command:', error);
      sendResponse({
        success: false,
        error: error?.message || String(error),
      });
    }
  })();

  // 异步响应
  return true;
});

info('[Offscreen] FFmpeg offscreen script loaded, waiting for RPC calls...');
