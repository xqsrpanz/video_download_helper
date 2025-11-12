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
    console.log('no matched rule', tab.url);
    injectedTabTracker.delete(tabId);
    return;
  } else {
    console.log('matched rule', tab.url, matchedRule);
  }

  const hasInjected = injectedTabTracker.get(tabId);
  if (hasInjected) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: matchedRule.scripts,
    });
    injectedTabTracker.set(tabId, true);
    console.info(
      `[VideoHelper] 已向标签 ${tabId} 注入脚本：${matchedRule.scripts.join(', ')}`
    );
  } catch (error) {
    console.error('[VideoHelper] 注入脚本失败：', error);
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
