import { STORAGE_KEY, DEFAULT_RULES } from './constants.js';

export function buildMatcher(pattern) {
  if (!pattern) {
    return () => false;
  }
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return (url) => regex.test(url);
}
  
export function compileRules(rules = []) {
  return rules.map((rule) => {
    const { pattern, scripts = ['content_scripts/injector.js'] } = rule;
    const urlPattern = pattern ?? '';
    const matcher = buildMatcher(urlPattern);
    return {
      ...rule,
      scripts,
      match: matcher,
    };
  });
}

export async function loadRules() {
  try {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    let rules = DEFAULT_RULES;
    if (stored[STORAGE_KEY]) {
      rules = [...DEFAULT_RULES, ...stored[STORAGE_KEY]];
    }
    return compileRules(rules);
  } catch (error) {
    console.error('[VideoHelper] 加载规则失败：', error);
    return compileRules(DEFAULT_RULES);
  }
}

export async function useRules() {
  let rules = await loadRules();
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes[STORAGE_KEY]) {
      rules = await loadRules();
      console.info('[VideoHelper] 已更新 URL 规则配置。');
    }
  });
  const getMatchingRule = (url) => {
    return rules.find((rule) => {
      try {
        return rule.match(url);
      } catch (error) {
        console.warn(`[VideoHelper] URL 规则 ${rule.id} 执行失败：`, error);
        return false;
      }
    });
  };
  return { rules, getMatchingRule };
}
