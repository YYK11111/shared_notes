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
            <el-button type="primary" @click="handleSaveNote">
              <el-icon><Check /></el-icon>
              {{ isEditMode ? '更新笔记' : '创建笔记' }}
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 笔记表单 -->
      <div class="note-form-container">
        <el-form :model="noteForm" ref="noteFormRef" label-width="100px">
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
            <el-input v-model="noteForm.tags" placeholder="请输入标签，用逗号分隔" />
            <div class="form-hint">最多添加5个标签，每个标签不超过10个字符</div>
          </el-form-item>
          
          <el-form-item label="封面图片">
            <el-upload
              v-model:file-list="imageFileList"
              class="upload-demo"
              action=""
              :before-upload="handleBeforeUpload"
              :on-success="handleImageUploadSuccess"
              :auto-upload="false"
              :show-file-list="true"
              list-type="picture-card"
              :limit="1"
              :on-exceed="handleExceed"
            >
              <el-icon><Plus /></el-icon>
              <template #file="{ file }">
                <img :src="file.url" alt="封面图片" class="preview-image" />
                <div class="el-upload__file-action">
                  <el-icon @click="handleRemoveImage"><Delete /></el-icon>
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
              <div class="editor-tabs">
                <el-button
                  type="text"
                  :class="{ active: editorMode === 'markdown' }"
                  @click="editorMode = 'markdown'"
                >
                  Markdown
                </el-button>
                <el-button
                  type="text"
                  :class="{ active: editorMode === 'preview' }"
                  @click="editorMode = 'preview'"
                >
                  预览
                </el-button>
              </div>
              
              <!-- Markdown编辑器 -->
              <div v-if="editorMode === 'markdown'" class="markdown-editor-wrapper">
                <textarea
                  v-model="noteForm.content"
                  placeholder="请输入笔记内容，支持Markdown格式"
                  class="markdown-editor"
                  rows="15"
                ></textarea>
              </div>
              
              <!-- 预览区域 -->
              <div v-else-if="editorMode === 'preview'" class="preview-wrapper">
                <div class="markdown-preview" v-html="compiledMarkdown"></div>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="SEO描述">
            <el-input v-model="noteForm.seo_description" type="textarea" placeholder="请输入SEO描述" :rows="2" />
            <div class="form-hint">不超过160个字符，用于搜索引擎展示</div>
          </el-form-item>
          
          <el-form-item label="SEO关键词">
            <el-input v-model="noteForm.seo_keywords" placeholder="请输入SEO关键词，用逗号分隔" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Check, ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { createNote, updateNote, getNoteById, getCategoryList } from '@/api/note'
import { uploadImage } from '@/api/upload'
import { marked } from 'marked'

const router = useRouter()
const route = useRoute()
const noteId = route.params.id
const isEditMode = !!noteId

// 状态变量
const loading = ref(false)
const editorMode = ref('markdown')
const categories = ref([])
const imageFileList = ref([])
const noteFormRef = ref()

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
    const response = await getNoteById(noteId)
    const note = response.data
    
    // 填充表单数据
    Object.assign(noteForm, {
      title: note.title,
      category_id: note.category_id,
      tags: note.tags?.join(', ') || '',
      cover_image: note.cover_image || '',
      status: note.status,
      is_recommended: note.is_recommended ? '1' : '0',
      content: note.content,
      seo_description: note.seo_description || '',
      seo_keywords: note.seo_keywords || '',
      created_at: dayjs(note.created_at).toDate(),
      updated_at: dayjs(note.updated_at).toDate()
    })
    
    // 处理封面图片
    if (note.cover_image) {
      imageFileList.value = [{ url: note.cover_image }]
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

// 验证标签格式
const validateTags = () => {
  if (!noteForm.tags) return true
  
  const tags = noteForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
  
  if (tags.length > 5) {
    ElMessage.warning('最多添加5个标签')
    return false
  }
  
  for (const tag of tags) {
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
      // 检查宽高比是否在4:3的合理范围内
      if (aspectRatio < 1.2 || aspectRatio > 1.5) {
        ElMessage.warning('建议上传宽高比为4:3的图片')
      }
    }
  }
  
  return true
}

// 处理图片上传成功
const handleImageUploadSuccess = (response) => {
  if (response.code === 200 && response.data?.url) {
    noteForm.cover_image = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败：' + (response.message || '未知错误'))
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
    tags: noteForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
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
      // 跳转到笔记详情页或笔记列表页
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
  if (noteForm.title || noteForm.content || noteForm.category_id) {
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
  max-width: 1200px;
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

.note-form-container {
  padding: 1rem 0;
}

.form-hint {
  color: #909399;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.editor-tabs .el-button {
  flex: 1;
  text-align: center;
  border-radius: 0;
}

.editor-tabs .el-button.active {
  color: #409eff;
  background-color: #fff;
  border-bottom: 2px solid #409eff;
}

.markdown-editor-wrapper, .preview-wrapper {
  padding: 1rem;
  background-color: #fff;
}

.markdown-editor {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  resize: vertical;
}

.markdown-editor:focus {
  outline: none;
  border-color: #409eff;
}

.markdown-preview {
  min-height: 300px;
  padding: 0.75rem;
  background-color: #fafafa;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.6;
}

.markdown-preview h1, .markdown-preview h2, .markdown-preview h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.markdown-preview h1 {
  font-size: 1.5rem;
}

.markdown-preview h2 {
  font-size: 1.25rem;
}

.markdown-preview h3 {
  font-size: 1.125rem;
}

.markdown-preview p {
  margin-bottom: 1rem;
}

.markdown-preview pre {
  background-color: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-preview code {
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
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
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
}
</style>