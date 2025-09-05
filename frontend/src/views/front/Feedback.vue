<template>
  <div class="feedback-page">
    <el-card class="feedback-content">
      <template #header>
        <h2 class="page-title">意见反馈</h2>
      </template>
      
      <!-- 反馈表单 -->
      <el-form 
        ref="feedbackForm" 
        :model="feedbackForm" 
        :rules="feedbackRules" 
        class="feedback-form"
      >
        <el-form-item label="反馈类型" prop="type">
          <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型">
            <el-option label="功能建议" value="suggestion"></el-option>
            <el-option label="Bug反馈" value="bug"></el-option>
            <el-option label="内容纠错" value="content"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="反馈标题" prop="title">
          <el-input v-model="feedbackForm.title" placeholder="请输入反馈标题"></el-input>
        </el-form-item>
        
        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="feedbackForm.content"
            type="textarea"
            :rows="6"
            placeholder="请详细描述您的问题或建议..."
          ></el-input>
        </el-form-item>
        
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="feedbackForm.contact" placeholder="请留下您的邮箱或手机号，方便我们回复您"></el-input>
        </el-form-item>
        
        <el-form-item label="上传截图" prop="images">
          <el-upload
            v-model:file-list="fileList"
            :action="uploadUrl"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            multiple
            :limit="3"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png/gif格式，单张不超过5MB，最多上传3张
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitFeedback"
            :loading="submitting"
          >
            提交反馈
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 反馈须知 -->
      <div class="feedback-notice">
        <h3>反馈须知</h3>
        <ul>
          <li>我们会认真对待每一条反馈，并尽快处理</li>
          <li>请尽可能详细地描述您的问题或建议，以便我们更好地理解</li>
          <li>对于Bug反馈，建议提供截图和详细的复现步骤</li>
          <li>如果您留下了联系方式，我们会在处理后与您联系</li>
        </ul>
      </div>
    </el-card>
    
    <!-- 反馈历史 -->
    <div class="feedback-history-section" v-if="showHistory && feedbackHistory.length > 0">
      <h3 class="section-title">
        我的反馈历史
        <el-button type="text" size="small" @click="toggleHistory">隐藏</el-button>
      </h3>
      <div class="feedback-history-list">
        <el-card 
          v-for="feedback in feedbackHistory" 
          :key="feedback.id"
          class="feedback-history-card"
        >
          <template #header>
            <div class="history-header">
              <span class="history-title">{{ feedback.title }}</span>
              <el-tag :type="getStatusType(feedback.status)">
                {{ getStatusText(feedback.status) }}
              </el-tag>
            </div>
          </template>
          <div class="history-content">
            <div class="history-meta">
              <span>类型：{{ getTypeText(feedback.type) }}</span>
              <span>提交时间：{{ formatDate(feedback.created_at) }}</span>
              <span v-if="feedback.updated_at">更新时间：{{ formatDate(feedback.updated_at) }}</span>
            </div>
            <div class="history-desc">{{ feedback.content }}</div>
            
            <!-- 管理员回复 -->
            <div class="admin-reply" v-if="feedback.reply">
              <div class="reply-header">
                <span class="reply-title">管理员回复：</span>
                <span class="reply-time">{{ formatDate(feedback.reply_time) }}</span>
              </div>
              <div class="reply-content">{{ feedback.reply }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 查看历史按钮 -->
    <div v-else-if="!showHistory" class="view-history-container">
      <el-button type="primary" @click="toggleHistory">查看我的反馈历史</el-button>
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog v-model="dialogVisible" title="图片预览" width="800px">
      <img 
        :src="dialogImageUrl" 
        alt="预览图片"
        style="display: block; max-width: 100%; margin: 0 auto;"
      >
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { submitUserFeedback, getUserFeedbackHistory } from '@/api/user'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'

// 表单相关
const feedbackForm = reactive({
  type: '',
  title: '',
  content: '',
  contact: ''
})

const feedbackRules = {
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入反馈标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ]
}

// 上传相关
const fileList = ref([])
const uploadUrl = '/api/upload/image' // 上传接口地址
const dialogVisible = ref(false)
const dialogImageUrl = ref('')

// 状态
const submitting = ref(false)
const showHistory = ref(false)
const feedbackHistory = ref([])

// 表单引用
const feedbackFormRef = ref(null)

// 上传前校验
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG/GIF 格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 预览图片
const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url || uploadFile.preview
  dialogVisible.value = true
}

// 删除图片
const handleRemove = (uploadFile, uploadFiles) => {
  const index = fileList.value.findIndex(file => file.uid === uploadFile.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
  return true
}

// 提交反馈
const submitFeedback = async () => {
  try {
    // 表单验证
    await feedbackFormRef.value.validate()
    
    submitting.value = true
    
    // 准备表单数据
    const formData = new FormData()
    formData.append('type', feedbackForm.type)
    formData.append('title', feedbackForm.title)
    formData.append('content', feedbackForm.content)
    formData.append('contact', feedbackForm.contact)
    
    // 添加图片文件
    fileList.value.forEach(file => {
      formData.append('images[]', file.raw)
    })
    
    // 提交反馈
    await submitUserFeedback(formData)
    
    ElMessage.success('反馈提交成功！感谢您的宝贵意见')
    
    // 重置表单
    resetForm()
    
    // 刷新反馈历史
    if (showHistory.value) {
      fetchFeedbackHistory()
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (feedbackFormRef.value) {
    feedbackFormRef.value.resetFields()
  }
  fileList.value = []
}

// 获取反馈历史
const fetchFeedbackHistory = async () => {
  try {
    const res = await getUserFeedbackHistory()
    feedbackHistory.value = res.data
  } catch (error) {
    console.error('获取反馈历史失败:', error)
    ElMessage.error('获取反馈历史失败')
  }
}

// 切换历史记录显示
const toggleHistory = () => {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    fetchFeedbackHistory()
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    rejected: '已驳回'
  }
  return statusMap[status] || status
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    processing: 'warning',
    resolved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'default'
}

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    content: '内容纠错',
    other: '其他'
  }
  return typeMap[type] || type
}

// 页面加载时获取数据
onMounted(() => {
  // 页面加载时可以不自动获取反馈历史，节省请求
})
</script>

<style scoped>
.feedback-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.feedback-content {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1.5rem;
}

.feedback-form {
  margin-bottom: 2rem;
}

.el-form-item {
  margin-bottom: 1.5rem;
}

.feedback-notice {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.feedback-notice h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.feedback-notice ul {
  padding-left: 1.5rem;
  color: #666;
  line-height: 1.8;
}

.feedback-notice li {
  margin-bottom: 0.5rem;
}

.feedback-history-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #42b983;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-history-card {
  transition: all 0.3s ease;
}

.feedback-history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.history-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: #666;
}

.history-desc {
  color: #333;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.admin-reply {
  background-color: #e3f2fd;
  padding: 1rem;
  border-radius: 4px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reply-title {
  font-weight: 600;
  color: #1976d2;
}

.reply-time {
  font-size: 0.8rem;
  color: #666;
}

.reply-content {
  color: #333;
  line-height: 1.6;
}

.view-history-container {
  text-align: center;
  margin-top: 2rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .history-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .reply-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>