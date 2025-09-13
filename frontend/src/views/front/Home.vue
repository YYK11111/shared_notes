<template>
  <div class="home-page">
    <!-- 轮播图 -->
    <div class="banner">
      <el-carousel height="300px">
        <el-carousel-item v-for="(myCarouselItem, index) in carousels" :key="myCarouselItem?.file_id || 'default-' + index">
          <img :src="myCarouselItem.imageUrl" :alt="`轮播图-${myCarouselItem?.file_id || 'default'}`" />
        </el-carousel-item>
      </el-carousel>
    </div>
    
    <div class="home-content">
      <div class="left-side">
        <!-- 推荐笔记 -->
        <section class="recommend-section">
          <h2 class="section-title">推荐笔记</h2>
          <div class="note-list">
            <el-card 
              v-for="note in recommendNotes" 
              :key="note.id"
              class="note-card"
              hoverable
            >
              <template #header>
                <router-link :to="'/notes/' + note.id" class="note-title">{{ note.title }}</router-link>
              </template>
              <div class="note-meta">
                <span>{{ note.categories }}</span>
                <span>{{ formatDate(note.created_at) }}</span>
                <span>{{ note.view_count }} 浏览</span>
              </div>
              <div class="note-excerpt">
                {{ truncateText(note.content, 100) }}
              </div>
            </el-card>
          </div>
        </section>
        
        <!-- 最新笔记 -->
        <section class="latest-section">
          <h2 class="section-title">最新笔记</h2>
          <div class="note-list">
            <el-card 
              v-for="note in latestNotes" 
              :key="note.id"
              class="note-card"
              hoverable
            >
              <template #header>
                <router-link :to="'/notes/' + note.id" class="note-title">{{ note.title }}</router-link>
              </template>
              <div class="note-meta">
                <span>{{ note.categories }}</span>
                <span>{{ formatDate(note.created_at) }}</span>
                <span>{{ note.view_count }} 浏览</span>
              </div>
              <div class="note-excerpt">
                {{ truncateText(note.content, 100) }}
              </div>
            </el-card>
          </div>
          
          <div class="pagination-container">
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
        </section>
      </div>
      
      <div class="right-side">
        <!-- 热门分类 -->
        <section class="categories-section">
          <h2 class="section-title">热门分类</h2>
          <div class="category-list">
            <router-link 
              v-for="category in categories" 
              :key="category.id"
              :to="'/categories/' + category.id"
              class="category-item"
            >
              {{ category.name }}
              <span class="count">{{ category.note_count }}</span>
            </router-link>
          </div>
        </section>
        
        <!-- 热门笔记 -->
        <section class="hot-section">
          <h2 class="section-title">热门笔记</h2>
          <div class="hot-list">
            <div 
              v-for="(note, index) in hotNotes" 
              :key="note.id"
              class="hot-item"
            >
              <span class="rank">{{ index + 1 }}</span>
              <router-link :to="'/notes/' + note.id" class="hot-title">{{ note.title }}</router-link>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getRecommendNotes, getUserNoteList, getUserCategoryList, getHotNotes } from '@/api/user'
import { getFileObjectUrl } from '@/api/file'
import { getCarousels } from '@/api/public'
import dayjs from 'dayjs'

// 推荐笔记
const recommendNotes = ref([])
// 最新笔记
const latestNotes = ref([])
// 分类列表
// 存储图片URL释放函数
const imageRevokeFunctions = ref({})
const categories = ref([])
// 热门笔记
const hotNotes = ref([])
// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 轮播图数据 - 初始化为空数组确保始终有有效值
const carousels = ref([])

// 获取推荐笔记
const fetchRecommendNotes = async () => {
  try {
    const res = await getRecommendNotes({ limit: 5 })
    recommendNotes.value = res.data
  } catch (error) {
    console.error('获取推荐笔记失败:', error)
  }
}

// 获取最新笔记
const fetchLatestNotes = async () => {
  try {
    const res = await getUserNoteList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sort: 'created_at',
      order: 'desc'
    })
    latestNotes.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error('获取最新笔记失败:', error)
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getUserCategoryList()
    categories.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取热门笔记
const fetchHotNotes = async () => {
  try {
    const res = await getHotNotes({ limit: 10 })
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
  // 去除Markdown格式
  const plainText = text.replace(/[#*`[\]]/g, '')
  if (plainText.length <= length) {
    return plainText
  }
  return plainText.slice(0, length) + '...'
}

// 分页事件处理
const handleSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchLatestNotes()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchLatestNotes()
}

// 获取轮播图 - 增加严格的数据验证以避免TypeError
const fetchCarousels = async () => {
  try {
    // 确保carousels始终是数组
    carousels.value = carousels.value || []
    
    // 获取轮播图数据
    const result = await getCarousels()
    
    // 创建临时数组存储有效轮播图，避免直接修改原数组导致渲染问题
    const validCarousels = []
    
    if (result?.code === 200 && result?.data && Array.isArray(result.data)) {
      // 过滤出有效的carousel对象并设置imageUrl
      for (const carousel of result.data) {
        // 只处理存在的carousel对象
        if (carousel && typeof carousel === 'object') {
          const validCarousel = { ...carousel } // 深拷贝避免修改原始数据
          
          if (validCarousel.file_id) {
              try {
                // 获取图片临时URL并验证
                console.log('开始获取文件ID:', validCarousel.file_id);
                // 先释放可能存在的旧URL
                if (imageRevokeFunctions.value[validCarousel.file_id]) {
                  imageRevokeFunctions.value[validCarousel.file_id]();
                }
                
                const { url, revoke } = await getFileObjectUrl(validCarousel.file_id)
                imageRevokeFunctions.value[validCarousel.file_id] = revoke
                
                // 添加详细的日志记录
                console.log('获取到的URL类型:', typeof url);
                console.log('URL长度:', url?.length || 0);
                console.log('URL前20个字符:', url?.substring(0, 20) || '无');
                
                // 设置图片URL
                validCarousel.imageUrl = url;
                console.log('成功设置imageUrl:', validCarousel.file_id);
              } catch (error) {
                console.error('获取轮播图文件失败:', error, '文件ID:', validCarousel.file_id);
                validCarousel.imageUrl = 'https://fuss10.elemecdn.com/8/c4/e6/18059aeebefb6f2484a738c594f79126.png';
              }
            } else {
              // 无file_id时使用默认图片
              validCarousel.imageUrl = 'https://fuss10.elemecdn.com/8/c4/e6/18059aeebefb6f2484a738c594f79126.png'
            }
          
          validCarousels.push(validCarousel)
        }
      }
    }
    
    // 只有在获取到有效数据时才更新carousels，确保数据完整性
    if (validCarousels.length > 0) {
      carousels.value = validCarousels
    } else {
      console.warn('未获取到有效轮播图数据，使用默认轮播图')
      carousels.value = [{ 
        id: 'default', 
        file_id: 'default', 
        imageUrl: 'https://fuss10.elemecdn.com/8/c4/e6/18059aeebefb6f2484a738c594f79126.png' 
      }]
    }
  } catch (error) {
    console.error('获取轮播图数据异常:', error)
    // 任何异常情况下都提供默认轮播图，确保UI始终正常显示
    carousels.value = [{ 
      id: 'default', 
      file_id: 'default', 
      imageUrl: 'https://fuss10.elemecdn.com/8/c4/e6/18059aeebefb6f2484a738c594f79126.png' 
    }]
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchCarousels()
  fetchRecommendNotes()
  fetchLatestNotes()
  fetchCategories()
  fetchHotNotes()
})

// 组件卸载时释放所有图片URL
onUnmounted(() => {
  // 释放所有临时URL
  Object.values(imageRevokeFunctions.value).forEach(revoke => {
    if (typeof revoke === 'function') {
      revoke();
    }
  });
  
  // 清空缓存
  imageRevokeFunctions.value = {};
})
</script>

<style scoped>
.banner {
  margin-bottom: 2rem;
}

.banner img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.home-content {
  display: flex;
  gap: 2rem;
}

.left-side {
  flex: 3;
}

.right-side {
  flex: 1;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #42b983;
  color: #333;
}

.note-list {
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

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
}

.category-item:hover {
  background-color: #42b983;
  color: #fff;
}

.category-item .count {
  background-color: #ddd;
  color: #666;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.category-item:hover .count {
  background-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rank {
  width: 24px;
  height: 24px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
}

.hot-item:nth-child(1) .rank,
.hot-item:nth-child(2) .rank,
.hot-item:nth-child(3) .rank {
  background-color: #e74c3c;
  color: #fff;
}

.hot-title {
  font-size: 0.95rem;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-title:hover {
  color: #42b983;
}
</style>