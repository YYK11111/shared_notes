<template>
  <div class="data-table">
    <!-- 搜索和筛选区域 -->
    <div v-if="showToolbar" class="table-toolbar">
      <div v-if="searchable" class="search-box">
        <el-input
          v-model="searchKeyword"
          :placeholder="searchPlaceholder"
          size="small"
          @keypress.enter="handleSearch"
          :prefix-icon="Search"
        >
          <template #append>
            <el-button
              type="primary"
              size="small"
              @click="handleSearch"
              :loading="loading"
            >
              搜索
            </el-button>
          </template>
        </el-input>
      </div>
      
      <div v-if="filterable" class="filter-box">
        <slot name="filter" />
      </div>
      
      <div v-if="showActions" class="action-box">
        <slot name="actions" />
      </div>
    </div>

    <!-- 表格内容 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      :border="border"
      :stripe="stripe"
      :height="height"
      :max-height="maxHeight"
      :row-class-name="rowClassName"
      :row-key="rowKey"
      :empty-text="emptyText"
      :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <!-- 复选框列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        :width="selectionWidth"
        :selectable="selectable"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        :width="indexWidth"
        :label="indexLabel"
        :index="indexMethod"
      />
      
      <!-- 自定义列 -->
      <slot />
      
      <!-- 操作列 -->
      <el-table-column
        v-if="showActionColumn"
        fixed="right"
        :label="actionColumnLabel"
        :width="actionColumnWidth"
        :min-width="actionColumnMinWidth"
      >
        <template #default="scope">
          <slot name="action" :row="scope.row" :index="scope.$index" />
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div v-if="showPagination" class="table-pagination">
      <div class="pagination-info">
        <span v-if="showTotal">共 {{ total }} 条数据</span>
      </div>
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// 定义组件属性
const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 总条数
  total: {
    type: Number,
    default: 0
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否可搜索
  searchable: {
    type: Boolean,
    default: true
  },
  // 搜索提示文本
  searchPlaceholder: {
    type: String,
    default: '请输入搜索关键词'
  },
  // 是否可筛选
  filterable: {
    type: Boolean,
    default: false
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false
  },
  // 是否显示复选框
  showSelection: {
    type: Boolean,
    default: true
  },
  // 复选框列宽度
  selectionWidth: {
    type: Number,
    default: 55
  },
  // 是否显示序号列
  showIndex: {
    type: Boolean,
    default: true
  },
  // 序号列宽度
  indexWidth: {
    type: Number,
    default: 60
  },
  // 序号列标签
  indexLabel: {
    type: String,
    default: '序号'
  },
  // 序号生成方法
  indexMethod: {
    type: Function,
    default: (index) => index + 1
  },
  // 是否显示操作列
  showActionColumn: {
    type: Boolean,
    default: true
  },
  // 操作列标签
  actionColumnLabel: {
    type: String,
    default: '操作'
  },
  // 操作列宽度
  actionColumnWidth: {
    type: Number,
    default: 180
  },
  // 操作列最小宽度
  actionColumnMinWidth: {
    type: Number,
    default: 150
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 是否显示总数
  showTotal: {
    type: Boolean,
    default: true
  },
  // 分页配置
  pagination: {
    type: Object,
    default: () => ({
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 50, 100]
    })
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: true
  },
  // 是否显示斑马纹
  stripe: {
    type: Boolean,
    default: true
  },
  // 表格高度
  height: {
    type: [String, Number],
    default: ''
  },
  // 表格最大高度
  maxHeight: {
    type: [String, Number],
    default: ''
  },
  // 行类名
  rowClassName: {
    type: [String, Function],
    default: ''
  },
  // 行键名
  rowKey: {
    type: [String, Function],
    default: ''
  },
  // 空文本
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  // 表头样式
  headerCellStyle: {
    type: [Object, Function],
    default: () => ({
      backgroundColor: '#f5f7fa',
      fontWeight: 500
    })
  },
  // 单元格样式
  cellStyle: {
    type: [Object, Function],
    default: () => ({})
  },
  // 是否可选择
  selectable: {
    type: Function,
    default: () => true
  }
})

// 定义组件事件
const emit = defineEmits([
  'search',
  'filter',
  'page-change',
  'size-change',
  'selection-change',
  'sort-change'
])

// 搜索关键词
const searchKeyword = ref('')

// 表格数据计算属性
const tableData = computed(() => {
  return props.data
})

// 处理搜索
const handleSearch = () => {
  emit('search', {
    keyword: searchKeyword.value.trim(),
    currentPage: 1,
    pageSize: props.pagination.pageSize
  })
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 处理排序变化
const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

// 处理页码变化
const handleCurrentChange = (currentPage) => {
  emit('page-change', {
    currentPage,
    pageSize: props.pagination.pageSize,
    keyword: searchKeyword.value.trim()
  })
}

// 处理每页条数变化
const handleSizeChange = (pageSize) => {
  emit('size-change', {
    currentPage: 1,
    pageSize,
    keyword: searchKeyword.value.trim()
  })
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  handleSearch()
}

// 监听外部数据变化
watch(() => props.data, (newVal) => {
  // 数据变化时的处理逻辑
}, { deep: true })

// 监听分页变化
watch(() => props.pagination, (newVal) => {
  // 分页变化时的处理逻辑
}, { deep: true })
</script>

<style scoped>
.data-table {
  width: 100%;
  min-height: 1px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 16px;
}

.action-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
}

.pagination-info {
  color: #606266;
  font-size: 14px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-box {
    margin: 0;
    flex-wrap: wrap;
  }
  
  .table-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .pagination-info {
    text-align: center;
  }
}
</style>