import { useLog } from '@/hooks';

const { info, log } = useLog('[handleFromReq]');

export function handleFromReq(payload: any, sendResponse: (response: any) => void, tabId: number) {
  info(payload, tabId);
  const listener = (details: chrome.webRequest.OnBeforeRequestDetails): chrome.webRequest.BlockingResponse | undefined => {
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
              body: details.requestBody,
            }
          }
        });
        chrome.webRequest.onBeforeRequest.removeListener(listener);
      }
    }
    return undefined;
  };
  chrome.webRequest.onBeforeRequest.addListener(
    listener,
    {
      urls: ['<all_urls>'],
      tabId: tabId
    },
    ['requestBody']
  );
}