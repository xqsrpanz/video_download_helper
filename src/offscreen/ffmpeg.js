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
 *   command: 'EXEC',        // 'EXEC' | 'WRITE_FILE' | 'READ_FILE' | ...
 *   payload: { ... }        // 每个 command 自己约定的参数
 * }, response => { ... });
 */

let ffmpegInstance = null;
let ffmpegLoadingPromise = null;

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
          time('WRITE_FILE', 'name:', payload?.name);
          const { name, url, cookie } = payload || {};
          const buffer = await fetchUnit8ArrayFromURL(url, cookie);
          info('write file fetch source end, name:', name, 'buffer size:', buffer.byteLength / 1024 / 1024, 'MB');
          await withFFmpeg((ffmpeg) => ffmpeg.writeFile(name, buffer));
          sendResponse({ success: true });
          timeEnd('WRITE_FILE', 's', 'name:', name);
          break;
        }

        case 'READ_FILE': {
          const { path } = payload || {};
          const data = await withFFmpeg((ffmpeg) => ffmpeg.readFile(path));
          sendResponse({ success: true, data });
          break;
        }

        case 'EXEC': {
          const { args } = payload || {};
          await withFFmpeg((ffmpeg) => ffmpeg.exec(args));
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
