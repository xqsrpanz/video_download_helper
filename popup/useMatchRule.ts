import { ref, onMounted, watch } from 'vue'
import { useRules, type GetMatchingRule, type CompiledRule } from '@/hooks'

const location = ref<string>('')
const getMatchingRule = ref<GetMatchingRule | null>(null)
const currentRule = ref<CompiledRule | null>(null)

export default function useMatchRule() {
  watch(
    [location, getMatchingRule],
    ([newLocation, newGetMatchingRule]) => {
      if (newGetMatchingRule && newLocation && currentRule.value === null) {
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
    const rulesResult = await useRules()
    getMatchingRule.value = rulesResult.getMatchingRule
  })

  return { location, getMatchingRule, currentRule }
}
