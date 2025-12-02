<template>
  <div class="popup-container">
    <component :is="currentComponent" />
    <Button
      class="mt-2"
      type="primary"
      :loading="loading"
      @click="handleClickBtn"
    >{{ btnText }}</Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@king-design/vue'

import useMatchRule from './useMatchRule'
import useGetComponent from './useGetComponent'
import { rpcToMainProcess, notify } from '@/utils'
import { useEnsureOptionsPageMounted } from '@/hooks'

const { currentRule } = useMatchRule()
const currentComponent = useGetComponent(() => currentRule.value?.id)
const { ensureOptionsPageMounted } = useEnsureOptionsPageMounted()

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
  if (!downloadInfo?.payload) return
  chrome.runtime.sendMessage({
    type: 'POPUP_TO_OPTIONS',
    payload: { type: 'ADD_DOWNLOAD_INFO', downloadInfo: downloadInfo.payload }
  })
}

const btnText = computed(() => {
  return currentRule.value ? '后台下载' : '下载中心'
})

function handleClickBtn() {
  if (currentRule.value) {
    handleDownload()
  } else {
    ensureOptionsPageMounted()
  }
}
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
