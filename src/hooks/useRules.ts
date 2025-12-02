import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';

import { useLog } from './useLog';
import { useEnsureScriptExists } from './useEnsureScriptExists.js';
import { useStoreRef } from './useStore.js';
import { URL_RULES_STORAGE_KEY, DEFAULT_URL_RULES, type RULE } from '@/config/constants';

const { err, info, warn } = useLog();

const ensureScriptExists = useEnsureScriptExists();

export function buildMatcher(pattern: RegExp) {
  if (!pattern) {
    return () => false;
  }

  let regex;
  if (pattern instanceof RegExp) {
    regex = pattern;
  } else {
    throw new Error('Invalid pattern: ' + pattern);
  }

  return (url: string) => regex.test(url);
}

async function resolveRuleScripts(rule: RULE) {
  if (Array.isArray(rule.scripts) && rule.scripts.length > 0) {
    return rule.scripts;
  }

  const baseScripts = ['content_scripts/isolated/injectDownBtn.js'];
  const candidateScript = `content_scripts/main/${rule.id}.js`;
  const fallbackScript = 'content_scripts/main/fallBack.js';

  const hasCandidateScript = await ensureScriptExists(candidateScript);

  if (!hasCandidateScript) {
    warn(`规则 ${rule.id} 未找到自定义脚本，回退至 ${fallbackScript}`);
  }

  return [...baseScripts, hasCandidateScript ? candidateScript : fallbackScript];
}

export async function compileRules(rules: RULE[] = []) {
  const compiledRules = await Promise.all(
    rules.map(async (rule) => {
      const { pattern } = rule;
      const urlPattern = pattern ?? '';
      const matcher = buildMatcher(urlPattern);
      const scripts = rule?.scripts ?? await resolveRuleScripts(rule);
      return {
        ...rule,
        scripts,
        match: matcher,
      };
    })
  );
  return compiledRules;
}
export type CompiledRule = Awaited<ReturnType<typeof compileRules>>[number];

export type GetMatchingRule = (url: string) => CompiledRule | false;

export type UseRulesReturnType = {
  rules: ComputedRef<CompiledRule[]>;
  getMatchingRule: Ref<GetMatchingRule>;
  setRules: (rules: RULE[]) => void;
};

export function useRules(): UseRulesReturnType {
  const { store: rawRules, set: setRawRules } = useStoreRef<RULE[]>(URL_RULES_STORAGE_KEY, 'local', DEFAULT_URL_RULES);
  const compiledRules = ref<CompiledRule[]>([]);
  const getMatchingRule = ref<GetMatchingRule>(() => false);
  
  watch(
    () => rawRules.value,
    async (rulesToCompile) => {
      compiledRules.value = await compileRules(rulesToCompile ?? DEFAULT_URL_RULES);
      getMatchingRule.value = (url: string) => {
        return compiledRules.value.find((rule) => {
          try {
            return rule.match(url);
          } catch (error) {
            warn(`URL Rule ${rule.id} Execution Failed:`, error);
            return false;
          }
        }) ?? false;
      };
    },
    { immediate: true, deep: true }
  );
  
  const rules = computed(() => compiledRules.value);

  function setRules(data: Partial<RULE>[]) {
    const res: RULE[] = rawRules.value ?? [];
    for (const rule of data) {
      const idx = rawRules.value?.findIndex((r) => r.id === rule.id) || -1;
      if (idx !== -1) {
        res[idx] = { ...rawRules.value?.[idx], ...rule } as RULE;
      } else {
        res.push(rule as RULE);
      }
    }
    setRawRules(res);
  }

  return { rules, getMatchingRule, setRules };
}
