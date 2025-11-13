// import { err, info, warn } from '../utils/log.js';
import { useInjectScript } from '../hooks/index.js';

useInjectScript();

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message?.type === 'VIDEO_HELPER_DOWNLOAD' && sender.tab?.id) {
//     handleDownloadRequest(sender.tab.id, message.payload)
//       .then((result) => sendResponse({ ok: true, result }))
//       .catch((error) => {
//         err('Download Task Failed:', error);
//         sendResponse({ ok: false, error: error.message });
//       });
//     return true;
//   }
//   return false;
// });

// async function handleDownloadRequest(tabId, payload) {
//   const downloadUrl = payload?.url ?? (await resolveDownloadUrl(tabId));

//   if (!downloadUrl) {
//     throw new Error('No Downloadable URL Provided, Please Check the Parsing Logic.');
//   }

//   const filename = payload?.filename ?? `download-${Date.now()}.mp4`;

//   return chrome.downloads.download({
//     url: downloadUrl,
//     filename,
//     saveAs: true,
//   });
// }

// async function resolveDownloadUrl(tabId) {
//   warn(
//     'resolveDownloadUrl Not Implemented, Please Implement the Logic in content_scripts/downloader.js.'
//   );
//   const tab = await chrome.tabs.get(tabId);
//   return tab?.url ?? null;
// }

// chrome.runtime.onInstalled.addListener(() => {
//   info('Extension Installed, Waiting for Matched Pages to Inject Scripts.');
// });
