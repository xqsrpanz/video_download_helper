type Reason = NonNullable<chrome.offscreen.CreateParameters['reasons']>[number];

interface UseOffscreenDocumentParams {
  path: string;
  reasons?: Reason[];
  justification?: string;
}

function useOffscreenDocument(params: UseOffscreenDocumentParams) {
  let createpromise: Promise<void> | null = null;
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