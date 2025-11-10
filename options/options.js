const STORAGE_KEY = 'videoHelperUrlRules';
const DEFAULT_RULES = [
  {
    id: 'example',
    description: '示例规则：匹配 example.com/watch',
    pattern: 'https://example.com/watch*',
  },
];

const form = document.getElementById('rules-form');
const textarea = document.getElementById('rules-input');
const status = document.getElementById('status');

init().catch((error) => {
  console.error('[VideoHelper] 初始化设置页失败：', error);
  showStatus(`加载失败：${error.message}`, true);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const rules = JSON.parse(textarea.value);
    await chrome.storage.sync.set({ [STORAGE_KEY]: rules });
    showStatus('保存成功');
  } catch (error) {
    console.error('[VideoHelper] 保存规则失败：', error);
    showStatus(`保存失败：${error.message}`, true);
  }
});

async function init() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const rules = stored[STORAGE_KEY] ?? DEFAULT_RULES;
  textarea.value = JSON.stringify(rules, null, 2);
}

function showStatus(message, isError = false) {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.style.color = isError ? '#dc2626' : '#16a34a';
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}

