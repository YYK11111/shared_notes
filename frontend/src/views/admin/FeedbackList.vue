<template>
  <div class="feedback-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">反馈管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleBatchProcess" :disabled="selectedFeedbacks.length === 0">
              <el-icon><Check /></el-icon>
              批量处理
            </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedFeedbacks.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button @click="handleExportFeedbacks">
              <el-icon><Download /></el-icon>
              导出反馈
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索反馈内容或联系方式"
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已解决" value="solved" />
          <el-option label="已关闭" value="closed" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="选择类型" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="功能建议" value="suggestion" />
          <el-option label="Bug反馈" value="bug" />
          <el-option label="内容错误" value="content_error" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-filter"
          @change="handleDateFilter"
        />
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>
      
      <!-- 反馈列表 -->
      <el-table
        v-loading="loading"
        :data="feedbacksData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        :row-key="(row) => row.id"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="title" label="主题" min-width="200">
          <template #default="{ row }">
            <span class="feedback-title" @click="viewFeedbackDetail(row.id)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <span>{{ getTypeText(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系方式" width="150" />
        <el-table-column prop="has_attachment" label="有附件" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.has_attachment"><Document /></el-icon>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="replies_count" label="回复数" width="80" sortable />
        <el-table-column prop="created_at" label="提交时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ formatDate(row.updated_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewFeedbackDetail(row.id)">查看</el-button>
            <el-button link type="success" v-if="row.status === 'pending'" @click="processFeedback(row.id)">处理</el-button>
            <el-button link type="danger" @click="handleDeleteFeedback(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Check, Delete, Search, Download, Document } from '@element-plus/icons-vue'
import { getFeedbackList, deleteFeedback, updateFeedbackStatus } from '@/api/feedback'

const router = useRouter()

// 状态变量
const loading = ref(false)
const feedbacksData = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedFeedbacks = ref([])

// 搜索和筛选条件
const searchKeyword = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const dateRange = ref([])

// 获取反馈列表
const fetchFeedbacks = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
      start_date: dateRange.value[0] ? dayjs(dateRange.value[0]).format('YYYY-MM-DD') : undefined,
      end_date: dateRange.value[1] ? dayjs(dateRange.value[1]).format('YYYY-MM-DD') : undefined
    }
    
    const response = await getFeedbackList(params)
    feedbacksData.value = response.data?.items || []
    totalCount.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取反馈列表失败：' + (error.message || '未知错误'))
    console.error('获取反馈列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchFeedbacks()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  fetchFeedbacks()
}

// 处理日期筛选
const handleDateFilter = () => {
  currentPage.value = 1
  fetchFeedbacks()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchFeedbacks()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchFeedbacks()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedFeedbacks.value = selection
}

// 查看反馈详情
const viewFeedbackDetail = (id) => {
  router.push('/admin/feedback/detail/' + id)
}

// 处理反馈
const processFeedback = async (id) => {
  try {
    await updateFeedbackStatus(id, { status: 'processing' })
    ElMessage.success('已标记为处理中')
    fetchFeedbacks()
  } catch (error) {
    ElMessage.error('操作失败：' + (error.message || '未知错误'))
    console.error('处理反馈失败:', error)
  }
}

// 删除反馈
const handleDeleteFeedback = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条反馈吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteFeedback(id)
    ElMessage.success('反馈删除成功')
    fetchFeedbacks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('反馈删除失败：' + (error.message || '未知错误'))
      console.error('删除反馈失败:', error)
    }
  }
}

// 批量处理反馈
const handleBatchProcess = async () => {
  if (selectedFeedbacks.value.length === 0) {
    ElMessage.warning('请选择要处理的反馈')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedFeedbacks.value.length} 条反馈标记为处理中吗？`,
      '批量处理确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    const ids = selectedFeedbacks.value.map(feedback => feedback.id)
    // 这里应该调用批量处理API
    // 为了演示，我们模拟处理操作
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success(`已成功处理 ${selectedFeedbacks.value.length} 条反馈`)
    selectedFeedbacks.value = []
    fetchFeedbacks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量处理失败：' + (error.message || '未知错误'))
      console.error('批量处理失败:', error)
    }
  }
}

// 批量删除反馈
const handleBatchDelete = async () => {
  if (selectedFeedbacks.value.length === 0) {
    ElMessage.warning('请选择要删除的反馈')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFeedbacks.value.length} 条反馈吗？删除后将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedFeedbacks.value.map(feedback => feedback.id)
    // 这里应该调用批量删除API
    // 为了演示，我们模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success(`成功删除 ${selectedFeedbacks.value.length} 条反馈`)
    selectedFeedbacks.value = []
    fetchFeedbacks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error('批量删除失败:', error)
    }
  }
}

// 导出反馈
const handleExportFeedbacks = () => {
  ElMessage.success('导出功能暂未实现')
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    content_error: '内容错误',
    other: '其他'
  }
  return typeMap[type] || '未知'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    solved: '已解决',
    closed: '已关闭'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    processing: 'primary',
    solved: 'success',
    closed: 'info'
  }
  return typeMap[status] || 'default'
}

// 初始化页面数据
onMounted(() => {
  fetchFeedbacks()
})
</script>

<style scoped>
.feedback-list-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-filter-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 300px;
}

.filter-select, .date-filter {
  width: 150px;
}

.search-button, .reset-button {
  white-space: nowrap;
}

.feedback-title {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: underline;
}

.feedback-title:hover {
  color: #2563eb;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .feedback-list-page {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input, .filter-select, .date-filter {
    width: 100%;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
}
</style>