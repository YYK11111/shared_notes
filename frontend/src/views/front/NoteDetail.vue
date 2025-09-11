<template>
  <div class="note-detail">
    <el-card v-if="note" class="note-content">
      <template #header>
        <div class="note-header">
          <h1 class="note-title">{{ note.title }}</h1>
          <div class="note-meta">
            <span>{{ note.categories }}</span>
            <span>{{ formatDate(note.created_at) }}</span>
            <span>{{ note.view_count }} 浏览</span>
            <span>{{ note.like_count }} 喜欢</span>
          </div>
        </div>
      </template>
      
      <!-- 笔记内容 -->
      <div class="note-body" v-html="renderedContent"></div>
      
      <!-- 操作按钮 -->
      <div class="note-actions">
        <el-button @click="handleLike" type="primary" :loading="likeLoading">
            <el-icon><component :is="likeIcon" /></el-icon>
            {{ isLiked ? '取消喜欢' : '喜欢' }}
          </el-button>
        <el-button @click="handleShare" type="default" :loading="shareLoading">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
        <el-button @click="handleReport" type="default" :loading="reportLoading">
            <el-icon><Warning /></el-icon>
            举报
          </el-button>
      </div>
      
      <!-- 评论区域 -->
      <div class="comment-section">
        <h3 class="section-title">评论 ({{ comments.length }})</h3>
        
        <!-- 评论输入框 -->
        <div class="comment-input">
          <el-input
            v-model="commentContent"
            type="textarea"
            placeholder="写下你的评论..."
            :rows="3"
          ></el-input>
          <div class="comment-submit">
            <el-button 
              @click="handleSubmitComment"
              type="primary"
              :disabled="!commentContent.trim()"
              :loading="commentLoading"
            >
              提交评论
            </el-button>
          </div>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <img :src="comment.user_avatar || defaultAvatar" alt="用户头像" />
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.user_name }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <span @click="handleReply(comment)">回复</span>
                <span @click="handleCommentLike(comment)">
                  {{ comment.is_liked ? '取消点赞' : '点赞' }} ({{ comment.like_count }})
                </span>
              </div>
            </div>
          </div>
          
          <!-- 回复框 -->
          <div v-if="replyingComment" class="reply-input">
            <el-input
              v-model="replyContent"
              type="textarea"
              :placeholder="'回复 ' + replyingComment.user_name + '...'"
              :rows="2"
            ></el-input>
            <div class="reply-actions">
              <el-button @click="cancelReply">取消</el-button>
              <el-button 
                @click="handleSubmitReply"
                type="primary"
                :disabled="!replyContent.trim()"
                :loading="replyLoading"
              >
                回复
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 加载中 -->
    <el-empty v-else description="加载中..." />
    
    <!-- 相关笔记推荐 -->
    <div class="related-notes" v-if="relatedNotes.length > 0">
      <h3 class="section-title">相关笔记</h3>
      <div class="related-list">
        <el-card 
          v-for="item in relatedNotes" 
          :key="item.id"
          class="related-card"
          hoverable
        >
          <router-link :to="'/notes/' + item.id" class="related-title">
            {{ item.title }}
          </router-link>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getUserNoteDetail, likeNote, getComments, submitComment, likeComment, submitReply, getRelatedNotes } from '@/api/user'
import dayjs from 'dayjs'
import { Star, StarFilled, Share, Warning } from '@element-plus/icons-vue'

// 路由
const route = useRoute()
const noteId = route.params.id

// 笔记数据
const note = ref(null)
const comments = ref([])
const relatedNotes = ref([])

// 用户交互状态
const isLiked = ref(false)
const likeIcon = ref('StarFilled')
const likeLoading = ref(false)
const shareLoading = ref(false)
const reportLoading = ref(false)
const commentLoading = ref(false)
const replyLoading = ref(false)
const commentContent = ref('')
const replyContent = ref('')
const replyingComment = ref(null)

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// 渲染Markdown内容 (使用mavon-editor的内置marked功能)
const renderedContent = computed(() => {
  if (!note.value || !note.value.content) return ''
  
  // 由于mavon-editor已内置marked，我们可以直接使用其parse方法
  // 这里简化实现，实际应用中可考虑引入mavon-editor的marked实例
  try {
    // 假设内容已经是安全的HTML格式
    // 在实际应用中，应该使用DOMPurify等工具进行XSS防护
    return note.value.content
  } catch (error) {
    console.error('解析Markdown内容失败:', error)
    return note.value.content
  }
})

// 获取笔记详情
const fetchNoteDetail = async () => {
  try {
    const res = await getUserNoteDetail(noteId)
    note.value = res.data
    isLiked.value = res.data.is_liked
    likeIcon.value = res.data.is_liked ? 'StarFilled' : 'Star'
    // 增加浏览量
    increaseViewCount()
  } catch (error) {
    console.error('获取笔记详情失败:', error)
    ElMessage.error('获取笔记详情失败')
  }
}

// 增加浏览量
const increaseViewCount = async () => {
  try {
    await likeNote(noteId, { type: 'view' })
  } catch (error) {
    console.error('增加浏览量失败:', error)
  }
}

// 处理点赞
const handleLike = async () => {
  likeLoading.value = true
  try {
    await likeNote(noteId, { type: 'like' })
    isLiked.value = !isLiked.value
    likeIcon.value = isLiked.value ? 'IconStarFilled' : 'IconStar'
    note.value.like_count = isLiked.value 
      ? note.value.like_count + 1 
      : note.value.like_count - 1
    ElMessage.success(isLiked.value ? '点赞成功' : '取消点赞成功')
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

// 处理分享
const handleShare = async () => {
  shareLoading.value = true
  try {
    // 模拟分享功能
    const shareLink = window.location.href
    await navigator.clipboard.writeText(shareLink)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败，请手动复制链接')
  } finally {
    shareLoading.value = false
  }
}

// 处理举报
const handleReport = () => {
  ElMessageBox.prompt('请输入举报原因:', '举报笔记', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPattern: /^[\s\S]{10,}$/,
    inputErrorMessage: '举报原因至少10个字符'
  }).then(async ({ value }) => {
    reportLoading.value = true
    try {
      // 模拟举报API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      ElMessage.success('举报已提交，感谢您的反馈')
    } catch (error) {
      console.error('举报失败:', error)
      ElMessage.error('举报失败')
    } finally {
      reportLoading.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消举报')
  })
}

// 获取评论列表
const fetchComments = async () => {
  try {
    const res = await getComments(noteId)
    comments.value = res.data
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

// 提交评论
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  commentLoading.value = true
  try {
    const res = await submitComment(noteId, {
      content: commentContent.value
    })
    comments.value.unshift(res.data)
    commentContent.value = ''
    ElMessage.success('评论成功')
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败')
  } finally {
    commentLoading.value = false
  }
}

// 处理评论点赞
const handleCommentLike = async (comment) => {
  try {
    await likeComment(comment.id)
    comment.is_liked = !comment.is_liked
    comment.like_count = comment.is_liked 
      ? comment.like_count + 1 
      : comment.like_count - 1
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 处理回复
const handleReply = (comment) => {
  replyingComment.value = comment
  replyContent.value = ''
  // 滚动到回复框
  setTimeout(() => {
    const replyInput = document.querySelector('.reply-input')
    if (replyInput) {
      replyInput.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

// 取消回复
const cancelReply = () => {
  replyingComment.value = null
  replyContent.value = ''
}

// 提交回复
const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replyLoading.value = true
  try {
    const res = await submitReply(replyingComment.value.id, {
      content: replyContent.value
    })
    // 找到原评论并添加回复
    const parentComment = comments.value.find(c => c.id === replyingComment.value.id)
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(res.data)
    }
    cancelReply()
    ElMessage.success('回复成功')
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

// 获取相关笔记
const fetchRelatedNotes = async () => {
  try {
    const res = await getRelatedNotes(noteId, { limit: 5 })
    relatedNotes.value = res.data
  } catch (error) {
    console.error('获取相关笔记失败:', error)
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 页面加载时获取数据
onMounted(() => {
  fetchNoteDetail()
  fetchComments()
  fetchRelatedNotes()
})
</script>

<style scoped>
.note-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.note-content {
  margin-bottom: 2rem;
}

.note-header {
  margin-bottom: 1.5rem;
}

.note-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.note-meta {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.note-body {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #333;
}

.note-body h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.note-body h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem;
}

.note-body p {
  margin: 1rem 0;
}

.note-body pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.note-body code {
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.note-body pre code {
  background-color: transparent;
  padding: 0;
}

.note-body blockquote {
  border-left: 4px solid #42b983;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #666;
}

.note-body img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
}

.note-actions {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.comment-section {
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

.comment-input {
  margin-bottom: 1.5rem;
}

.comment-submit {
  text-align: right;
  margin-top: 0.5rem;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-time {
  color: #999;
  font-size: 0.8rem;
}

.comment-text {
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.comment-actions span {
  color: #666;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s;
}

.comment-actions span:hover {
  color: #42b983;
}

.reply-input {
  margin-top: 1rem;
  margin-left: 50px;
}

.reply-actions {
  text-align: right;
  margin-top: 0.5rem;
}

.related-notes {
  margin-top: 3rem;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.related-card {
  transition: all 0.3s ease;
}

.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.related-title {
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

.related-title:hover {
  color: #42b983;
}
</style>