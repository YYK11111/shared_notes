<template>
  <div class="category-detail-page">
    <!-- 分类信息 -->
    <el-card v-if="category" class="category-header-card">
      <div class="category-header">
        <h1 class="category-title">{{ category.name }}</h1>
        <div class="category-meta">
          <span>{{ category.note_count }} 篇笔记</span>
          <span>{{ formatDate(category.created_at) }} 创建</span>
          <span>{{ formatDate(category.updated_at) }} 更新</span>
        </div>
        <div class="category-description" v-if="category.description">
          {{ category.description }}
        </div>
      </div>
    </el-card>
    
    <!-- 分类下的笔记列表 -->
    <el-card v-if="category" class="notes-content">
      <template #header>
        <div class="notes-header">
          <h2 class="section-title">{{ category.name }} 下的笔记</h2>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索笔记标题..."
            prefix-icon="Search"
            class="search-input"
            @keyup.enter="handleSearch"
          ></el-input>
        </div>
      </template>
      
      <!-- 排序选项 -->
      <div class="sort-options">
        <span class="sort-label">排序方式:</span>
        <el-radio-group v-model="sortBy" @change="handleSortChange">
          <el-radio-button label="created_at">最新创建</el-radio-button>
          <el-radio-button label="view_count">最多浏览</el-radio-button>
          <el-radio-button label="like_count">最多喜欢</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 笔记列表 -->
      <div class="notes-list">
        <el-card 
          v-for="note in notes" 
          :key="note.id"
          class="note-card"
          hoverable
        >
          <template #header>
            <router-link :to="'/notes/' + note.id" class="note-title">{{ note.title }}</router-link>
          </template>
          <div class="note-meta">
            <span>{{ formatDate(note.created_at) }}</span>
            <span>{{ note.view_count }} 浏览</span>
            <span>{{ note.like_count }} 喜欢</span>
          </div>
          <div class="note-excerpt">
            {{ truncateText(note.content, 150) }}
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        v-if="notes.length === 0 && !loading"
        description="该分类下暂无笔记"
      />
      
      <!-- 加载状态 -->
      <el-skeleton 
        v-if="loading"
        :count="5"
        item-class="note-skeleton"
      />
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="notes.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 加载中 -->
    <el-empty v-else description="加载中..." />
    
    <!-- 相关分类 -->
    <div class="related-categories" v-if="relatedCategories.length > 0">
      <h3 class="section-title">相关分类</h3>
      <div class="related-list">
        <router-link 
          v-for="item in relatedCategories" 
          :key="item.id"
          :to="'/categories/' + item.id"
          class="related-category"
        >
          <span class="category-name">{{ item.name }}</span>
          <span class="category-count">{{ item.note_count }} 篇</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getUserCategoryDetail, getNotesByCategory, getUserCategoryList } from '@/api/user'
import dayjs from 'dayjs'

// 路由
const route = useRoute()
const categoryId = route.params.id

// 分类数据
const category = ref(null)
const notes = ref([])
const relatedCategories = ref([])
const loading = ref(false)

// 搜索和排序
const searchKeyword = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 获取分类详情
const fetchCategoryDetail = async () => {
  try {
    const res = await getUserCategoryDetail(categoryId)
    category.value = res.data
  } catch (error) {
    console.error('获取分类详情失败:', error)
    ElMessage.error('获取分类详情失败')
  }
}

// 获取分类下的笔记
const fetchNotesByCategory = async () => {
  loading.value = true
  try {
    const res = await getNotesByCategory(categoryId, {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value,
      sort: sortBy.value,
      order: sortOrder.value
    })
    notes.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    ElMessage.error('获取笔记列表失败')
  } finally {
    loading.value = false
  }
}

// 获取相关分类
const fetchRelatedCategories = async () => {
  try {
    const res = await getUserCategoryList()
    // 排除当前分类，并按笔记数量排序
    relatedCategories.value = res.data
      .filter(cat => cat.id !== categoryId)
      .sort((a, b) => b.note_count - a.note_count)
      .slice(0, 5)
  } catch (error) {
    console.error('获取相关分类失败:', error)
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 截断文本
const truncateText = (text, length) => {
  if (!text) return ''
  // 去除Markdown格式
  const plainText = text.replace(/[#*`[\]]/g, '')
  if (plainText.length <= length) {
    return plainText
  }
  return plainText.slice(0, length) + '...'
}

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchNotesByCategory()
}

// 处理排序变化
const handleSortChange = () => {
  pagination.value.page = 1
  fetchNotesByCategory()
}

// 分页事件处理
const handleSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchNotesByCategory()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchNotesByCategory()
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    categoryId = newId
    fetchCategoryDetail()
    fetchNotesByCategory()
    fetchRelatedCategories()
  }
})

// 页面加载时获取数据
onMounted(() => {
  fetchCategoryDetail()
  fetchNotesByCategory()
  fetchRelatedCategories()
})
</script>

<style scoped>
.category-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.category-header-card {
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
}

.category-header {
  padding: 2rem;
}

.category-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.category-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.category-description {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.9;
  max-width: 800px;
}

.notes-content {
  margin-bottom: 2rem;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.search-input {
  width: 300px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.sort-label {
  color: #666;
  font-size: 0.9rem;
}

.notes-list {
  display: grid;
  gap: 1rem;
}

.note-card {
  transition: all 0.3s ease;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.note-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
}

.note-title:hover {
  color: #42b983;
}

.note-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
}

.note-excerpt {
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
}

.note-skeleton {
  margin-bottom: 1rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.related-categories {
  margin-top: 3rem;
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.related-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
  min-width: 120px;
  text-align: center;
}

.related-category:hover {
  background-color: #42b983;
  color: #fff;
  transform: translateY(-2px);
}

.category-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.category-count {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .notes-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .sort-options {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .category-meta {
    flex-wrap: wrap;
  }
}
</style>