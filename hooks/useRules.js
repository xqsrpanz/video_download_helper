import { err, info, warn } from '../utils/log.js';
import { URL_RULES_STORAGE_KEY, DEFAULT_URL_RULES } from '../config/constants.js';

export function buildMatcher(pattern) {
  if (!pattern) {
    return () => false;
  }

  let regex;
  if (pattern instanceof RegExp) {
    regex = pattern;
  } else {
    throw new Error('Invalid pattern: ' + pattern);
  }

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
    const stored = await chrome.storage.sync.get(URL_RULES_STORAGE_KEY);
    let rules = DEFAULT_URL_RULES;
    if (stored[URL_RULES_STORAGE_KEY]) {
      rules = [...DEFAULT_URL_RULES, ...stored[URL_RULES_STORAGE_KEY]];
    }
    return compileRules(rules);
  } catch (error) {
    err('Failed to Load Rules:', error);
    return compileRules(DEFAULT_URL_RULES);
  }
}

export async function useRules() {
  let rules = await loadRules();
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes[URL_RULES_STORAGE_KEY]) {
      rules = await loadRules();
      info('URL Rules Configuration Updated.');
    }
  });
  const getMatchingRule = (url) => {
    return rules.find((rule) => {
      try {
        return rule.match(url);
      } catch (error) {
        warn(`URL Rule ${rule.id} Execution Failed:`, error);
        return false;
      }
    });
  };
  return { rules, getMatchingRule };
}
