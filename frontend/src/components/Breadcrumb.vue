<template>
  <el-breadcrumb :separator="separator" class="custom-breadcrumb">
    <el-breadcrumb-item 
      v-for="(item, index) in items" 
      :key="index"
      :to="item.path"
      :replace="item.replace"
      :href="item.href"
    >
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span v-if="item.text">{{ item.text }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { defineProps } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 注册所有图标，以便在组件中使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  defineProps({ [key]: { type: Object } })
}

// 定义组件属性
const props = defineProps({
  // 面包屑项数组
  items: {
    type: Array,
    default: () => [],
    validator: (items) => {
      // 验证每个item的结构
      return items.every(item => {
        // 至少需要text或icon其中一个
        return item.text || item.icon
      })
    }
  },
  // 分隔符
  separator: {
    type: String,
    default: '/'
  }
})
</script>

<style scoped>
.custom-breadcrumb {
  padding: 16px 0;
}

.custom-breadcrumb .el-breadcrumb__item {
  font-size: 14px;
}

.custom-breadcrumb .el-breadcrumb__separator {
  margin: 0 8px;
  color: #909399;
}

.custom-breadcrumb .el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: #409eff;
}

.custom-breadcrumb .el-icon {
  margin-right: 4px;
  width: 16px;
  height: 16px;
}
</style>