(() => {
  // 是否注入
  const BUTTON_ID = 'video-helper-download-btn';
  if (document.getElementById(BUTTON_ID)) {
    console.info('download button already exists, skipping injection.');
    return;
  }

  // 准备Button
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL('assets/styles/content.css');
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  const buttonText = 'Download';
  button.textContent = buttonText;

  // 通用函数声明
  // log
  function log(...message) {
    console.log('[injectDownBtn]', ...message);
  }
  // RPC
  async function rpc(message) {
    log('[RPC][BACKGROUND][SEND]', message);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          log('[RPC][BACKGROUND][RECEIVE]', response);
          resolve(response);
        }
      });
    });
  }
  // RPC to Main Process
  async function rpcToMainProcess(message) {
    log('[RPC][MAIN][SEND]', message);
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.source !== window) return;
        const sendType = message.type;
        const allowTypes = [`${sendType}_RES`, `${sendType}_ERR`];
        if (allowTypes.includes(event.data.type) && event.data.downloadId === message.downloadId) {
          // 立即移除监听器，防止重复触发
          window.removeEventListener('message', listener);
          if (event.data?.error) {
            reject(new Error(event.data.error));
          } else {
            log('[RPC][MAIN][RECEIVE]', event.data);
            resolve(event.data);
          }
        }
      };
      window.addEventListener('message', listener);
      window.postMessage(message, window.location.origin);
    });
  }
  // 系统通知
  function notify(payload) {
    rpc({ type: 'SYSTEM_NOTIFY', payload });
  }
  // 下载最终回调
  const downloadFinalCallback = () => {
    button.disabled = false;
    button.classList.remove('video-helper__busy');
    button.textContent = buttonText;
  };
  // 获取下载信息
  async function getDownloadInfo(downloadId) {
    let fileHandle = null;
    let fileName = null;
    let downloadInfo = null;

    try {
      downloadInfo = await rpcToMainProcess({ type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO', downloadId, from: 'isolated' });
      fileHandle = await window.showSaveFilePicker({
        suggestedName: downloadInfo.payload.name,
        types: [{
          description: '视频文件',
          accept: {
            'video/mp4': ['.mp4'],
          },
        }],
      });
      fileName = fileHandle.name;
      downloadInfo.payload = { ...downloadInfo.payload, name: fileName };
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw new Error('无法打开文件选择器: ' + error.message);
      }
      throw new Error('取消下载');
    }
    if (!fileHandle || !fileName || !downloadInfo) throw new Error('getDownloadInfo unknown error');
    return { fileHandle, fileName, downloadInfo };
  }
  // 获取块并写入句柄 TODO: 并发下载
  async function getChunksAndWriteToHandle(fileHandle, startIdx, reqFunc, isEnd) {
    const MAX_RETRY_COUNT = 3;
    const writable = await fileHandle.createWritable();
    let index = startIdx;
    while (true) {
      let retryCount = 0;
      let res = null, err = null;
      while (retryCount < MAX_RETRY_COUNT) {
        try {
          res = await reqFunc(index);
          break;
        } catch (error) {
          retryCount++;
          err = error;
        }
      }
      if (!res && err) throw err;

      if (isEnd(index, res)) {
        break;
      }
      await writable.write(res);
      index++;
    }
    await writable.close();
  }

  // 特殊函数声明
  // 从ffmpeg的处理结果分块下载 // TODO: 将写入磁盘部分使用getChunksAndWriteToHandle处理
  async function handleFFmpegDown({ ffmpegFileName }, savedFileHandle, savedFileName) {
    // 获取文件信息
    const { fileSize, chunkSize, totalChunks } = await rpc({
      scope: 'FFMPEG_SERVICE',
      command: 'GET_FILE_INFO',
      payload: { name: ffmpegFileName }
    });

    console.log(`[VideoDownloadHelper] 开始流式下载: ${savedFileName || ffmpegFileName}, 大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB, 共 ${totalChunks} 块`);

    const writable = await savedFileHandle.createWritable();

    try {
      // 按顺序逐个获取块并写入
      for (let i = 0; i < totalChunks; i++) {
        const { chunkData } = await rpc({
          scope: 'FFMPEG_SERVICE',
          command: 'GET_FILE_CHUNK',
          payload: { name: ffmpegFileName, chunkIndex: i, chunkSize }
        });

        // 将 base64 转换为 Uint8Array
        const binaryString = atob(chunkData);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        await writable.write(bytes);

        if (i % 10 === 0 || i === totalChunks - 1) {
          console.log(`[VideoDownloadHelper] 写入进度: ${i + 1}/${totalChunks} 块`);
        }
      }

      await writable.close();
      console.log(`[VideoDownloadHelper] 文件已保存: ${savedFileHandle.name}`);

      // 清除缓存
      await rpc({
        scope: 'FFMPEG_SERVICE',
        command: 'CLEAR_FILE_CACHE_AND_DONE',
        payload: { name: ffmpegFileName }
      });
    } catch (error) {
      await writable.close();
      await rpc({ scope: 'FFMPEG_SERVICE', command: 'CLEAR_FILE_CACHE_AND_DONE', payload: { name: ffmpegFileName } });
      throw error;
    }
  }
  // 从模板链接获取请求函数
  function useRequestFunc(source, template) {
    log('[useRequestFunc]', source, template);
    const { url: rawUrl, method, headers, body } = template;
    const err = (msg = `useRequestFunc error: unknown source ${source}`) => { throw new Error(msg); };
    const reqFunc = async (index) => {
      let url = rawUrl;
      if (source === 'pornhub') {
        url = rawUrl.replace(/seg-\d+(-[^/?#]*\.ts)/, `seg-${index}$1`);
        const res = await fetch(url, { method, headers, body });
        if (res.status !== 200) {
          if (res.status == 472) {
            err('Received status 472: Rate limit exceeded. Consider adding delays between requests.');
            return '472';
          }
          if (res.status == 404) {
            return 'EOF';
          }
          err(`Unexpected error in reqFunc, source: ${source}, status code: ${res.status}`);
        }
        const blob = await res.arrayBuffer();
        return new Uint8Array(blob);
      }
      err();
    };
    const getStartIdx = () => {
      if (source === 'pornhub') {
        return 1;
      }
      err();
    };
    const isEnd = (index, res) => {
      if (source === 'pornhub') {
        return res === '472' || res === 'EOF';
      }
      err();
    };
    return { reqFunc, getStartIdx, isEnd };
  }

  button.addEventListener('click', async () => {
    try {
      button.disabled = true;
      button.classList.add('video-helper__busy');
      button.innerHTML = '<span class="video-helper__spinner"></span>';
      const downloadId = crypto.randomUUID();

      // 从页面注入脚本获取下载信息
      const { fileHandle, fileName, downloadInfo } = await getDownloadInfo(downloadId);
      // 从background获取处理结果
      const { payload } = await rpc({ type: downloadInfo.payload.type, payload: downloadInfo.payload });

      if (payload.type === 'FROM_FFMPEG') {
        await handleFFmpegDown(payload, fileHandle, fileName);
      }

      if (payload.type === 'FROM_REQUEST_TEMPLATE') {
        log('[FROM_REQUEST_TEMPLATE]', payload);
        const { reqFunc, getStartIdx, isEnd } = useRequestFunc(payload?.source, payload?.template);
        await getChunksAndWriteToHandle(fileHandle, getStartIdx(), reqFunc, isEnd);
      }

      notify({ message: `${fileName} 下载完成` });
    } catch (error) {
      notify({ message: `下载失败: ${error.message}` });
    } finally {
      downloadFinalCallback();
    }
  });

  document.body.appendChild(button);
})();
