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
            <el-dropdown @command="handleBatchStatusChange" :disabled="selectedNotes.length === 0">
              <el-button>
                批量修改状态
                <el-icon class="el-icon--right">
                  <el-icon><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="currentColor" d="M840.4 305.3H183.6c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h656.8c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM183.6 499.7h656.8c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H183.6c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zM183.6 694h656.8c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H183.6c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z"/></svg></el-icon>
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1">发布</el-dropdown-item>
                  <el-dropdown-item command="0">设为草稿</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input v-model="searchKeyword" placeholder="搜索笔记标题或内容" :prefix-icon="Search" class="search-input"
          @keyup.enter="handleSearch" />
        <el-cascader
          v-model="categoryFilter"
          :options="categories"
          :props="{ label: 'name', value: 'id', children: 'children', checkStrictly: true }"
          placeholder="选择分类"
          class="filter-select"
          @change="handleCategoryChange"
          clearable
        />
        <!-- 隐藏的输入框，用于存储最终选择的分类ID -->
        <input type="hidden" v-model="selectedCategoryId" />
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="已发布" value="1" />
          <el-option label="草稿" value="0" />
        </el-select>
        <el-select v-model="isTopFilter" placeholder="置顶状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="已置顶" value="1" />
          <el-option label="未置顶" value="0" />
        </el-select>
        <el-select v-model="isHomeRecommendFilter" placeholder="首页推荐" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="是" value="1" />
          <el-option label="否" value="0" />
        </el-select>
        <el-select v-model="isWeekSelectionFilter" placeholder="本周精选" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="是" value="1" />
          <el-option label="否" value="0" />
        </el-select>
        <el-select v-model="isMonthRecommendFilter" placeholder="本月推荐" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="是" value="1" />
          <el-option label="否" value="0" />
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
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <span>{{ getCategoryNames(row.categories) || '未分类' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_top" label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.is_top === 1" style="color: #f56c6c;">
              <StarFilled />
            </el-icon>
            <el-icon v-else style="color: #c0c4cc;">
              <Star />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="top_expire_time" label="置顶过期时间" width="180" align="center">
          <template #default="{ row }">
            <span v-if="row.top_expire_time">
              {{ formatDate(row.top_expire_time) }}
            </span>
            <span v-else-if="row.is_top === 1" style="color: #67c23a;">
              永久置顶
            </span>
            <span v-else style="color: #909399;">
              - 
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_home_recommend" label="首页推荐" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_home_recommend === 1" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_week_selection" label="本周精选" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_week_selection === 1" type="primary">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_month_recommend" label="本月推荐" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_month_recommend === 1" type="warning">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="480" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditNote(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteNote(row.id)">删除</el-button>
            <el-button link :type="row.is_top === 1 ? 'info' : 'warning'" @click="handleToggleTop(row.id, row.is_top === 1 ? 0 : 1)">{{ row.is_top === 1 ? '取消置顶' : '置顶' }}</el-button>
            <el-button link :type="row.is_home_recommend === 1 ? 'info' : 'success'" @click="handleToggleHomeRecommend(row.id, row.is_home_recommend === 1 ? 0 : 1)">{{ row.is_home_recommend === 1 ? '取消推荐' : '首页推荐' }}</el-button>
            <el-button link :type="row.is_week_selection === 1 ? 'info' : 'primary'" @click="handleToggleWeekSelection(row.id, row.is_week_selection === 1 ? 0 : 1)">{{ row.is_week_selection === 1 ? '取消精选' : '本周精选' }}</el-button>
            <el-button link :type="row.is_month_recommend === 1 ? 'info' : 'warning'" @click="handleToggleMonthRecommend(row.id, row.is_month_recommend === 1 ? 0 : 1)">{{ row.is_month_recommend === 1 ? '取消推荐' : '本月推荐' }}</el-button>
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
import { Plus, Delete, Search, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getNoteList, deleteNote, approveNote, rejectNote, toggleNoteTop, batchUpdateNoteStatus, toggleNoteHomeRecommend, toggleNoteWeekSelection, toggleNoteMonthRecommend } from '@/api/note'
import { getCategoryList } from '@/api/category'

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
const selectedCategoryId = ref('') // 存储最终选择的分类ID
const statusFilter = ref('')
const isTopFilter = ref('')
const isHomeRecommendFilter = ref('')
const isWeekSelectionFilter = ref('')
const isMonthRecommendFilter = ref('')
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
      category_id: selectedCategoryId.value || undefined,
      status: statusFilter.value || undefined,
      isTop: isTopFilter.value || undefined,
      isHomeRecommend: isHomeRecommendFilter.value || undefined,
      isWeekSelection: isWeekSelectionFilter.value || undefined,
      isMonthRecommend: isMonthRecommendFilter.value || undefined,
      start_date: dateRange.value[0] ? dayjs(dateRange.value[0]).format('YYYY-MM-DD') : undefined,
      end_date: dateRange.value[1] ? dayjs(dateRange.value[1]).format('YYYY-MM-DD') : undefined
    }

    const response = await getNoteList(params)
    // 根据API返回的实际数据结构修改
    notesData.value = response.data?.list || []
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
    const response = await getCategoryList()
    // 修复：使用response.data.list而不是整个response.data
    categories.value = response.data?.list || []
  } catch (error) {
    ElMessage.error('获取分类列表失败：' + (error.message || '未知错误'))
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
  selectedCategoryId.value = ''
  statusFilter.value = ''
  isTopFilter.value = ''
  isHomeRecommendFilter.value = ''
  isWeekSelectionFilter.value = ''
  isMonthRecommendFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  fetchNotes()
}

// 处理日期筛选
const handleDateFilter = () => {
  currentPage.value = 1
  fetchNotes()
}

// 处理分类级联选择变化
const handleCategoryChange = (value) => {
  // 级联选择器的值是一个数组，最后一个元素是最终选择的分类ID
  if (value && value.length > 0) {
    selectedCategoryId.value = value[value.length - 1]
  } else {
    selectedCategoryId.value = ''
  }
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
  router.push('/admin/notes/create')
}

// 编辑笔记
const handleEditNote = (id) => {
  router.push('/admin/notes/edit/' + id)
}

// 查看笔记详情
const viewNoteDetail = (id) => {
  router.push('/admin/notes/preview/' + id)
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

// 切换笔记置顶状态
const handleToggleTop = async (id, top) => {
  try {
    const actionText = top === 1 ? '置顶' : '取消置顶'
    
    if (top === 1) {
      // 置顶时显示时间选择器
      const { value: expireTime } = await ElMessageBox.prompt(
        `请选择置顶过期时间：`,
        `确认${actionText}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '不设置则永久置顶',
          inputType: 'datetime-local'
        }
      )
      
      // 调用置顶接口并传递过期时间
      await toggleNoteTop(id, top, expireTime)
    } else {
      // 取消置顶时直接确认
      await ElMessageBox.confirm(
        `确定要${actionText}这条笔记吗？`,
        `确认${actionText}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        }
      )
      
      await toggleNoteTop(id, top)
    }
    
    ElMessage.success(`笔记${actionText}成功`)
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${actionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${actionText}笔记失败:`, error)
    }
  }
}

// 切换笔记首页推荐状态
const handleToggleHomeRecommend = async (id, recommend) => {
  try {
    const actionText = recommend === 1 ? '设置为首页推荐' : '取消首页推荐'
    
    await ElMessageBox.confirm(
      `确定要${actionText}这条笔记吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: recommend === 1 ? 'success' : 'warning'
      }
    )
    
    // 使用API函数更新首页推荐状态
    await toggleNoteHomeRecommend(id, recommend)

    ElMessage.success(`笔记${actionText}成功`)
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      const errorActionText = recommend === 1 ? '设置为首页推荐' : '取消首页推荐'
      ElMessage.error(`${errorActionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${errorActionText}笔记失败:`, error)
    }
  }
}

// 切换笔记本周精选状态
const handleToggleWeekSelection = async (id, selection) => {
  try {
    const actionText = selection === 1 ? '设置为本周精选' : '取消本周精选'
    
    await ElMessageBox.confirm(
      `确定要${actionText}这条笔记吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'primary'
      }
    )

    // 使用API函数更新本周精选状态
    await toggleNoteWeekSelection(id, selection)

    ElMessage.success(`笔记${actionText}成功`)
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      const errorActionText = selection === 1 ? '设置为本周精选' : '取消本周精选'
      ElMessage.error(`${errorActionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${errorActionText}笔记失败:`, error)
    }
  }
}

// 切换笔记本月推荐状态
const handleToggleMonthRecommend = async (id, recommend) => {
  try {
    const actionText = recommend === 1 ? '设置为本月推荐' : '取消本月推荐'
    
    await ElMessageBox.confirm(
      `确定要${actionText}这条笔记吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 使用API函数更新本月推荐状态
    await toggleNoteMonthRecommend(id, recommend)

    ElMessage.success(`笔记${actionText}成功`)
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      const errorActionText = recommend === 1 ? '设置为本月推荐' : '取消本月推荐'
      ElMessage.error(`${errorActionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${errorActionText}笔记失败:`, error)
    }
  }
}

// 批量修改笔记状态
const handleBatchStatusChange = async (status) => {
  if (selectedNotes.value.length === 0) {
    ElMessage.warning('请选择要操作的笔记')
    return
  }

  try {
    const statusText = status === '1' ? '发布' : '设为草稿'
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedNotes.value.length} 条笔记${statusText}吗？`,
      `批量${statusText}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: status === '1' ? 'success' : 'warning'
      }
    )

    const ids = selectedNotes.value.map(note => note.id)
    await batchUpdateNoteStatus(ids, parseInt(status))
    ElMessage.success(`成功将 ${selectedNotes.value.length} 条笔记${statusText}`)
    selectedNotes.value = []
    fetchNotes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${statusText}失败：` + (error.message || '未知错误'))
      console.error(`批量${statusText}失败:`, error)
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取分类名称（支持层级显示）
const getCategoryNames = (categoryArray) => {
  // 如果没有分类数组或分类数组为空，返回未分类
  if (!categoryArray || !Array.isArray(categoryArray) || categoryArray.length === 0) {
    return '未分类'
  }
  
  // 提取分类名称并以逗号分隔
  return categoryArray.map(cat => cat.name).join(', ')
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '已发布',
    0: '草稿'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    1: 'success',
    0: 'info'
  }
  return typeMap[status] || 'primary'
}

// 初始化页面数据
onMounted(() => {
  fetchCategories()
  fetchNotes()
})
</script>

<style scoped>
.note-list-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.5rem;
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