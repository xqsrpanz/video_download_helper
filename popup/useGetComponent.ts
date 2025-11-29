import { ref, watch } from 'vue'

import Fallback from './components/Fallback.vue'
import Pornhub from './components/Pornhub/index.vue'
import BiliBili from './components/BiliBili/index.vue'

const componentMap: Record<string, any> = {
  bilibili: BiliBili,
  pornhub: Pornhub,
  fallback: Fallback,
}

const currentComponent = ref<any>(null)

export default function useGetComponent(id: () => string | undefined | null) {
  watch(id, (newId) => {
    currentComponent.value = componentMap[newId || 'fallback']
  }, { immediate: true })

  return currentComponent
}
