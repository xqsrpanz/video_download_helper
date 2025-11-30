import { reactive, computed, type ComputedRef } from 'vue'

type ComputedState<P extends Record<string, any>> = { [K in keyof P]: ComputedRef<P[K]> }

interface StateActions {
  [key: string]: (...args: any[]) => void
}

function withState<T extends StateActions, S extends Record<string, any>>(actions: T, state: S) {
  const computedState = Object.keys(state).reduce((memo, prop) => {
    memo[prop] = computed(() => state[prop])
    return memo
  }, {} as Record<string, any>) as ComputedState<S>
  return { ...computedState, ...actions }
}

const state = reactive({
  downloadInfo: [] as any[],
})

const stateActions = {
  addDownloadInfo: (info: any) => {
    if (!info?.downloadId) throw new Error('downloadId is required')
    state.downloadInfo.push(info)
  },
  delDownloadInfo: (downloadId: string) => {
    const index = state.downloadInfo.findIndex(item => item?.downloadId === downloadId)
    if (index !== -1) return
    state.downloadInfo.splice(index, 1)
  },
}

export function useStore() {
  return withState(stateActions, state)
}
