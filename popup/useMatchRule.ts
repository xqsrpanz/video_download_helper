import { ref, onMounted, watch } from 'vue'
import { useRules, type CompiledRule } from '@/hooks'

const location = ref<string>('')
const { getMatchingRule } = useRules()
const currentRule = ref<CompiledRule | null>(null)

export default function useMatchRule() {
  watch(
    [location, getMatchingRule],
    ([newLocation, newGetMatchingRule]) => {
      if (newGetMatchingRule && newLocation) {
        const matchingRule = newGetMatchingRule(newLocation)
        if (matchingRule) {
          currentRule.value = matchingRule
        }
      }
    }
  )

  onMounted(async () => {  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        location.value = tabs[0].url || ''
      }
    })
  })

  return { location, getMatchingRule, currentRule }
}
