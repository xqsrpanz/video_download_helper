<template>
  <div>这是 Options Vue 页面！ {{ count }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>
