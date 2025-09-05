<template>
  <teleport to="body">
    <div 
      v-for="(message, index) in messages" 
      :key="message.id || index"
      class="message-wrapper"
      :class="`message-wrapper--${message.type}`"
      :style="{
        top: `${message.offsetTop}px`,
        zIndex: message.zIndex,
        transform: message.isVisible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: message.isVisible ? 1 : 0
      }"
    >
      <div class="message-content">
        <el-icon v-if="message.showIcon" :class="`message-icon message-icon--${message.type}`">
          <component :is="message.icon || getDefaultIcon(message.type)" />
        </el-icon>
        <div v-if="message.title" class="message-title">{{ message.title }}</div>
        <div class="message-text">{{ message.message }}</div>
        <el-icon 
          v-if="message.showClose" 
          class="message-close" 
          @click.stop="closeMessage(message.id || index)"
        >
          <Close />
        </el-icon>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Success, 
  Warning, 
  Error, 
  Info, 
  Close 
} from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 消息队列
const messages = ref([])

// 默认配置
const defaultOptions = {
  type: 'info',
  duration: 3000,
  showClose: true,
  showIcon: true,
  position: 'top-right',
  offsetTop: 20,
  zIndex: 2000,
  customClass: '',
  grouping: false,
  appendTo: document.body
}

// 消息计数器
let messageCounter = 0

// 定时器映射
const timerMap = new Map()

// 获取默认图标
const getDefaultIcon = (type) => {
  const iconMap = {
    success: Success,
    warning: Warning,
    error: Error,
    info: Info
  }
  return iconMap[type] || Info
}

// 创建消息
const createMessage = (options) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    id: ++messageCounter,
    isVisible: false
  }

  // 转换字符串为options对象
  if (typeof options === 'string') {
    mergedOptions.message = options
  }

  // 添加到消息队列
  messages.value.push(mergedOptions)

  // 计算偏移量
  calculateOffsets()

  // 显示消息
  setTimeout(() => {
    const message = messages.value.find(m => m.id === mergedOptions.id)
    if (message) {
      message.isVisible = true
    }
  }, 10)

  // 设置自动关闭定时器
  if (mergedOptions.duration > 0) {
    const timer = setTimeout(() => {
      closeMessage(mergedOptions.id)
    }, mergedOptions.duration)
    timerMap.set(mergedOptions.id, timer)
  }

  // 返回关闭方法
  return {
    close: () => closeMessage(mergedOptions.id)
  }
}

// 计算偏移量
const calculateOffsets = () => {
  let offsetTop = defaultOptions.offsetTop
  messages.value.forEach(message => {
    message.offsetTop = offsetTop
    // 每个消息之间的间距为16px
    offsetTop += 60 + 16
  })
}

// 关闭消息
const closeMessage = (id) => {
  const index = messages.value.findIndex(m => m.id === id)
  if (index !== -1) {
    const message = messages.value[index]
    message.isVisible = false

    // 清除定时器
    if (timerMap.has(id)) {
      clearTimeout(timerMap.get(id))
      timerMap.delete(id)
    }

    // 动画结束后移除
    setTimeout(() => {
      messages.value.splice(index, 1)
      calculateOffsets()
    }, 300)
  }
}

// 关闭所有消息
const closeAllMessages = () => {
  // 清除所有定时器
  timerMap.forEach(timer => clearTimeout(timer))
  timerMap.clear()

  // 隐藏所有消息
  messages.value.forEach(message => {
    message.isVisible = false
  })

  // 动画结束后清空队列
  setTimeout(() => {
    messages.value = []
  }, 300)
}

// 提供便捷方法
const message = {
  info: (options) => createMessage(typeof options === 'string' ? { message: options } : { ...options, type: 'info' }),
  success: (options) => createMessage(typeof options === 'string' ? { message: options } : { ...options, type: 'success' }),
  warning: (options) => createMessage(typeof options === 'string' ? { message: options } : { ...options, type: 'warning' }),
  error: (options) => createMessage(typeof options === 'string' ? { message: options } : { ...options, type: 'error' }),
  closeAll: closeAllMessages
}

// 暴露给全局
window.$message = message

// 组件卸载时清理
onUnmounted(() => {
  closeAllMessages()
})
</script>

<style scoped>
.message-wrapper {
  position: fixed;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
  z-index: 2000;
}

.message-wrapper--top-right {
  left: auto;
  right: 20px;
  transform: translateY(-20px);
}

.message-wrapper--top-left {
  left: 20px;
  right: auto;
  transform: translateY(-20px);
}

.message-wrapper--bottom-right {
  top: auto;
  bottom: 20px;
  left: auto;
  right: 20px;
  transform: translateY(20px);
}

.message-wrapper--bottom-left {
  top: auto;
  bottom: 20px;
  left: 20px;
  right: auto;
  transform: translateY(20px);
}

.message-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
  max-width: 400px;
  min-width: 280px;
}

.message-icon {
  font-size: 16px;
}

.message-icon--success {
  color: #67c23a;
}

.message-icon--warning {
  color: #e6a23c;
}

.message-icon--error {
  color: #f56c6c;
}

.message-icon--info {
  color: #909399;
}

.message-title {
  font-weight: bold;
  color: #303133;
  margin-right: auto;
}

.message-text {
  flex: 1;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-close {
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
}

.message-close:hover {
  color: #606266;
}
</style>