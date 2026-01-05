<template>
  <div class="options-page">
    <Tip type="warning" showIcon>如有下载任务，请勿关闭或刷新本页面</Tip>
    <Table :data="downloadInfoToHandle" :rowKey="(item, index) => item?.downloadId ?? index" checkType="none">
      <TableColumn key="downloadId" title="下载ID" />
      <TableColumn key="name" title="视频名称" />
      <TableColumn key="source" title="来源" />
      <TableColumn key="status" title="状态">
        <template #default="[data, index]">
          <span>{{ data.status ?? '--' }}</span>
        </template>
      </TableColumn>
      <TableColumn key="action" title="操作">
        <template #default="[data, index]">
          <Button type="link" @click="handleOp(data)">{{ getOpText(data) }}</Button>
        </template>
      </TableColumn>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Tip, Table, TableColumn } from '@king-design/vue'
import { useStore } from '@/hooks'
import { IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY } from '@/config/constants'

const { set: setIsOptionsPageMounted } = useStore(IS_OPTIONS_PAGE_MOUNTED_STORAGE_KEY, 'local', false)

const downloadInfoToHandle = ref<any[]>([]) // TODO: 定义数据结构

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'BACKGROUND_TO_OPTIONS' && message?.payload) {
    if (message.payload.type === 'ADD_DOWNLOAD_INFO') {
      console.log('ADD_DOWNLOAD_INFO', message.payload.downloadInfo)
      downloadInfoToHandle.value = [...downloadInfoToHandle.value, message.payload.downloadInfo] // 不能用push，避免Table组件报错
      // TODO: 初始化状态
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

const handleOp = (data: any) => {
  console.log('handleOp', data) 
  // TODO: 根据数据状态执行操作
}

const getOpText = (data: any) => {
  return '--' // TODO: 根据数据状态返回操作文本
}
</script>
<style scoped>

.options-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
