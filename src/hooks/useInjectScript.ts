import { useLog } from './useLog';
import { useRules } from './useRules';
import type { GetMatchingRule } from './useRules';

const { log, info, err } = useLog('[useInjectScript]');

let getMatchingRule: GetMatchingRule | null = null;

const injectedTabTracker = new Map();
async function ensureScriptsInjected(tabId: number, frameId = 0) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab || !tab.url) {
    return;
  }

  const hasInjected = injectedTabTracker.get(tabId);
  if (hasInjected) {
    return;
  }

  const matchedRule = getMatchingRule?.(tab.url);
  if (!matchedRule) {
    log('No Valid Rule for URL:', tab.url);
    injectedTabTracker.delete(tabId);
    return;
  } else {
    log('URL Matched Rule:', tab.url, matchedRule);
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
    if (changeInfo.status === 'complete') { // 页面加载完成，需要注入
      ensureScriptsInjected(tabId);
    }
  });
  chrome.webNavigation.onCommitted.addListener(({ tabId, frameId }) => {
    if (frameId === 0) { // 页面刷新，需要重新注入
      injectedTabTracker.delete(tabId);
    }
  });
  return { injectedTabTracker, ensureScriptsInjected };
}
