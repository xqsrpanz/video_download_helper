import useLog from './useLog.js';

const { info, log } = useLog('[handleFromReq]');

export default function handleFromReq(payload, sendResponse, tabId) {
  info(payload, tabId);
  const listener = (details) => {
    if (payload.source === 'pornhub') {
      if (/seg-.*\.ts/.test(details.url)) {
        log('Found match:', details.url);
        sendResponse({
          success: true,
          message: '找到模板链接，开始下载...',
          payload: {
            ...payload,
            type: 'FROM_REQUEST_TEMPLATE',
            template: {
              url: details.url,
              method: details.method,
              headers: details.headers,
              body: details.body,
            }
          }
        });
        chrome.webRequest.onBeforeRequest.removeListener(listener);
      }
    }
  };
  chrome.webRequest.onBeforeRequest.addListener(listener, {
    urls: ['<all_urls>'],
    tabId: tabId
  });
}