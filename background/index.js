const STORAGE_KEY = 'videoHelperUrlRules';
const DEFAULT_RULES = [
  {
    id: 'example',
    description: '示例：匹配 example.com/watch',
    pattern: 'https://example.com/watch*',
  },
];

let urlRules = compileRules(DEFAULT_RULES);

const injectedTabTracker = new Map();

function getMatchingRule(url) {
  return urlRules.find((rule) => {
    try {
      return rule.match(url);
    } catch (error) {
      console.warn(`[VideoHelper] URL 规则 ${rule.id} 执行失败：`, error);
      return false;
    }
  });
}

async function ensureScriptsInjected(tabId, frameId = 0) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab || !tab.url) {
    return;
  }

  const matchedRule = getMatchingRule(tab.url);
  if (!matchedRule) {
    injectedTabTracker.delete(tabId);
    return;
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    ensureScriptsInjected(tabId).catch((error) => {
      console.error('[VideoHelper] ensureScriptsInjected 异常：', error);
    });
  } else if (changeInfo.url) {
    injectedTabTracker.delete(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'VIDEO_HELPER_DOWNLOAD' && sender.tab?.id) {
    handleDownloadRequest(sender.tab.id, message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => {
        console.error('[VideoHelper] 下载任务失败：', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }
  return false;
});

async function handleDownloadRequest(tabId, payload) {
  const downloadUrl = payload?.url ?? (await resolveDownloadUrl(tabId));

  if (!downloadUrl) {
    throw new Error('未提供可下载的 URL，请检查解析逻辑。');
  }

  const filename = payload?.filename ?? `download-${Date.now()}.mp4`;

  return chrome.downloads.download({
    url: downloadUrl,
    filename,
    saveAs: true,
  });
}

async function resolveDownloadUrl(tabId) {
  console.warn(
    '[VideoHelper] resolveDownloadUrl 尚未实现，请在 content_scripts/downloader.js 中补充逻辑。'
  );
  const tab = await chrome.tabs.get(tabId);
  return tab?.url ?? null;
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('[VideoHelper] 扩展已安装，等待匹配页面注入脚本。');
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes[STORAGE_KEY]) {
    urlRules = compileRules(changes[STORAGE_KEY].newValue ?? DEFAULT_RULES);
    console.info('[VideoHelper] 已更新 URL 规则配置。');
  }
});

loadRulesFromStorage().catch((error) => {
  console.error('[VideoHelper] 初始化规则失败，使用默认规则。', error);
});

function compileRules(rules = []) {
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

function buildMatcher(pattern) {
  if (!pattern) {
    return () => false;
  }
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return (url) => regex.test(url);
}

async function loadRulesFromStorage() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const rules = stored[STORAGE_KEY] ?? DEFAULT_RULES;
  urlRules = compileRules(rules);
}

