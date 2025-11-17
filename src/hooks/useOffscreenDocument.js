/**
 * @typedef {Object} UseOffscreenDocumentParams
 * @property {string} path - Offscreen document 的相对路径，例如 "offscreen/index.html"
 * @property {string[]} [reasons] - 创建 offscreen document 的理由列表，见 Chrome offscreen API
 * @property {string} [justification] - 创建的理由描述
 */
/**
 * @param {UseOffscreenDocumentParams} params - 用于创建 offscreen document 的参数
 */

function useOffscreenDocument(params) {
  /** @type {Promise<void> | undefined} */
  let createpromise;
  const offscreenUrl = chrome.runtime.getURL(params.path);
  const createParams = {
    url: offscreenUrl,
    reasons: params?.reasons || [],
    justification: params?.justification || 'No justification provided',
  };

  return async function () { // 确认offscreen document是否加载
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });
    if (existingContexts.length > 0) return;

    if (createpromise) {
      await createpromise;
    } else {
      createpromise = chrome.offscreen.createDocument(createParams);
      await createpromise;
      createpromise = null;
    }
  };
};

const ensureFFmpegLoaded = useOffscreenDocument({
  path: '/offscreen/ffmpeg.html',
  reasons: ['WORKERS'],
  justification: 'ffmpeg need workers',
});

export {
  useOffscreenDocument,
  ensureFFmpegLoaded,
};