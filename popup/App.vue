<template>
  <div class="popup-container">这是 Popup Vue 页面！ {{ count }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<style scoped>
.popup-container {
  width: 200px;
  height: 300px;
  background-color: #fff;
}
</style>
