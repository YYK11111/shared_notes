<template>
  <div class="search-result-page">
    <!-- 搜索头部 -->
    <el-card class="search-header">
      <div class="search-input-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记..."
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        ></el-input>
        <el-button @click="handleSearch" type="primary" :loading="searchLoading">
          搜索
        </el-button>
      </div>
      
      <!-- 搜索信息 -->
      <div class="search-info" v-if="searchKeyword">
        <span>搜索关键词：{{ searchKeyword }}</span>
        <span>找到 {{ pagination.total }} 条结果</span>
        <span>用时 {{ searchTime }}ms</span>
      </div>
    </el-card>
    
    <!-- 搜索结果 -->
    <el-card class="search-result-content">
      <template #header>
        <div class="result-header">
          <h2 class="section-title">搜索结果</h2>
          
          <!-- 排序选项 -->
          <el-select v-model="sortBy" @change="handleSortChange" placeholder="排序">
            <el-option label="相关度" value="relevance"></el-option>
            <el-option label="最新创建" value="created_at_desc"></el-option>
            <el-option label="最多浏览" value="view_count_desc"></el-option>
            <el-option label="最多喜欢" value="like_count_desc"></el-option>
          </el-select>
        </div>
      </template>
      
      <!-- 筛选选项 -->
      <div class="filter-options">
        <span class="filter-label">分类筛选:</span>
        <!-- 替换为级联选择器 -->
        <el-cascader
          v-model="categoryFilter"
          :options="categoryTree"
          :props="cascaderProps"
          placeholder="请选择分类"
          multiple
          collapse-tags
          clearable
          @change="handleFilterChange"
        ></el-cascader>
        
        <span class="filter-label">时间范围:</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleFilterChange"
        ></el-date-picker>
      </div>
      
      <!-- 搜索结果列表 -->
      <div class="result-list">
        <div 
          v-for="result in searchResults" 
          :key="result.id"
          class="result-item"
        >
          <div class="result-main">
            <router-link :to="'/notes/' + result.id" class="result-title">
              {{ result.title }}
            </router-link>
            <div class="result-content">
              <span v-html="highlightKeyword(result.content)"></span>
            </div>
            <div class="result-meta">
              <span>{{ result.categories }}</span>
              <span>{{ formatDate(result.created_at) }}</span>
              <span>{{ result.view_count }} 浏览</span>
              <span>{{ result.like_count }} 喜欢</span>
            </div>
          </div>
          <div class="result-score">
            <div class="score-label">相关度</div>
            <div class="score-value">{{ (result.score * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        v-if="searchResults.length === 0 && !searchLoading && searchKeyword"
        description="未找到相关内容"
      >
        <template #description>
          <div>
            <p>尝试使用其他关键词</p>
            <p>或检查拼写是否正确</p>
          </div>
        </template>
        <template #footer>
          <el-button @click="clearSearch">清空搜索</el-button>
        </template>
      </el-empty>
      
      <!-- 加载状态 -->
      <el-skeleton 
        v-if="searchLoading"
        :count="5"
        item-class="result-skeleton"
      /> 
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="searchResults.length > 0">
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
    
    <!-- 热门搜索 -->
    <div class="hot-search-section">
      <h3 class="section-title">热门搜索</h3>
      <div class="hot-search-list">
        <span 
          v-for="(keyword, index) in hotKeywords" 
          :key="index"
          class="hot-keyword"
          @click="searchByKeyword(keyword.keyword)"
        >
          <span class="hot-rank">{{ index + 1 }}</span>
          <span class="hot-text">{{ keyword.keyword }}</span>
          <span class="hot-count">{{ keyword.count }}次</span>
        </span>
      </div>
    </div>
    
    <!-- 搜索历史 -->
    <div class="search-history-section" v-if="searchHistory.length > 0">
      <h3 class="section-title">
        搜索历史
        <el-button type="text" size="small" @click="clearHistory">清空</el-button>
      </h3>
      <div class="history-list">
        <span 
          v-for="(keyword, index) in searchHistory" 
          :key="index"
          class="history-keyword"
          @click="searchByKeyword(keyword)"
        >
          {{ keyword }}
          <el-button type="text" size="small" @click.stop="removeHistory(index)">
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { searchNotes, getHotSearchKeywords, getSearchHistory, addSearchHistory } from '@/api/search'
import { getUserCategoryList } from '@/api/user'
import dayjs from 'dayjs'
import { CircleClose, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 路由
const route = useRoute()

// 搜索相关状态
const searchKeyword = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchTime = ref(0)
const hotKeywords = ref([])
const searchHistory = ref([])
const categories = ref([])
const categoryTree = ref([])

// 筛选和排序
const sortBy = ref('relevance')
const categoryFilter = ref([])
const dateRange = ref(null)

// 级联选择器配置 - 支持选择任意一级选项
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true // 支持选择任意一级选项
}

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 获取搜索结果
const fetchSearchResults = async () => {
  if (!searchKeyword.value.trim()) return
  
  searchLoading.value = true
  const startTime = Date.now()
  try {
    // 处理分类筛选值 - 确保传递的是分类ID数组
    const categoryIds = Array.isArray(categoryFilter.value) ? 
      categoryFilter.value.flat(Infinity) // 扁平化嵌套数组
      : [categoryFilter.value]
    
    const res = await searchNotes({
      keyword: searchKeyword.value,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sort: sortBy.value,
      categories: categoryIds.filter(id => id), // 过滤掉空值
      startDate: dateRange.value ? dateRange.value[0] : null,
      endDate: dateRange.value ? dateRange.value[1] : null
    })
    searchResults.value = res.data.list
    pagination.value.total = res.data.total
    searchTime.value = Date.now() - startTime
    
    // 保存搜索历史
    saveSearchHistory(searchKeyword.value)
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

// 获取热门搜索词
const fetchHotSearchKeywords = async () => {
  try {
    const res = await getHotSearchKeywords({ limit: 10 })
    hotKeywords.value = res.data
  } catch (error) {
    console.error('获取热门搜索词失败:', error)
  }
}

// 获取搜索历史
const fetchSearchHistory = async () => {
  try {
    const res = await getSearchHistory({ limit: 10 })
    searchHistory.value = res.data
  } catch (error) {
    console.error('获取搜索历史失败:', error)
  }
}

// 获取分类列表并构建树形结构
const fetchCategories = async () => {
  try {
    const res = await getUserCategoryList()
    categories.value = res.data || []
    // 构建分类树结构
    categoryTree.value = buildCategoryTree(categories.value)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  }
}

// 构建分类树结构
const buildCategoryTree = (categories) => {
  const categoryMap = new Map()
  const roots = []
  
  // 先创建所有分类节点的映射
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })
  
  // 构建树形结构
  categories.forEach(category => {
    const node = categoryMap.get(category.id)
    if (category.parent_id === 0 || !category.parent_id) {
      // 根节点
      roots.push(node)
    } else {
      // 子节点
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children.push(node)
      } else {
        // 如果父节点不存在，将其视为根节点
        roots.push(node)
      }
    }
  })
  
  return roots
}

// 保存搜索历史
const saveSearchHistory = async (keyword) => {
  try {
    await addSearchHistory({ keyword })
    // 重新获取搜索历史
    await fetchSearchHistory()
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 高亮关键词
const highlightKeyword = (text) => {
  if (!text || !searchKeyword.value) return text
  
  // 去除Markdown格式
  const plainText = text.replace(/[#*`[\]]/g, '')
  const keyword = searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${keyword})`, 'gi')
  return truncateText(plainText, 200).replace(regex, '<mark>$1</mark>')
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 截断文本
const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) {
    return text
  }
  return text.slice(0, length) + '...'
}

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchSearchResults()
}

// 处理排序变化
const handleSortChange = () => {
  pagination.value.page = 1
  fetchSearchResults()
}

// 处理筛选变化
const handleFilterChange = () => {
  pagination.value.page = 1
  fetchSearchResults()
}

// 分页事件处理
const handleSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchSearchResults()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchSearchResults()
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  categoryFilter.value = []
  dateRange.value = null
  pagination.value.total = 0
}

// 按热门关键词搜索
const searchByKeyword = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 移除单条搜索历史
const removeHistory = async (index) => {
  try {
    const keyword = searchHistory.value[index]
    // 这里应该调用API删除搜索历史
    // 模拟删除
    searchHistory.value.splice(index, 1)
  } catch (error) {
    console.error('删除搜索历史失败:', error)
  }
}

// 清空所有搜索历史
const clearHistory = async () => {
  try {
    // 这里应该调用API清空搜索历史
    // 模拟清空
    searchHistory.value = []
    ElMessage.success('搜索历史已清空')
  } catch (error) {
    console.error('清空搜索历史失败:', error)
    ElMessage.error('清空失败')
  }
}

// 监听路由参数
watch(() => route.query.keyword, (keyword) => {
  if (keyword && keyword !== searchKeyword.value) {
    searchKeyword.value = keyword
    handleSearch()
  }
})

// 页面加载时获取数据
onMounted(() => {
  // 从路由获取关键词
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
  }
  
  fetchCategories()
  fetchHotSearchKeywords()
  fetchSearchHistory()
  
  // 如果有关键词，执行搜索
  if (searchKeyword.value) {
    fetchSearchHistory().then(() => {
      fetchSearchResults()
    })
  }
})
</script>

<style scoped>
.search-result-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.search-header {
  margin-bottom: 2rem;
}

.search-input-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  max-width: 800px;
}

.search-info {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.search-result-content {
  margin-bottom: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.filter-label {
  color: #666;
  font-size: 0.9rem;
  white-space: nowrap;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.result-item:hover {
  background-color: #e9ecef;
}

.result-main {
  flex: 1;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
  margin-bottom: 0.5rem;
  display: block;
}

.result-title:hover {
  color: #42b983;
}

.result-content {
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.result-content mark {
  background-color: #ffeb3b;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
}

.result-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0.5rem;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.score-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.score-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #42b983;
}

.result-skeleton {
  margin-bottom: 1rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.hot-search-section {
  margin-bottom: 2rem;
}

.hot-search-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.hot-keyword {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.hot-keyword:hover {
  background-color: #42b983;
  color: #fff;
}

.hot-rank {
  width: 18px;
  height: 18px;
  background-color: #e74c3c;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.hot-text {
  color: #333;
}

.hot-keyword:hover .hot-text {
  color: #fff;
}

.hot-count {
  font-size: 0.8rem;
  color: #999;
}

.hot-keyword:hover .hot-count {
  color: rgba(255, 255, 255, 0.8);
}

.search-history-section {
  margin-bottom: 2rem;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.history-keyword {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #f5f5f5;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.history-keyword:hover {
  background-color: #e9ecef;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-input-container {
    flex-direction: column;
  }
  
  .result-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filter-options {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .result-item {
    flex-direction: column;
  }
  
  .result-score {
    flex-direction: row;
    justify-content: flex-end;
    gap: 1rem;
    min-width: auto;
    background-color: transparent;
    box-shadow: none;
    padding: 0;
  }
}
</style>