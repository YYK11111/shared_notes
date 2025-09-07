<template>
  <div class="note-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">笔记管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateNote">
              <el-icon>
                <Plus />
              </el-icon>
              新建笔记
            </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedNotes.length === 0">
              <el-icon>
                <Delete />
              </el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input v-model="searchKeyword" placeholder="搜索笔记标题或内容" :prefix-icon="Search" class="search-input"
          @keyup.enter="handleSearch" />
        <el-select v-model="categoryFilter" placeholder="选择分类" class="filter-select">
          <el-option label="全部" value="" />
          <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
          <el-option label="审核中" value="reviewing" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" class="date-filter" @change="handleDateFilter" />
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>

      <!-- 笔记列表 -->
      <el-table v-loading="loading" :data="notesData" style="width: 100%" border
        @selection-change="handleSelectionChange" :row-key="(row) => row.id">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <span class="note-title" @click="viewNoteDetail(row.id)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category_id" label="分类" width="120">
          <template #default="{ row }">
            <span>{{ getCategoryName(row.category_id) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100" sortable />
        <el-table-column prop="likes" label="点赞数" width="100" sortable />
        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
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
            <el-button link type="primary" @click="handleEditNote(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteNote(row.id)">删除</el-button>
            <el-button link v-if="row.status === 'reviewing'" @click="handleApproveNote(row.id)">通过</el-button>
            <el-button link v-if="row.status === 'reviewing'" @click="handleRejectNote(row.id)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="totalCount" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Plus, Delete } from '@element-plus/icons-vue'

import { getNoteList, deleteNote, approveNote, rejectNote } from '@/api/category'

const router = useRouter()

// 状态变量
const loading = ref(false)
const notesData = ref([])
const categories = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedNotes = ref([])

// 搜索和筛选条件
const searchKeyword = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const dateRange = ref([])

// 获取笔记列表
const fetchNotes = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      category_id: categoryFilter.value || undefined,
      status: statusFilter.value || undefined,
      start_date: dateRange.value[0] ? dayjs(dateRange.value[0]).format('YYYY-MM-DD') : undefined,
      end_date: dateRange.value[1] ? dayjs(dateRange.value[1]).format('YYYY-MM-DD') : undefined
    }

    const response = await getNoteList(params)
    notesData.value = response.data?.items || []
    totalCount.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取笔记列表失败：' + (error.message || '未知错误'))
    console.error('获取笔记列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    // 实际项目中应该调用获取分类列表的API
    // 这里使用模拟数据
    categories.value = [
      { id: 1, name: '前端开发' },
      { id: 2, name: '后端开发' },
      { id: 3, name: '数据库' },
      { id: 4, name: 'DevOps' },
      { id: 5, name: '人工智能' }
    ]
  } catch (error) {
    ElMessage.error('获取分类列表失败')
    console.error('获取分类列表失败:', error)
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchNotes()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  categoryFilter.value = ''
  statusFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  fetchNotes()
}

// 处理日期筛选
const handleDateFilter = () => {
  currentPage.value = 1
  fetchNotes()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchNotes()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchNotes()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedNotes.value = selection
}

// 创建新笔记
const handleCreateNote = () => {
  router.push('/admin/note/create')
}

// 编辑笔记
const handleEditNote = (id) => {
  router.push('/admin/note/edit/' + id)
}

// 查看笔记详情
const viewNoteDetail = (id) => {
  router.push('/notes/' + id)
}

// 删除笔记
const handleDeleteNote = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条笔记吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteNote(id)
    ElMessage.success('笔记删除成功')
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('笔记删除失败：' + (error.message || '未知错误'))
      console.error('删除笔记失败:', error)
    }
  }
}

// 批量删除笔记
const handleBatchDelete = async () => {
  if (selectedNotes.value.length === 0) {
    ElMessage.warning('请选择要删除的笔记')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedNotes.value.length} 条笔记吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedNotes.value.map(note => note.id)
    // 这里应该调用批量删除API
    // 为了演示，我们模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))

    ElMessage.success(`成功删除 ${selectedNotes.value.length} 条笔记`)
    selectedNotes.value = []
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error('批量删除失败:', error)
    }
  }
}

// 审核通过笔记
const handleApproveNote = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要通过这条笔记的审核吗？',
      '确认通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    await approveNote(id)
    ElMessage.success('笔记审核通过')
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核操作失败：' + (error.message || '未知错误'))
      console.error('审核通过失败:', error)
    }
  }
}

// 拒绝笔记
const handleRejectNote = async (id) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入拒绝原因：',
      '拒绝审核',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[\s\S]{1,200}$/,
        inputErrorMessage: '拒绝原因长度在 1 到 200 个字符'
      }
    )

    await rejectNote(id, { reason })
    ElMessage.success('笔记已拒绝')
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('拒绝操作失败：' + (error.message || '未知错误'))
      console.error('拒绝笔记失败:', error)
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : '未分类'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    published: '已发布',
    draft: '草稿',
    reviewing: '审核中',
    rejected: '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    published: 'success',
    draft: 'info',
    reviewing: 'warning',
    rejected: 'danger'
  }
  return typeMap[status] || 'default'
}

// 初始化页面数据
onMounted(() => {
  fetchCategories()
  fetchNotes()
})
</script>

<style scoped>
.note-list-page {
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

.filter-select,
.date-filter {
  width: 150px;
}

.search-button,
.reset-button {
  white-space: nowrap;
}

.note-title {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: underline;
}

.note-title:hover {
  color: #2563eb;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .note-list-page {
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

  .search-input,
  .filter-select,
  .date-filter {
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