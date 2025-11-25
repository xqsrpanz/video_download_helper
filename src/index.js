import useLog from './utils/useLog.js';
import { useInjectScript } from './hooks/index.js';
import handleDownloadFromSeparateURL from './utils/handleDownloadFromSeparateURL.js';

const { info } = useLog();

useInjectScript();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SEPERATE_URL' && message?.payload) {
    handleDownloadFromSeparateURL(message.payload, sendResponse, sender.tab?.id);
    return true;
  }
  if (message?.type === 'SYSTEM_NOTIFY' && message?.payload) {
    const basicOptions = {
      type: 'basic',
      title: '[VideoDownloadHelper] 系统通知',
      message: message.payload?.message ?? 'Unknown message',
      iconUrl: chrome.runtime.getURL('assets/icons/video_download_helper_icon_128.png'),
      requireInteraction: false, // 设置为 true 可以让通知保持显示直到用户点击
      priority: 2, // 0-2，2 是最高优先级
      silent: false // 确保有声音提示
    };
    chrome.notifications.create({ ...basicOptions, ...message.payload });
    return true;
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  info('扩展已安装，等待匹配页面注入脚本');
});
