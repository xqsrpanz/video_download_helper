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
  chrome.runtime.sendMessage({ type: 'OPTIONS_PAGE_MOUNTED' })
})

onBeforeUnmount(() => {
  chrome.runtime.sendMessage({ type: 'OPTIONS_PAGE_UNMOUNTED' })
})
</script>
