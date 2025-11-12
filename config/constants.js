export const URL_RULES_STORAGE_KEY = 'VideoDownloadHelper:URLRules';
export const DEFAULT_URL_RULES = [
  {
    id: 'bilibili',
    description: '匹配 bilibili.com 的所有视频页面',
    pattern: /bilibili\.com\/video/,
  },
];
export const LOG_PREFIX = '[VideoDownloadHelper]';
