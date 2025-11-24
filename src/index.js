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
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  info('扩展已安装，等待匹配页面注入脚本');
});
