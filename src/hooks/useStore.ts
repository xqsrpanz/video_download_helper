import { ref, watch, type Ref } from 'vue'

type StorageNamespace = 'local' | 'sync' | 'managed' | 'session'

export function useStore<T>(key: string, namespace: StorageNamespace = 'local', defaultValue?: T) {
  async function get(): Promise<T | null> {
    const stored = await chrome.storage[namespace].get(key)
    return stored[key] || defaultValue || null
  }
  function set(value: T) {
    return chrome.storage.local.set({ [key]: value })
  }
  function remove() {
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
  store.value = get()

  watch(store, async (value) => {
    const currentStoredValue = await get()
    if (currentStoredValue === value) return
    await set(value)
  }, { deep: true, immediate: true })

  chrome.storage.onChanged.addListener((changes, ns) => {
    for (const [changeKey, change] of Object.entries(changes)) {
      if (ns === namespace && changeKey === key) {
        store.value = change.newValue as T
      }
    }
  })

  return {
    store,
    get,
    set,
    remove
  }
}
