export const URL_RULES_STORAGE_KEY = 'VideoDownloadHelper:URLRules';
export const DEFAULT_URL_RULES = [
  {
    id: 'bilibili',
    description: '匹配 bilibili.com 的所有视频页面',
    pattern: /bilibili\.com\/video/,
  },
  {
    id: 'pornhub',
    description: '匹配 pornhub.com 的所有视频页面',
    pattern: /pornhub\.com\/view_video\.php\?viewkey=\w+/,
  }
];
export const LOG_PREFIX = '[VideoDownloadHelper]';
