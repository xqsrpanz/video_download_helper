import useLog from './utils/useLog.js';
import { useInjectScript } from './hooks/index.js';
import handleDownloadFromSeparateURL from './utils/handleDownloadFromSeparateURL.js';

const { info } = useLog();

useInjectScript();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SEPERATE_URL' && message?.payload) {
    handleDownloadFromSeparateURL(message.payload, sendResponse);
    return true; // 保持消息通道开放以支持异步响应
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  info('扩展已安装，等待匹配页面注入脚本');
});
