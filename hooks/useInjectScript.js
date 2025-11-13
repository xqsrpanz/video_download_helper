import { log, info, err } from '../utils/log.js';
import { useRules } from './useRules.js';

let getMatchingRule = null;

const injectedTabTracker = new Map();
async function ensureScriptsInjected(tabId, frameId = 0) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab || !tab.url) {
    return;
  }

  const matchedRule = getMatchingRule(tab.url);
  if (!matchedRule) {
    log('No Valid Rule for URL:', tab.url);
    injectedTabTracker.delete(tabId);
    return;
  } else {
    log(`URL ${tab.url} Matched Rule:`, matchedRule);
  }

  const hasInjected = injectedTabTracker.get(tabId);
  if (hasInjected) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: [matchedRule.scripts?.[0]],
    });
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: matchedRule.scripts?.slice(1) ?? [],
      world: 'MAIN',
    });
    injectedTabTracker.set(tabId, true);
    info(
      `Injected Scripts to Tab ${tabId}:`,
      matchedRule.scripts.join(', ')
    );
  } catch (error) {
    err('Failed to Inject Scripts:', error);
  }
}

export async function useInjectScript() {
  const { getMatchingRule: getMatchingRuleResult } = await useRules();
  getMatchingRule = getMatchingRuleResult;
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      ensureScriptsInjected(tabId);
    } else if (changeInfo.url) {
      injectedTabTracker.delete(tabId);
    }
  });
  return { injectedTabTracker, ensureScriptsInjected };
}
