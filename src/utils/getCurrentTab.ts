export function getCurrentTab(): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) {
        reject(new Error('未找到活动标签页'));
      }
      resolve(tabs[0]?.id);
    });
  });
}
