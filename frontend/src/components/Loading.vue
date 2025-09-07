<template>
  <div v-if="loading" class="loading-overlay" :class="{ 'fullscreen': fullscreen }">
    <div class="loading-content">
      <el-icon v-if="type === 'spinner'" :size="size" class="loading-spinner" :color="color">
        <Loading style="animation: rotate 2s linear infinite;" />
      </el-icon>
      <div v-else-if="type === 'dots'" class="loading-dots">
        <span v-for="i in 3" :key="i" class="loading-dot" :style="{ animationDelay: `${i * 0.2}s` }" />
      </div>
      <div v-else-if="type === 'ripple'" class="loading-ripple">
        <span class="loading-ripple-item" />
      </div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { Loading } from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps({
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 加载类型：spinner（默认）、dots、ripple
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'ripple'].includes(value)
  },
  // 加载文本
  text: {
    type: String,
    default: ''
  },
  // 加载图标颜色
  color: {
    type: String,
    default: '#409eff'
  },
  // 加载图标大小
  size: {
    type: Number,
    default: 40
  },
  // 是否全屏显示
  fullscreen: {
    type: Boolean,
    default: true
  },
  // 背景遮罩透明度
  opacity: {
    type: Number,
    default: 0.6
  }
})
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  transition: all 0.3s;
}

.loading-overlay.fullscreen {
  position: fixed;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

/* 点动画样式 */
.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #409eff;
  animation: loadingDot 1.4s infinite ease-in-out both;
}

@keyframes loadingDot {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 涟漪动画样式 */
.loading-ripple {
  position: relative;
  width: 40px;
  height: 40px;
}

.loading-ripple-item {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #409eff;
  border-radius: 50%;
  animation: loadingRipple 1.4s infinite ease-in-out;
}

.loading-ripple-item::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #409eff;
  border-radius: 50%;
  animation: loadingRippleBefore 1.4s infinite ease-in-out;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes loadingRipple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes loadingRippleBefore {
  0% {
    transform: scale(0.4);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>