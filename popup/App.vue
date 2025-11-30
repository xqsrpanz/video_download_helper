<template>
  <div class="popup-container">
    <component :is="currentComponent" />
    <Button
      class="mt-2"
      type="primary"
      :loading="loading"
      @click="handleDownload"
    >{{ btnText }}</Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@king-design/vue'

import useMatchRule from './useMatchRule'
import useGetComponent from './useGetComponent'
import { rpcToMainProcess, notify } from '@/utils'
import { useStore } from '@/hooks'

const { currentRule } = useMatchRule()
const currentComponent = useGetComponent(() => currentRule.value?.id)
const { addDownloadInfo } = useStore()

const loading = ref(false)

async function getDownloadInfo() {
  const downloadId = crypto.randomUUID()
  loading.value = true
  let downloadInfo = null
  try {
    downloadInfo = await rpcToMainProcess({ type: 'VIDEO_HELPER_PREPARE_DOWNLOAD_INFO', downloadId })
  } catch (error: any) {
    notify({ title: '获取下载信息失败', message: error?.message })
  } finally {
    loading.value = false
  }
  return downloadInfo
}

async function handleDownload() {
  const downloadInfo: any = await getDownloadInfo()
  if (!downloadInfo) return
  addDownloadInfo(downloadInfo)
  chrome.runtime.openOptionsPage()
}

const btnText = computed(() => {
  return currentRule.value?.id ? '后台下载' : '下载中心'
})
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
