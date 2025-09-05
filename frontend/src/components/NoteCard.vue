<template>
  <div class="note-card" :class="{ 'note-card--hover': hoverable }" @click="handleClick">
    <!-- 封面图片 -->
    <div v-if="note.coverImage" class="note-card__cover">
      <img :src="note.coverImage" :alt="note.title" class="note-card__cover-image" />
    </div>
    
    <!-- 内容区域 -->
    <div class="note-card__content">
      <!-- 分类标签 -->
      <div v-if="note.category" class="note-card__category">
        <el-tag size="small" :type="categoryType">
          {{ note.category.name }}
        </el-tag>
      </div>
      
      <!-- 标题 -->
      <h3 class="note-card__title" :title="note.title">
        {{ truncateText(note.title, titleLength) }}
      </h3>
      
      <!-- 摘要 -->
      <p v-if="showSummary" class="note-card__summary" :title="getPlainText(note.content)">
        {{ truncateText(getPlainText(note.content), summaryLength) }}
      </p>
      
      <!-- 标签 -->
      <div v-if="note.tags && note.tags.length > 0" class="note-card__tags">
        <el-tag 
          v-for="tag in note.tags.slice(0, maxTags)"
          :key="tag.id || tag.name"
          size="small"
          type="info"
          class="note-card__tag"
        >
          {{ tag.name }}
        </el-tag>
        <el-tag 
          v-if="note.tags.length > maxTags"
          size="small"
          type="info"
          class="note-card__tag"
        >
          +{{ note.tags.length - maxTags }}
        </el-tag>
      </div>
      
      <!-- 底部信息 -->
      <div class="note-card__footer">
        <!-- 作者信息 -->
        <div v-if="showAuthor && note.author" class="note-card__author">
          <el-avatar :size="24" :src="note.author.avatar || defaultAvatar" />
          <span class="note-card__author-name">{{ note.author.username }}</span>
        </div>
        
        <!-- 统计信息 -->
        <div class="note-card__stats">
          <div v-if="showViews" class="note-card__stat">
            <el-icon :size="14"><View /></el-icon>
            <span>{{ note.views || 0 }}</span>
          </div>
          <div v-if="showLikes" class="note-card__stat">
            <el-icon :size="14"><Like /></el-icon>
            <span>{{ note.likes || 0 }}</span>
          </div>
          <div v-if="showComments" class="note-card__stat">
            <el-icon :size="14"><ChatDotRound /></el-icon>
            <span>{{ note.comments || 0 }}</span>
          </div>
          <div v-if="showCollects" class="note-card__stat">
            <el-icon :size="14"><Star /></el-icon>
            <span>{{ note.collects || 0 }}</span>
          </div>
        </div>
        
        <!-- 时间信息 -->
        <div v-if="showTime" class="note-card__time">
          {{ formatTime(note.createdAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { View, Like, ChatDotRound, Star } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
// 由于在某些环境中可能无法正确加载语言包，使用英文格式但保持中文表达习惯

// 定义组件属性
const props = defineProps({
  // 笔记数据
  note: {
    type: Object,
    required: true,
    default: () => ({})
  },
  // 标题最大长度
  titleLength: {
    type: Number,
    default: 50
  },
  // 摘要最大长度
  summaryLength: {
    type: Number,
    default: 100
  },
  // 最大显示标签数量
  maxTags: {
    type: Number,
    default: 3
  },
  // 是否显示摘要
  showSummary: {
    type: Boolean,
    default: true
  },
  // 是否显示作者信息
  showAuthor: {
    type: Boolean,
    default: true
  },
  // 是否显示浏览量
  showViews: {
    type: Boolean,
    default: true
  },
  // 是否显示点赞数
  showLikes: {
    type: Boolean,
    default: true
  },
  // 是否显示评论数
  showComments: {
    type: Boolean,
    default: true
  },
  // 是否显示收藏数
  showCollects: {
    type: Boolean,
    default: true
  },
  // 是否显示时间
  showTime: {
    type: Boolean,
    default: true
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },
  // 是否有悬停效果
  hoverable: {
    type: Boolean,
    default: true
  },
  // 默认头像
  defaultAvatar: {
    type: String,
    default: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  }
})

// 定义组件事件
const emit = defineEmits(['click', 'view', 'like', 'comment'])

// 计算分类标签类型
const categoryType = computed(() => {
  const typeMap = {
    技术: 'primary',
    生活: 'success',
    工作: 'warning',
    学习: 'info',
    其他: 'default'
  }
  return props.note.category ? typeMap[props.note.category.name] || 'default' : 'default'
})

// 处理点击事件
const handleClick = () => {
  if (props.clickable) {
    emit('click', props.note)
  }
}

// 截取文本
const truncateText = (text, length) => {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 获取纯文本（去除HTML标签）
const getPlainText = (html) => {
  if (!html || typeof html !== 'string') return ''
  // 简单的HTML标签移除，实际项目中可能需要更复杂的处理
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  // 计算时间差（毫秒）
  const now = dayjs()
  const target = dayjs(time)
  const diff = now.diff(target, 'day')
  
  // 根据时间差返回不同的格式化结果
  if (diff < 1) {
    // 今天之内的，显示相对时间
    return dayjs(time).fromNow()
  } else if (diff < 7) {
    // 一周内的，显示星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[dayjs(time).day()]
  } else if (diff < 365) {
    // 一年内的，显示月日
    return dayjs(time).format('MM-DD')
  } else {
    // 超过一年的，显示年月日
    return dayjs(time).format('YYYY-MM-DD')
  }
}
</script>

<style scoped>
.note-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: default;
}

.note-card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.note-card__cover {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.note-card__cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.note-card--hover:hover .note-card__cover-image {
  transform: scale(1.05);
}

.note-card__content {
  padding: 16px;
}

.note-card__category {
  margin-bottom: 8px;
}

.note-card__title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card__summary {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-card__tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.note-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.note-card__author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.note-card__author-name {
  color: #606266;
}

.note-card__stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-card__stat {
  display: flex;
  align-items: center;
  gap: 2px;
}

.note-card__time {
  color: #909399;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .note-card__cover {
    height: 120px;
  }
  
  .note-card__content {
    padding: 12px;
  }
  
  .note-card__title {
    font-size: 16px;
  }
  
  .note-card__summary {
    font-size: 13px;
  }
  
  .note-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>