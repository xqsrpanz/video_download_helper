import useLog from '../utils/useLog.js';
import { URL_RULES_STORAGE_KEY, DEFAULT_URL_RULES } from '../config/constants.js';
import useEnsureScriptExists from './useEnsureScriptExists.js';

const { err, info, warn } = useLog();

const ensureScriptExists = useEnsureScriptExists();

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

async function resolveRuleScripts(rule) {
  if (Array.isArray(rule.scripts) && rule.scripts.length > 0) {
    return rule.scripts;
  }

  const baseScripts = ['content_scripts/isolated/injectDownBtn.js'];
  const candidateScript = `content_scripts/main/${rule.id}.js`;
  const fallbackScript = 'content_scripts/main/fallBack.js';

  const hasCandidateScript = await ensureScriptExists(candidateScript);

  if (!hasCandidateScript) {
    warn(`规则 ${rule.id} 未找到自定义脚本，回退至 ${fallbackScript}`);
  }

  return [...baseScripts, hasCandidateScript ? candidateScript : fallbackScript];
}

export async function compileRules(rules = []) {
  const compiledRules = await Promise.all(
    rules.map(async (rule) => {
      const { pattern } = rule;
      const urlPattern = pattern ?? '';
      const matcher = buildMatcher(urlPattern);
      const scripts = rules?.scripts ?? await resolveRuleScripts(rule);
      return {
        ...rule,
        scripts,
        match: matcher,
      };
    })
  );
  return compiledRules;
}

export async function loadRules() {
  try {
    const stored = await chrome.storage.sync.get(URL_RULES_STORAGE_KEY);
    let rules = DEFAULT_URL_RULES;
    if (stored[URL_RULES_STORAGE_KEY]) {
      for (const rule of stored[URL_RULES_STORAGE_KEY]) {
        const idx = rules.findIndex((r) => r.id === rule.id);
        if (idx !== -1) {
          rules[idx] = rule;
        } else {
          rules.push(rule);
        }
      }
    }
    return await compileRules(rules);
  } catch (error) {
    err('Failed to Load Rules:', error);
    return await compileRules(DEFAULT_URL_RULES);
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
