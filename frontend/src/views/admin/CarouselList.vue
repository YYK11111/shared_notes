<template>
  <div class="carousel-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">轮播图管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateCarousel">
              <el-icon><Plus /></el-icon>
              添加轮播图
            </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedCarousels.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题"
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>
      
      <!-- 轮播图列表 -->
      <el-table
        v-loading="loading"
        :data="carouselsData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        :row-key="(row) => row.id"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <div v-if="row.file_id">
              <el-image
                v-if="imagePreviews[row.file_id]"
                :src="imagePreviews[row.file_id]"
                :preview-src-list="[imagePreviews[row.file_id]]"
                fit="cover"
                style="width: 80px; height: 40px;"
                :error="() => { imagePreviews.value[row.file_id] = '' }"
              />
              <div v-else class="image-loading" style="width: 80px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                <el-icon><Loading /></el-icon>
              </div>
            </div>
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="link_url" label="链接" min-width="180">
          <template #default="{ row }">
            <a v-if="row.link_url" :href="row.link_url" target="_blank" class="link-text">{{ row.link_url }}</a>
            <span v-else>无链接</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" sortable />
        <el-table-column prop="position" label="展示位置" width="120">
          <template #default="{ row }">
            <span>{{ getPositionLabel(row.position) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ row.start_time ? formatDate(row.start_time) : '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ row.end_time ? formatDate(row.end_time) : '无' }}</span>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditCarousel(row.id)">编辑</el-button>
            <el-button link @click="toggleCarouselStatus(row.id, row.status, row.title)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDeleteCarousel(row.id)">删除</el-button>
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
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Delete, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getCarouselList, 
  deleteCarousel, 
  updateCarouselStatus,
  getCarouselDetail 
} from '@/api/carousel'
import { getFileObjectUrl } from '@/api/file'

const router = useRouter()

// 表格数据
const carouselsData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCarousels = ref([])
const imagePreviews = ref({}) // 用于缓存图片预览URL
const revokeFunctions = ref({}) // 用于存储每个图片的revoke函数

// 搜索和筛选条件
const searchKeyword = ref('')
const statusFilter = ref('')

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// 获取展示位置中文标签
const getPositionLabel = (position) => {
  const positionMap = {
    'home_top': '首页',
    'category_page': '分类',
    'note_page': '笔记',
    'other': '其他'
  }
  return positionMap[position] || position || '未设置'
}
// 获取图片预览
const getImagePreview = async (fileId) => {
  if (!fileId || imagePreviews.value[fileId]) return
  
  try {
    // 先释放可能存在的旧URL
    if (revokeFunctions.value[fileId]) {
      revokeFunctions.value[fileId]();
    }
    
    const { url, revoke } = await getFileObjectUrl(fileId)
    imagePreviews.value[fileId] = url
    revokeFunctions.value[fileId] = revoke
  } catch (error) {
    console.error('获取图片预览失败:', error)
  }
}

// 批量获取图片预览
const batchGetImagePreviews = async (carousels) => {
  // 添加空值检查，确保carousels是有效的数组
  if (!carousels || !Array.isArray(carousels)) {
    return
  }
  
  const promises = carousels
    .filter(item => item.file_id && !imagePreviews.value[item.file_id])
    .map(item => getImagePreview(item.file_id))
  
  await Promise.all(promises)
}

// 获取轮播图列表
const fetchCarousels = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value || undefined
    }
    
    const res = await getCarouselList(params)
    if (res.code === 200) {
      carouselsData.value = res.data.list || []
      total.value = res.data.pagination?.total || 0
      
      // 批量获取图片预览
      await batchGetImagePreviews(carouselsData.value)
    } else {
      ElMessage.error(res.msg || '获取轮播图列表失败')
    }
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    ElMessage.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchCarousels()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchCarousels()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchCarousels()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchCarousels()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedCarousels.value = selection
}

// 创建新轮播图
const handleCreateCarousel = () => {
  router.push('/admin/carousels/create')
}

// 编辑轮播图
const handleEditCarousel = (id) => {
  router.push(`/admin/carousels/edit/${id}`)
}

// 删除轮播图
const handleDeleteCarousel = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个轮播图吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await deleteCarousel(id)
    if (res.code === 200) {
      ElMessage.success('轮播图删除成功')
      fetchCarousels()
    } else {
      ElMessage.error(res.msg || '轮播图删除失败')
    }
  } catch (error) {
    console.error('删除轮播图失败:', error)
    // 用户取消确认不会触发错误消息
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedCarousels.value.length === 0) {
    ElMessage.warning('请选择要删除的轮播图')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCarousels.value.length} 个轮播图吗？删除后将无法恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const deletePromises = selectedCarousels.value.map(carousel => 
      deleteCarousel(carousel.id)
    )
    
    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${selectedCarousels.value.length} 个轮播图`)
    fetchCarousels()
    selectedCarousels.value = []
  } catch (error) {
    console.error('批量删除轮播图失败:', error)
    // 用户取消确认不会触发错误消息
  }
}

// 切换轮播图状态
const toggleCarouselStatus = async (id, currentStatus, title) => {
  const newStatus = currentStatus === 1 ? 0 : 1
  const actionText = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}轮播图「${title}」吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 直接调用专门的状态更新接口，只需要传递status参数
    const res = await updateCarouselStatus(id, { status: newStatus })
    if (res.code === 200) {
      ElMessage.success(`轮播图${actionText}成功`)
      fetchCarousels()
    } else {
      ElMessage.error(res.msg || `轮播图${actionText}失败`)
    }
  } catch (error) {
    console.error(`切换轮播图状态失败:`, error)
    // 用户取消确认不会触发错误消息
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCarousels()
})

// 组件卸载时释放所有图片URL
onUnmounted(() => {
  // 释放所有临时URL
  Object.values(revokeFunctions.value).forEach(revoke => {
    if (typeof revoke === 'function') {
      revoke();
    }
  });
  
  // 清空缓存
  imagePreviews.value = {};
  revokeFunctions.value = {};
})
</script>

<style scoped>
.carousel-list-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: end;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 150px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.link-text {
  color: #1890ff;
  text-decoration: underline;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .search-filter-container {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    margin-top: 10px;
    justify-content: center;
  }
  
  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input, .filter-select {
    width: 100%;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>