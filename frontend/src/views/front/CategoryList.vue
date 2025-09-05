<template>
  <div class="category-list-page">
    <el-card class="category-content">
      <template #header>
        <h2 class="page-title">所有分类</h2>
      </template>
      
      <!-- 分类统计概览 -->
      <div class="category-stats">
        <div class="stat-item">
          <div class="stat-number">{{ totalCategories }}</div>
          <div class="stat-label">分类总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalNotes }}</div>
          <div class="stat-label">笔记总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ avgNotesPerCategory }}</div>
          <div class="stat-label">平均每个分类的笔记数</div>
        </div>
      </div>
      
      <!-- 分类列表 -->
      <div class="category-grid">
        <el-card 
          v-for="category in categories" 
          :key="category.id"
          class="category-card"
          hoverable
        >
          <template #header>
            <router-link :to="'/categories/' + category.id" class="category-title">
              {{ category.name }}
            </router-link>
          </template>
          <div class="category-info">
            <div class="category-meta">
              <span>{{ category.note_count }} 篇笔记</span>
              <span>{{ formatDate(category.updated_at) }} 更新</span>
            </div>
            <div class="category-desc" v-if="category.description">
              {{ truncateText(category.description, 100) }}
            </div>
            <div class="category-actions">
              <router-link :to="'/categories/' + category.id" class="view-all-link">
                查看全部笔记 →
              </router-link>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 分类排名 -->
      <div class="category-ranking" v-if="categories.length > 0">
        <h3 class="section-title">分类热门排名</h3>
        <div class="ranking-list">
          <div 
            v-for="(category, index) in categories.slice(0, 10)" 
            :key="category.id"
            class="ranking-item"
          >
            <span class="ranking-number">{{ index + 1 }}</span>
            <router-link :to="'/categories/' + category.id" class="ranking-name">
              {{ category.name }}
            </router-link>
            <span class="ranking-count">{{ category.note_count }} 篇笔记</span>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 热门笔记 -->
    <div class="hot-notes-section">
      <h3 class="section-title">热门笔记</h3>
      <div class="hot-notes-list">
        <el-card 
          v-for="note in hotNotes" 
          :key="note.id"
          class="hot-note-card"
          hoverable
        >
          <template #header>
            <router-link :to="'/notes/' + note.id" class="hot-note-title">
              {{ note.title }}
            </router-link>
          </template>
          <div class="hot-note-meta">
            <span>{{ note.categories }}</span>
            <span>{{ note.view_count }} 浏览</span>
            <span>{{ formatDate(note.created_at) }}</span>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getUserCategoryList, getHotNotes } from '@/api/user'
import dayjs from 'dayjs'

// 分类数据
const categories = ref([])
const hotNotes = ref([])

// 统计数据
const totalCategories = computed(() => categories.value.length)
const totalNotes = computed(() => {
  return categories.value.reduce((sum, category) => sum + category.note_count, 0)
})
const avgNotesPerCategory = computed(() => {
  if (categories.value.length === 0) return 0
  return Math.round(totalNotes.value / totalCategories.value)
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getUserCategoryList()
    // 按笔记数量排序
    categories.value = res.data.sort((a, b) => b.note_count - a.note_count)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  }
}

// 获取热门笔记
const fetchHotNotes = async () => {
  try {
    const res = await getHotNotes({ limit: 5 })
    hotNotes.value = res.data
  } catch (error) {
    console.error('获取热门笔记失败:', error)
  }
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

// 页面加载时获取数据
onMounted(() => {
  fetchCategories()
  fetchHotNotes()
})
</script>

<style scoped>
.category-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.category-content {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1.5rem;
}

.category-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #42b983;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.category-card {
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
}

.category-title:hover {
  color: #42b983;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
}

.category-desc {
  color: #666;
  line-height: 1.6;
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.category-actions {
  margin-top: auto;
  margin-top: 1rem;
}

.view-all-link {
  color: #42b983;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.view-all-link:hover {
  color: #35495e;
}

.category-ranking {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #42b983;
  color: #333;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.ranking-item:hover {
  background-color: #e9ecef;
}

.ranking-number {
  width: 24px;
  height: 24px;
  background-color: #42b983;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.ranking-name {
  flex: 1;
  color: #333;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s;
}

.ranking-name:hover {
  color: #42b983;
}

.ranking-count {
  color: #666;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.hot-notes-section {
  margin-top: 3rem;
}

.hot-notes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.hot-note-card {
  transition: all 0.3s ease;
}

.hot-note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hot-note-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hot-note-title:hover {
  color: #42b983;
}

.hot-note-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}
</style>