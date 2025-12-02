import { ref, watch } from 'vue'
import { useLog } from './useLog'

type StorageNamespace = 'local' | 'sync' | 'managed' | 'session'

const { warn } = useLog('[useStore]')

export function useStore<T>(key: string, namespace: StorageNamespace = 'local', defaultValue?: T) {
  async function get(): Promise<T | null> {
    if (!chrome?.storage?.[namespace]) {
      warn(`chrome.storage.${namespace} is not available`)
      return defaultValue || null
    }
    const stored = await chrome.storage[namespace].get(key)
    return stored[key] || defaultValue || null
  }
  function set(value: T) {
    if (!chrome?.storage?.[namespace]) {
      warn(`chrome.storage.${namespace} is not available`)
      return Promise.resolve()
    }
    return chrome.storage[namespace].set({ [key]: value })
  }
  function remove() {
    if (!chrome?.storage?.[namespace]) {
      warn(`chrome.storage.${namespace} is not available`)
      return Promise.resolve()
    }
    return chrome.storage[namespace].remove(key)
  }

  return {
    get,
    set,
    remove
  }
}

export function useStoreRef<T>(key: string, namespace: StorageNamespace = 'local', defaultValue?: T) {
  const { get, set, remove } = useStore(key, namespace, defaultValue)
  const store = ref<T | null>(null)
  get().then(value => {
    store.value = value
  })

  watch(store, async (value) => {
    const currentStoredValue = await get()
    if (JSON.stringify(currentStoredValue) === JSON.stringify(value)) return
    await set(value)
  }, { deep: true, immediate: true })

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, ns) => {
      for (const [changeKey, change] of Object.entries(changes)) {
        if (ns === namespace && changeKey === key) {
          store.value = change.newValue as T
        }
      }
    })
  } else {
    warn('chrome.storage.onChanged is not available')
  }

  return {
    store,
    get,
    set,
    remove
  }
}
