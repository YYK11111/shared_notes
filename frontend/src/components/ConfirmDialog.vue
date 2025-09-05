<template>
  <teleport to="body">
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      :width="width"
      :top="top"
      :before-close="handleClose"
      :show-close="showClose"
      :destroy-on-close="destroyOnClose"
      :close-on-click-modal="closeOnClickModal"
      :close-on-press-escape="closeOnPressEscape"
    >
      <div class="confirm-content">
        <div v-if="icon" class="confirm-icon">
          <el-icon :class="`el-icon--${iconType}`"><component :is="icon" /></el-icon>
        </div>
        <div class="confirm-message">{{ message }}</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button 
            v-if="showCancelButton"
            :type="cancelButtonType"
            @click="handleCancel"
            :loading="cancelButtonLoading"
            :disabled="disabled"
          >
            {{ cancelButtonText }}
          </el-button>
          <el-button 
            v-if="showConfirmButton"
            :type="confirmButtonType"
            :icon="confirmButtonIcon"
            @click="handleConfirm"
            :loading="confirmButtonLoading"
            :disabled="disabled"
          >
            {{ confirmButtonText }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </teleport>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, nextTick } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 定义组件事件
const emit = defineEmits(['confirm', 'cancel', 'close'])

// 定义组件属性
const props = defineProps({
  // 是否显示对话框
  visible: {
    type: Boolean,
    default: false
  },
  // 对话框标题
  title: {
    type: String,
    default: '确认操作'
  },
  // 对话框消息内容
  message: {
    type: String,
    default: ''
  },
  // 图标类型
  icon: {
    type: Object,
    default: null
  },
  // 图标样式类型
  iconType: {
    type: String,
    default: 'warning',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  // 对话框宽度
  width: {
    type: String,
    default: '420px'
  },
  // 对话框距离顶部的位置
  top: {
    type: String,
    default: '15vh'
  },
  // 是否显示关闭按钮
  showClose: {
    type: Boolean,
    default: true
  },
  // 是否在关闭时销毁对话框
  destroyOnClose: {
    type: Boolean,
    default: true
  },
  // 点击遮罩层是否关闭对话框
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  // 按下ESC键是否关闭对话框
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  // 是否显示取消按钮
  showCancelButton: {
    type: Boolean,
    default: true
  },
  // 取消按钮文本
  cancelButtonText: {
    type: String,
    default: '取消'
  },
  // 取消按钮类型
  cancelButtonType: {
    type: String,
    default: 'default'
  },
  // 是否显示确认按钮
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  // 确认按钮文本
  confirmButtonText: {
    type: String,
    default: '确定'
  },
  // 确认按钮类型
  confirmButtonType: {
    type: String,
    default: 'primary'
  },
  // 确认按钮图标
  confirmButtonIcon: {
    type: Object,
    default: null
  },
  // 确认按钮加载状态
  confirmButtonLoading: {
    type: Boolean,
    default: false
  },
  // 取消按钮加载状态
  cancelButtonLoading: {
    type: Boolean,
    default: false
  },
  // 是否禁用所有按钮
  disabled: {
    type: Boolean,
    default: false
  }
})

// 内部对话框可见性状态
const dialogVisible = ref(props.visible)

// 监听外部visible属性变化
watch(() => props.visible, (newVal) => {
  nextTick(() => {
    dialogVisible.value = newVal
  })
})

// 监听内部对话框可见性变化
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('close')
  }
})

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
}

.confirm-icon {
  margin-top: 2px;
}

.confirm-icon .el-icon--success {
  color: #67c23a;
  font-size: 24px;
}

.confirm-icon .el-icon--warning {
  color: #e6a23c;
  font-size: 24px;
}

.confirm-icon .el-icon--error {
  color: #f56c6c;
  font-size: 24px;
}

.confirm-icon .el-icon--info {
  color: #909399;
  font-size: 24px;
}

.confirm-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>