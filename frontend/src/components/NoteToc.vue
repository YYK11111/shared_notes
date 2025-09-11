<template>
  <div class="note-toc" v-if="items.length > 0">
    <div class="toc-header">
      <div class="toc-header-left">
        <h3>目录</h3>
      </div>
      <el-button 
        v-if="showClose" 
        type="text" 
        size="small" 
        @click="handleClose"
        class="toc-close-btn"
      >
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="toc-content">
      <ul class="toc-list">
        <li 
          v-for="(item, index) in items" 
          :key="item.id || index" 
          :class="['toc-item', `toc-level-${item.level}`]"
          :style="{ paddingLeft: `${(item.level - 1) * 15}px` }"
        >
          <a 
            href="#" 
            @click.prevent="handleJump(item.id)"
            :class="{ 'toc-active': activeId === item.id }"
          >
            {{ item.title }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  showClose: {
    type: Boolean,
    default: true
  },
  activeId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['jump', 'close'])

const handleJump = (id) => {
  emit('jump', id)
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.note-toc {
  background-color: #fafafa;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-height: 60vh;
  overflow-y: auto;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.toc-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toc-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.toc-toggle-btn {
  padding: 0.25rem;
  margin: -0.25rem;
}

.toc-close-btn {
  padding: 0.25rem;
  margin: -0.25rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 0.25rem 0;
  line-height: 1.6;
}

.toc-item a {
  color: #666;
  text-decoration: none;
  display: block;
  padding: 0.25rem 0;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.toc-item a:hover {
  color: #409eff;
  background-color: #f0f7ff;
  padding-left: 0.25rem;
}

.toc-item a.toc-active {
  color: #409eff;
  font-weight: 500;
  background-color: #f0f7ff;
}

/* 美化滚动条 */
.note-toc::-webkit-scrollbar {
  width: 6px;
}

.note-toc::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.note-toc::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.note-toc::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>