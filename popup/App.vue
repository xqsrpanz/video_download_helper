<template>
  <div class="popup-container">
    <component :is="currentComponent" />
  </div>
</template>

<script setup lang="ts">
import useMatchRule from './useMatchRule'
import useGetComponent from './useGetComponent'

const { currentRule } = useMatchRule()
const currentComponent = useGetComponent(() => currentRule.value?.id)
</script>

<style scoped>
.popup-container {
  width: fit-content;
  height: fit-content;
  white-space: nowrap;
  padding: 16px;
  background-color: #fff;
}
</style>
