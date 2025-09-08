<template>
  <div class="note-edit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">{{ isEditMode ? '编辑笔记' : '创建笔记' }}</h2>
          <div class="header-actions">
            <el-button @click="handleCancel">
              <el-icon><ArrowLeft /></el-icon>
              取消
            </el-button>
            <el-button type="primary" @click="handleSaveNote" :loading="loading">
              <el-icon><Check /></el-icon>
              {{ isEditMode ? '更新笔记' : '创建笔记' }}
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 自动保存提示 -->
      <div v-if="autoSaveStatus" class="auto-save-indicator">
        <el-icon v-if="autoSaveStatus === 'saving'" class="icon-loading"><Loading /></el-icon>
        <el-icon v-if="autoSaveStatus === 'success'" class="icon-success"><Check /></el-icon>
        <span>{{ autoSaveStatus === 'saving' ? '正在自动保存...' : '已自动保存草稿' }}</span>
      </div>
      
      <!-- 笔记表单 -->
      <div class="note-form-container">
        <el-form :model="noteForm" ref="noteFormRef" label-width="100px" :disabled="loading">
          <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入笔记标题', trigger: 'blur' }]">
            <el-input v-model="noteForm.title" placeholder="请输入笔记标题" />
          </el-form-item>
          
          <el-form-item label="分类" prop="category_id" :rules="[{ required: true, message: '请选择笔记分类', trigger: 'change' }]">
            <el-select v-model="noteForm.category_id" placeholder="请选择笔记分类" filterable>
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="标签" prop="tags">
            <el-input 
              v-model="noteForm.tags" 
              placeholder="请输入标签，按回车添加" 
              @keydown.enter.prevent="addTag"
            />
            <!-- 已添加的标签显示 -->
            <div class="tags-display" v-if="tagList.length">
              <el-tag 
                v-for="(tag, index) in tagList" 
                :key="index" 
                closable 
                @close="removeTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="form-hint">最多添加5个标签，每个标签不超过10个字符</div>
          </el-form-item>
          
          <el-form-item label="封面图片">
            <el-upload
              v-model:file-list="imageFileList"
              class="upload-demo"
              action=""
              :before-upload="handleBeforeUpload"
              :http-request="handleImageUpload"
              :auto-upload="false"
              :show-file-list="true"
              list-type="picture-card"
              :limit="1"
              :on-exceed="handleExceed"
            >
              <el-icon><Plus /></el-icon>
              <template #file="{ file }">
                <div class="upload-file-container">
                  <img :src="file.url" alt="封面图片" class="preview-image" />
                  <div v-if="file.status === 'uploading'" class="upload-progress">
                    <el-progress :percentage="file.percentage" stroke-width="2" />
                  </div>
                  <div class="el-upload__file-action">
                    <el-icon @click="handleRemoveImage"><Delete /></el-icon>
                  </div>
                </div>
              </template>
            </el-upload>
            <div class="form-hint">建议上传宽高比为4:3的图片，大小不超过2MB</div>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-radio-group v-model="noteForm.status">
              <el-radio :label="1">已发布</el-radio>
              <el-radio :label="0">草稿</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="是否推荐">
            <el-switch v-model="noteForm.is_recommended" active-value="1" inactive-value="0" />
          </el-form-item>
          
          <el-form-item label="内容" prop="content" :rules="[{ required: true, message: '请输入笔记内容', trigger: 'blur' }]">
            <div class="editor-container">
              <mavon-editor
                v-model="noteForm.content"
                :ishljs="true"
                :toolbars="toolbars"
                @imgAdd="handleImgAdd"
                @change="handleContentChange"
                style="min-height: 500px"
              />
            </div>
          </el-form-item>
          
          <el-form-item label="SEO描述">
            <el-input 
              v-model="noteForm.seo_description" 
              type="textarea" 
              placeholder="请输入SEO描述" 
              :rows="2"
              :maxlength="160"
              show-word-limit
            />
            <div class="form-hint">不超过160个字符，用于搜索引擎展示</div>
          </el-form-item>
          
          <el-form-item label="SEO关键词">
            <el-input 
              v-model="noteForm.seo_keywords" 
              placeholder="请输入SEO关键词，用逗号分隔" 
            />
            <div class="form-hint">最多添加5个关键词</div>
          </el-form-item>
          
          <!-- 编辑模式下显示 -->
          <div v-if="isEditMode" class="edit-mode-fields">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="noteForm.created_at"
                type="datetime"
                placeholder="选择创建时间"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="更新时间">
              <el-date-picker
                v-model="noteForm.updated_at"
                type="datetime"
                placeholder="选择更新时间"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Check, ArrowLeft, Plus, Delete, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElProgress } from 'element-plus'
import { createNote, updateNote, getNoteDetail, uploadNoteImage } from '@/api/note'
import { getCategoryList } from '@/api/category'
import { marked } from 'marked'
import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

const router = useRouter()
const route = useRoute()
const noteId = route.params.id
const isEditMode = !!noteId

// 状态变量
const loading = ref(false)
const imageUploadLoading = ref(false)
const autoSaveStatus = ref('') // 'saving', 'success', ''
const categories = ref([])
const imageFileList = ref([])
const noteFormRef = ref()
const tagList = ref([])
const autoSaveTimer = ref(null)

// 笔记表单数据
const noteForm = reactive({
  title: '',
  category_id: '',
  tags: '',
  cover_image: '',
  status: 1,
  is_recommended: '0',
  content: '',
  seo_description: '',
  seo_keywords: '',
  created_at: new Date(),
  updated_at: new Date()
})

// 编译Markdown
const compiledMarkdown = computed(() => {
  if (!noteForm.content) return ''
  return marked.parse(noteForm.content)
})

// 修正后的mavon-editor工具栏配置
const toolbars = {
  bold: true,          // 粗体
  italic: true,        // 斜体
  header: true,        // 标题
  underline: true,     // 下划线
  strikethrough: true, // 删除线
  mark: true,          // 标记
  code: true,          // 代码
  subscript: true,     // 下标
  superscript: true,   // 上标（修正了此处的语法错误）
  quote: true,         // 引用
  ol: true,            // 有序列表
  ul: true,            // 无序列表
  link: true,          // 链接
  imagelink: true,     // 图片链接
  table: true,         // 表格
  fullscreen: true,    // 全屏
  readmodel: true,     // 阅读模式
  htmlcode: true,      // HTML代码
  help: true,          // 帮助
  undo: true,          // 撤销
  redo: true,          // 重做
  trash: true,         // 清空
  save: true,          // 保存
  navigation: true,    // 导航
  alignleft: true,     // 左对齐
  aligncenter: true,   // 居中对齐
  alignright: true,    // 右对齐
  subfield: true,      // 单双栏模式
  preview: true        // 预览
}

// 处理内容变化，设置自动保存
const handleContentChange = () => {
  // 清除之前的定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
  
  // 5秒后自动保存草稿
  autoSaveTimer.value = setTimeout(() => {
    if (noteForm.title || noteForm.content) {
      autoSaveDraft()
    }
  }, 5000)
}

// 自动保存草稿
const autoSaveDraft = async () => {
  // 如果已经是草稿状态，不重复保存
  if (noteForm.status === 0 && autoSaveStatus.value === 'success') return
  
  autoSaveStatus.value = 'saving'
  
  try {
    const originalStatus = noteForm.status
    // 临时设置为草稿状态保存
    noteForm.status = 0
    
    const noteData = {
      title: noteForm.title,
      category_id: noteForm.category_id,
      tags: tagList.value,
      cover_image: noteForm.cover_image,
      status: 0, // 确保保存为草稿
      is_recommended: noteForm.is_recommended === '1',
      content: noteForm.content,
      seo_description: noteForm.seo_description,
      seo_keywords: noteForm.seo_keywords
    }
    
    let response
    if (isEditMode) {
      response = await updateNote(noteId, noteData)
    } else {
      // 对于新建笔记，保存后获取ID以便后续更新
      response = await createNote(noteData)
      if (response.code === 200 && response.data?.id && !noteId) {
        // 首次自动保存后更新路由，确保后续保存正确
        router.replace(`/admin/notes/edit/${response.data.id}`)
      }
    }
    
    if (response.code === 200) {
      autoSaveStatus.value = 'success'
      // 3秒后隐藏成功提示
      setTimeout(() => {
        autoSaveStatus.value = ''
      }, 3000)
    } else {
      throw new Error(response.message || '自动保存失败')
    }
    
    // 恢复原始状态
    noteForm.status = originalStatus
  } catch (error) {
    console.error('自动保存失败:', error)
    autoSaveStatus.value = ''
  }
}

// 处理图片添加到编辑器
const handleImgAdd = async (pos, $file) => {
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('image', $file)
    
    // 调用上传图片接口
    const response = await uploadNoteImage(formData)
    
    if (response.code === 200 && response.data?.url) {
      // 将图片路径插入到编辑器中
      const mavonEditorEl = document.querySelector('.mavon-editor')
      if (mavonEditorEl && mavonEditorEl.$img2Url) {
        mavonEditorEl.$img2Url(pos, response.data.url)
      }
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('图片上传失败：' + (response.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error('图片上传失败：' + (error.message || '未知错误'))
    console.error('图片上传失败:', error)
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategoryList()
    categories.value = response.data?.items || []
  } catch (error) {
    ElMessage.error('获取分类列表失败：' + (error.message || '未知错误'))
    console.error('获取分类列表失败:', error)
  }
}

// 获取笔记详情（编辑模式）
const fetchNoteDetail = async () => {
  if (!isEditMode) return
  
  loading.value = true
  try {
    const response = await getNoteDetail(noteId)
    const note = response.data
    
    // 填充表单数据
    Object.assign(noteForm, {
      title: note.title,
      category_id: note.category_id,
      cover_image: note.cover_image || '',
      status: note.status,
      is_recommended: note.is_recommended ? '1' : '0',
      content: note.content,
      seo_description: note.seo_description || '',
      seo_keywords: note.seo_keywords || '',
      created_at: dayjs(note.created_at).toDate(),
      updated_at: dayjs(note.updated_at).toDate()
    })
    
    // 处理标签
    if (note.tags && Array.isArray(note.tags)) {
      tagList.value = [...note.tags]
    }
    
    // 处理封面图片
    if (note.cover_image) {
      imageFileList.value = [{ url: note.cover_image, status: 'success' }]
    }
  } catch (error) {
    ElMessage.error('获取笔记详情失败：' + (error.message || '未知错误'))
    console.error('获取笔记详情失败:', error)
    // 如果获取失败，返回笔记列表页
    router.push('/admin/notes')
  } finally {
    loading.value = false
  }
}

// 添加标签
const addTag = () => {
  if (!noteForm.tags.trim()) return
  
  const newTag = noteForm.tags.trim()
  
  // 验证标签
  if (tagList.value.length >= 5) {
    ElMessage.warning('最多添加5个标签')
    return
  }
  
  if (newTag.length > 10) {
    ElMessage.warning('每个标签不超过10个字符')
    return
  }
  
  if (tagList.value.includes(newTag)) {
    ElMessage.warning('该标签已存在')
    noteForm.tags = ''
    return
  }
  
  // 添加标签
  tagList.value.push(newTag)
  noteForm.tags = ''
  
  // 触发自动保存
  handleContentChange()
}

// 移除标签
const removeTag = (index) => {
  tagList.value.splice(index, 1)
  // 触发自动保存
  handleContentChange()
}

// 验证标签格式
const validateTags = () => {
  if (tagList.value.length > 5) {
    ElMessage.warning('最多添加5个标签')
    return false
  }
  
  for (const tag of tagList.value) {
    if (tag.length > 10) {
      ElMessage.warning('每个标签不超过10个字符')
      return false
    }
  }
  
  return true
}

// 处理图片上传前校验
const handleBeforeUpload = (file) => {
  const isLessThan2MB = file.size / 1024 / 1024 < 2
  
  if (!isLessThan2MB) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  // 读取图片获取宽高比
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    const img = new Image()
    img.src = e.target.result
    img.onload = () => {
      const aspectRatio = img.width / img.height
      // 检查宽高比是否在4:3的合理范围内 (1.333)
      if (aspectRatio < 1.2 || aspectRatio > 1.5) {
        ElMessage.warning('建议上传宽高比为4:3的图片')
      }
    }
  }
  
  return true
}

// 处理图片上传
const handleImageUpload = async (options) => {
  const { file, onSuccess, onError, onProgress } = options
  
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('image', file)
    
    // 调用上传图片接口，监听进度
    const response = await uploadNoteImage(formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ percent })
      }
    })
    
    if (response.code === 200 && response.data?.url) {
      noteForm.cover_image = response.data.url
      onSuccess(response)
      ElMessage.success('图片上传成功')
    } else {
      throw new Error(response.message || '图片上传失败')
    }
  } catch (error) {
    onError(error)
    ElMessage.error('图片上传失败：' + (error.message || '未知错误'))
    console.error('图片上传失败:', error)
  }
}

// 处理图片超出数量
const handleExceed = () => {
  ElMessage.warning('最多只能上传1张封面图片')
}

// 移除图片
const handleRemoveImage = () => {
  imageFileList.value = []
  noteForm.cover_image = ''
}

// 保存笔记
const handleSaveNote = async () => {
  // 清除自动保存定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
  
  // 验证表单
  const isValid = await noteFormRef.value.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  // 验证标签格式
  if (!validateTags()) {
    return
  }
  
  // 准备保存的数据
  const noteData = {
    title: noteForm.title,
    category_id: noteForm.category_id,
    tags: tagList.value,
    cover_image: noteForm.cover_image,
    status: noteForm.status,
    is_recommended: noteForm.is_recommended === '1',
    content: noteForm.content,
    seo_description: noteForm.seo_description,
    seo_keywords: noteForm.seo_keywords
  }
  
  // 如果是编辑模式，添加时间字段
  if (isEditMode) {
    noteData.created_at = noteForm.created_at
    noteData.updated_at = noteForm.updated_at
  }
  
  loading.value = true
  try {
    let response
    
    if (isEditMode) {
      response = await updateNote(noteId, noteData)
    } else {
      response = await createNote(noteData)
    }
    
    if (response.code === 200) {
      ElMessage.success(isEditMode ? '笔记更新成功' : '笔记创建成功')
      // 跳转到笔记列表页
      router.push(`/admin/notes`)
    } else {
      ElMessage.error((response.message || '操作失败'))
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error('保存笔记失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  // 如果表单有内容，提示用户是否确认离开
  if (noteForm.title || noteForm.content || noteForm.category_id || tagList.value.length) {
    ElMessageBox.confirm(
      '确定要离开吗？未保存的更改将会丢失。',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push('/admin/notes')
    }).catch(() => {
      // 用户取消离开
    })
  } else {
    router.push('/admin/notes')
  }
}

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})

// 初始化页面数据
onMounted(() => {
  fetchCategories()
  if (isEditMode) {
    fetchNoteDetail()
  }
})
</script>

<style scoped>
.note-edit-page {
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
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

.auto-save-indicator {
  padding: 0.5rem 1rem;
  background-color: #f0f9eb;
  color: #52c41a;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.icon-loading {
  animation: spin 1s linear infinite;
}

.icon-success {
  color: #52c41a;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.note-form-container {
  padding: 1rem 0;
  width: 100%;
}

.form-hint {
  color: #909399;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.tags-display {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

/* 确保表单和表单项全宽显示 */
:deep(.el-form) {
  width: 100%;
}

:deep(.el-form-item) {
  width: 100%;
  margin-bottom: 1.25rem;
}

/* 确保编辑器所在的表单项全宽 */
:deep(.el-form-item__content) {
  width: calc(100% - 100px);
}

.upload-file-container {
  position: relative;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.preview-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.edit-mode-fields {
  border-top: 1px solid #e4e7ed;
  padding-top: 1rem;
  margin-top: 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .note-edit-page {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  :deep(.el-form-item__content) {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
}
</style>
