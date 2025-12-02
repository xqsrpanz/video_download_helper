import { IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY } from '@/config/constants'
import { useStore } from './useStore'

const timeout = 3 * 1000
const optionsPageUrl = chrome.runtime.getURL('options/index.html')

const { get: getIsOptionsPageMounted } = useStore<boolean>(IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY, 'local', false)

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
  const isOptionsPageMounted = await getIsOptionsPageMounted()
  if (isOptionsPageMounted && pageAlreadyOpened) {
    return Promise.resolve(true)
  }
  let resolver: (value: boolean) => void
  let resolved = false
  const listener = (message: any, sender: any, sendResponse: any) => {
    if (message?.type === 'OPTIONS_PAGE_MOUNTED') {
      chrome.runtime.onMessage.removeListener(listener)
      resolver(true)
      resolved = true
    }
  }
  return new Promise((resolve, reject) => {
    resolver = resolve
    if (!pageAlreadyOpened) chrome.runtime.openOptionsPage()
    chrome.runtime.onMessage.addListener(listener)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener)
      if (resolved) return
      reject(new Error('Options page not mounted'))
    }, timeout)
  })
}

export function useEnsureOptionsPageMounted() {
  return { ensureOptionsPageMounted }
}
