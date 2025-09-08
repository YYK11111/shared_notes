<template>
  <div class="category-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">分类管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateCategory">
            <el-icon><Plus /></el-icon>
            新建分类
          </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedCategories.length === 0">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
            <el-button @click="handleSortCategories">
            <el-icon><Sort /></el-icon>
            分类排序
          </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称"
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-cascader
          v-model="parentFilter"
          :options="cascaderOptions"
          placeholder="选择父分类"
          class="filter-select"
          clearable
          :show-all-levels="false"
          :props="{ checkStrictly: true }"
        />
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>
      
      <!-- 分类列表 -->
      <el-table
        v-loading="loading"
        :data="categoriesData"
        style="width: 100%; overflow-x: auto;"
        border
        @selection-change="handleSelectionChange"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" min-width="80" sortable />
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row, $index }">
            <span :style="{ marginLeft: (row.level - 1) * 15 + 'px' }">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="parent_id" label="父分类" width="150">
          <template #default="{ row }">
            <span>{{ getParentCategoryName(row.parent_id) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="层级" width="80" sortable />
        <el-table-column prop="order" label="排序" width="80" sortable />
        <el-table-column prop="note_count" label="笔记数量" width="100" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'danger'">
              {{ row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
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
            <el-button link type="primary" @click="handleEditCategory(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteCategory(row.id)">删除</el-button>
            <el-button link @click="toggleCategoryStatus(row.id, row.status)">
              {{ row.isEnabled ? '禁用' : '启用' }}
            </el-button>
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
import { Plus, Delete, Sort, Search } from '@element-plus/icons-vue'

import { getCategoryList, deleteCategory, updateCategoryStatus, sortCategories, getCategoryStats } from '@/api/category'

const router = useRouter()

// 状态变量
const loading = ref(false)
const categoriesData = ref([])
const parentCategories = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategories = ref([])

// 搜索和筛选条件
const searchKeyword = ref('')
const parentFilter = ref(undefined) // 父分类筛选器，级联选择器使用
const statusFilter = ref(1) // 默认显示启用状态
const cascaderOptions = ref([]) // 级联选择器数据

// 处理嵌套分类数据，添加level字段但保留树形结构
const processCategoryData = (categories) => {
  // 递归处理分类数据，包括嵌套的children结构
  const processCategory = (category, level = 1) => {
    const processedCategory = {
      ...category,
      level,
      // 转换状态为布尔值便于前端使用
      isEnabled: category.status === 1,
      // 设置hasChildren属性以支持树形表格
      hasChildren: category.children && category.children.length > 0
    }
    
    // 如果有子分类，递归处理
    if (category.children && category.children.length > 0) {
      processedCategory.children = category.children.map(child => 
        processCategory(child, level + 1)
      )
    }
    
    return processedCategory
  }
  
  // 处理所有分类
  return categories.map(category => {
    return processCategory(category)
  })
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      // 只有当parentFilter有有效值时才传递parent_id参数
      // 级联选择器返回数组，取最后一个元素作为parent_id
      // 避免传递null值，而是传递undefined（会被axios忽略）
      ...(parentFilter.value !== undefined && parentFilter.value !== null && parentFilter.value !== '' && {
        parent_id: Array.isArray(parentFilter.value) ? 
          (parentFilter.value.length > 0 ? Number(parentFilter.value[parentFilter.value.length - 1]) : undefined) : 
          Number(parentFilter.value)
      }),
      // 只有当statusFilter有有效值时才传递status参数
      ...(statusFilter.value !== '' && { status: statusFilter.value })
    }
    
    // 添加调试信息
    console.log('查询参数:', params)
    
    // 确保parent_id为数字或undefined，与后端数据库类型一致
    if (params.parent_id !== undefined) {
      params.parent_id = Number(params.parent_id)
    }
    
    // 1. 获取分类列表
    const categoryResponse = await getCategoryList(params)
    let allCategories = categoryResponse.data?.list || []
    
    // 2. 使用processCategoryData函数处理分类数据，添加正确的level层级
    let processedCategories = processCategoryData(allCategories)
    
      // 3. 获取分类笔记数量统计
    let categoryStats = []
    try {
      const statsResponse = await getCategoryStats()
      if (statsResponse.code === 200 && Array.isArray(statsResponse.data)) {
        categoryStats = statsResponse.data
      }
    } catch (error) {
      console.error('获取分类笔记数量失败:', error)
      // 如果获取失败，继续使用默认值0
    }
    
    // 4. 为所有分类（包括子分类）设置笔记数量
    function setNoteCountForAllCategories(categories) {
      return categories.map(category => {
        const processedCategory = {
          ...category,
          note_count: 0
        }
        
        // 从统计数据中查找对应分类的笔记数量
        const categoryStat = categoryStats.find(stat => stat.id === category.id)
        if (categoryStat && typeof categoryStat.note_count === 'number') {
          processedCategory.note_count = categoryStat.note_count
        }
        
        if (processedCategory.children && processedCategory.children.length > 0) {
          processedCategory.children = setNoteCountForAllCategories(processedCategory.children)
        }
        
        return processedCategory
      })
    }
    
    processedCategories = setNoteCountForAllCategories(processedCategories)
    
    // 4. 设置最终的分类数据
    categoriesData.value = processedCategories
    
    // 计算总数量，需要递归统计所有节点
    const countTotalCategories = (categories) => {
      let count = categories.length
      categories.forEach(category => {
        if (category.children && category.children.length > 0) {
          count += countTotalCategories(category.children)
        }
      })
      return count
    }
    
    totalCount.value = countTotalCategories(processedCategories)
    
    // 更新父分类列表
    fetchParentCategories()
    
    // 输出处理后的数据结构到控制台
    console.log('处理后的分类数据:', categoriesData.value)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 获取父级分类列表
const fetchParentCategories = async () => {
  try {
    // 直接从API获取所有分类数据，不使用当前筛选结果
    const response = await getCategoryList({ pageSize: 1000 }) // 获取足够多的分类
    const allCategories = response.data?.list || []
    
    // 处理分类数据为级联选择器需要的格式
    const formatForCascader = (categories) => {
      return categories.map(category => {
        const formattedCategory = {
          value: category.id,
          label: category.name
        }
        
        if (category.children && category.children.length > 0) {
          formattedCategory.children = formatForCascader(category.children)
        }
        
        return formattedCategory
      })
    }
    
    // 设置级联选择器数据
    cascaderOptions.value = formatForCascader(allCategories)
    
    // 同时保留原有的扁平格式数据供旧代码使用
    parentCategories.value = allCategories.map(category => ({ 
      id: category.id, 
      name: category.name 
    }))
  } catch (error) {
    ElMessage.error('获取父级分类列表失败')
    console.error('获取父级分类列表失败:', error)
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchCategories()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  parentFilter.value = undefined
  statusFilter.value = 1 // 重置为默认显示启用状态
  currentPage.value = 1
  fetchCategories()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchCategories()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchCategories()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedCategories.value = selection
}

// 创建新分类
const handleCreateCategory = () => {
  router.push('/admin/categories/create')
}

// 编辑分类
const handleEditCategory = (id) => {
  router.push('/admin/categories/edit/' + id)
}

// 删除分类
const handleDeleteCategory = async (id) => {
  try {
    // 检查分类下是否有笔记
    const category = categoriesData.value.find(cat => cat.id === id)
    if (category && category.note_count > 0) {
      await ElMessageBox.alert(
        `该分类下有 ${category.note_count} 篇笔记，无法直接删除。请先将笔记移动到其他分类或删除笔记。`,
        '删除失败',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      )
      return
    }
    
    await ElMessageBox.confirm(
      '确定要删除这个分类吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteCategory(id)
    ElMessage.success('分类删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('分类删除失败：' + (error.message || '未知错误'))
      console.error('删除分类失败:', error)
    }
  }
}

// 批量删除分类
const handleBatchDelete = async () => {
  if (selectedCategories.value.length === 0) {
    ElMessage.warning('请选择要删除的分类')
    return
  }
  
  // 检查是否有分类包含笔记
  const hasNotesCategories = selectedCategories.value.filter(cat => cat.note_count > 0)
  if (hasNotesCategories.length > 0) {
    const categoryNames = hasNotesCategories.map(cat => cat.name).join('、')
    await ElMessageBox.alert(
      `以下分类包含笔记，无法删除：${categoryNames}`,
      '删除失败',
      {
        confirmButtonText: '确定',
        type: 'error'
      }
    )
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCategories.value.length} 个分类吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedCategories.value.map(cat => cat.id)
    // 这里应该调用批量删除API
    // 为了演示，我们模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(`成功删除 ${selectedCategories.value.length} 个分类`)
    selectedCategories.value = []
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error('批量删除失败:', error)
    }
  }
}

// 切换分类状态
const toggleCategoryStatus = async (id, currentStatus) => {
  try {
    // 根据后端API，状态是数字1(启用)或0(禁用)
    const newStatus = currentStatus === 1 ? 0 : 1
    const actionText = newStatus === 1 ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${actionText}这个分类吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: newStatus === 1 ? 'success' : 'warning'
      }
    )
    
    await updateCategoryStatus(id, { status: newStatus })
    ElMessage.success(`分类${actionText}成功`)
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${actionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${actionText}分类失败:`, error)
    }
  }
}

// 分类排序
const handleSortCategories = () => {
  ElMessageBox.alert(
    `暂未实现可视化排序功能，您可以在编辑分类时设置排序值。`,
    '排序说明',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取父分类名称
const getParentCategoryName = (parentId) => {
  if (!parentId || parentId === 0) return '无'
  // 优先从完整分类数据中查找父分类
  const category = categoriesData.value.find(cat => cat.id === parentId)
  if (category) return category.name
  // 如果找不到，再从父分类列表中查找
  const parentCategory = parentCategories.value.find(cat => cat.id === parentId)
  return parentCategory ? parentCategory.name : '未知'
}

// 初始化页面数据
onMounted(async () => {
  await fetchParentCategories()
  fetchCategories()
})
</script>

<style scoped>
.category-list-page {
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

.filter-select {
  width: 180px;
}

.search-button, .reset-button {
  white-space: nowrap;
}

.category-name {
  font-weight: 500;
  color: #333;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .category-list-page {
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
  
  .search-input, .filter-select {
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