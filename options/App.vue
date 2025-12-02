<template>
  <Table :data="downloadInfoToHandle" :rowKey="item => item?.downloadId">
    <TableColumn key="downloadId" title="下载ID" />
    <TableColumn key="name" title="视频名称" />
    <TableColumn key="source" title="来源" />
  </Table>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Table, TableColumn } from '@king-design/vue'
import { useStore } from '@/hooks'
import { IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY } from '@/config/constants'

const { set: setIsOptionsPageMounted } = useStore(IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY, 'local', false)

const downloadInfoToHandle = ref<any[]>([])

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'BACKGROUND_TO_OPTIONS' && message?.payload) {
    if (message.payload.type === 'ADD_DOWNLOAD_INFO') {
      console.log('ADD_DOWNLOAD_INFO', message.payload.downloadInfo)
      downloadInfoToHandle.value.push(message.payload.downloadInfo)
      sendResponse({ success: true })
      return true
    }
  }
  return false
})

watch(() => downloadInfoToHandle.value, (downloadInfoToHandle) => {
  console.log('downloadInfoToHandle', downloadInfoToHandle)
}, { deep: true, immediate: true })

onMounted(() => {
  setIsOptionsPageMounted(true)
  chrome.runtime.sendMessage({ type: 'OPTIONS_PAGE_MOUNTED' })
})

onBeforeUnmount(() => {
  setIsOptionsPageMounted(false)
})
</script>
