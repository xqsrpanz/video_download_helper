const timeout = 3 * 1000
const optionsPageUrl = chrome.runtime.getURL('options/index.html')

let isOptionsPageMounted = false

async function findAndFocusOptionsPage(): Promise<boolean> {
  const tabs = await chrome.tabs.query({ url: optionsPageUrl })
  if (tabs.length > 0) {
    // 找到已打开的选项页面，聚焦到第一个
    const tab = tabs[0]
    if (tab.id && tab.windowId) {
      await chrome.tabs.update(tab.id, { active: true })
      await chrome.windows.update(tab.windowId, { focused: true })
      return true
    }
  }
  return false
}

async function ensureOptionsPageMounted(): Promise<boolean> {
  const pageAlreadyOpened = await findAndFocusOptionsPage()
  if (isOptionsPageMounted && pageAlreadyOpened) {
    return Promise.resolve(true)
  }
  let resolver: (value: boolean) => void
  const listener = (message: any, sender: any, sendResponse: any) => {
    if (message?.type === 'OPTIONS_PAGE_MOUNTED') {
      chrome.runtime.onMessage.removeListener(listener)
      isOptionsPageMounted = true
      resolver(true)
    }
  }
  return new Promise((resolve, reject) => {
    resolver = resolve
    if (!pageAlreadyOpened) chrome.runtime.openOptionsPage()
    chrome.runtime.onMessage.addListener(listener)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener)
      reject(new Error('Options page not mounted'))
    }, timeout)
  })
}

export function useEnsureOptionsPageMounted() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'OPTIONS_PAGE_UNMOUNTED') {
      isOptionsPageMounted = false
    }
  })
  return { ensureOptionsPageMounted }
}
