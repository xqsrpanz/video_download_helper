import useLog from '../utils/useLog.js';
const { warn } = useLog();

export default function useEnsureScriptExists() {
  const scriptExistenceCache = new Map();
  return async (scriptPath) => {
    if (scriptExistenceCache.has(scriptPath)) {
      return scriptExistenceCache.get(scriptPath);
    }
    try {
      const url = chrome.runtime.getURL(scriptPath);
      const response = await fetch(url, { method: 'GET' });
      const exists = response.ok;
      scriptExistenceCache.set(scriptPath, exists);
      return exists;
    } catch (error) {
      warn(`检测脚本 ${scriptPath} 是否存在失败:`, error);
      scriptExistenceCache.set(scriptPath, false);
      return false;
    }
  };
}