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
      
      <!-- 笔记表单 -->
      <div class="note-form-container">
        <el-form :model="noteForm" ref="noteFormRef" label-width="100px" :disabled="loading">
          <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入笔记标题', trigger: 'blur' }]">
            <el-input v-model="noteForm.title" placeholder="请输入笔记标题" />
          </el-form-item>
          
          <el-form-item label="分类" prop="category_id" :rules="[{ required: true, message: '请选择笔记分类', trigger: 'change' }]">
            <el-cascader
              v-model="cascaderValue"
              :options="categoriesTree"
              :props="{ label: 'name', value: 'id', checkStrictly: true }"
              placeholder="请选择笔记分类"
              @change="handleCategoryChange"
              clearable
              filterable
            />
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
                ref="editor"
                v-model="noteForm.content"
                :toolbars="toolbars"
                :ishljs="true"
                @imgAdd="handleImgAdd"
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
import { Check, ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElProgress } from 'element-plus'
import { createNote, updateNote, getNoteDetail, uploadNoteImage } from '@/api/note'
import { getCategoryList } from '@/api/category'

// 路由信息
const router = useRouter()
const route = useRoute()
const noteId = route.params.id
const isEditMode = !!noteId

// 状态变量
const loading = ref(false)
const imageUploadLoading = ref(false)
const categories = ref([])
const categoriesTree = ref([]) // 树形结构的分类数据
const cascaderValue = ref(null) // 级联选择器的值
const imageFileList = ref([])
const noteFormRef = ref()
const tagList = ref([])
const editor = ref() // 添加editor引用

// mavon-editor 工具栏配置
const toolbars = {
  bold: true,
  italic: true,
  header: true,
  underline: true,
  strikethrough: true,
  mark: true,
  // 修复语法错误
  subscript: true,
  quote: true,
  ol: true,
  ul: true,
  link: true,
  imagelink: true,
  code: true,
  table: true,
  fullscreen: true,
  readmodel: true,
  htmlcode: true,
  help: true,
  undo: true,
  redo: true,
  trash: true,
  save: false,
  navigation: true,
  alignleft: true,
  aligncenter: true,
  alignright: true,
  subfield: true,
  preview: true
}

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

// 编译Markdown (使用mavon-editor的内置功能，此处简化实现)
const compiledMarkdown = computed(() => {
  if (!noteForm.content) return ''
  // mavon-editor内部会处理Markdown解析，这里简化实现
  return noteForm.content
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategoryList()
    categories.value = response.data?.list || []
    categoriesTree.value = formatCategoriesToTree(categories.value)
  } catch (error) {
    ElMessage.error('获取分类列表失败：' + (error.message || '未知错误'))
    console.error('获取分类列表失败:', error)
  }
}

// 将分类数据转换为树形结构
const formatCategoriesToTree = (categories) => {
  const map = {};
  const tree = [];
  
  // 创建ID到节点的映射
  categories.forEach(category => {
    map[category.id] = {
      ...category,
      children: category.children || []
    };
  });
  
  // 构建树形结构
  categories.forEach(category => {
    if (category.parent_id === 0 || !map[category.parent_id]) {
      // 顶级分类直接添加到树
      tree.push(map[category.id]);
    } else {
      // 子分类添加到父分类的children数组
      if (!map[category.parent_id].children) {
        map[category.parent_id].children = [];
      }
      map[category.parent_id].children.push(map[category.id]);
    }
  });
  
  return tree;
}

// 处理分类选择变化
const handleCategoryChange = (value) => {
  if (value && value.length > 0) {
    // 总是使用最后一个值作为选择的分类ID
    noteForm.category_id = value[value.length - 1];
  } else {
    noteForm.category_id = '';
  }
}

// 获取笔记详情（编辑模式）
const fetchNoteDetail = async () => {
  if (!isEditMode) return;
  
  loading.value = true;
  try {
    const response = await getNoteDetail(noteId);
    const note = response.data;
    
    // 修复分类信息不显示问题 - 使用API返回的category_ids数组
    Object.assign(noteForm, {
      title: note.title,
      category_id: note.category_ids && note.category_ids.length > 0 ? note.category_ids[0] : '',
      cover_image: note.cover_image || '',
      status: note.status,
      is_recommended: note.is_recommended ? '1' : '0',
      content: note.content,
      seo_description: note.seo_description || '',
      seo_keywords: note.seo_keywords || '',
      created_at: dayjs(note.created_at).toDate(),
      updated_at: dayjs(note.updated_at).toDate()
    });
    
    // 设置级联选择器的值
    if (note.category_ids && note.category_ids.length > 0) {
      // 查找并设置级联路径（使用第一个分类ID）
      const categoryPath = findCategoryPath(note.category_ids[0], categoriesTree.value);
      if (categoryPath && categoryPath.length > 0) {
        cascaderValue.value = categoryPath;
      }
    }
    
    // 处理标签
    if (note.tags && Array.isArray(note.tags)) {
      tagList.value = [...note.tags];
    }
    
    // 处理封面图片
    if (note.cover_image) {
      imageFileList.value = [{ url: note.cover_image, status: 'success' }];
    }
  } catch (error) {
    ElMessage.error('获取笔记详情失败：' + (error.message || '未知错误'));
    console.error('获取笔记详情失败:', error);
    // 如果获取失败，返回笔记列表页
    router.push('/admin/notes');
  } finally {
    loading.value = false;
  }
}

// 添加标签
const addTag = () => {
  if (!noteForm.tags.trim()) return;
  
  const newTag = noteForm.tags.trim();
  
  // 验证标签
  if (tagList.value.length >= 5) {
    ElMessage.warning('最多添加5个标签');
    return;
  }
  
  if (newTag.length > 10) {
    ElMessage.warning('每个标签不超过10个字符');
    return;
  }
  
  if (tagList.value.includes(newTag)) {
    ElMessage.warning('该标签已存在');
    noteForm.tags = '';
    return;
  }
  
  // 添加标签
  tagList.value.push(newTag);
  noteForm.tags = '';
}

// 移除标签
const removeTag = (index) => {
  tagList.value.splice(index, 1);
}

// 查找分类路径
const findCategoryPath = (categoryId, tree) => {
  if (!tree || tree.length === 0) return null;
  
  for (const node of tree) {
    if (node.id === categoryId) {
      return [node.id];
    }
    if (node.children && node.children.length > 0) {
      const path = findCategoryPath(categoryId, node.children);
      if (path) {
        return [node.id, ...path];
      }
    }
  }
  return null;
}

// 验证标签格式
const validateTags = () => {
  if (tagList.value.length > 5) {
    ElMessage.warning('最多添加5个标签');
    return false;
  }
  
  for (const tag of tagList.value) {
    if (tag.length > 10) {
      ElMessage.warning('每个标签不超过10个字符');
      return false;
    }
  }
  
  return true;
}

// 验证SEO关键词
const validateKeywords = () => {
  if (!noteForm.seo_keywords) return true;
  const keys = noteForm.seo_keywords.split(',').map(k => k.trim()).filter(k => k);
  if (keys.length > 5) {
    ElMessage.warning('最多添加5个SEO关键词');
    return false;
  }
  return true;
}

// 处理图片上传前校验
const handleBeforeUpload = (file) => {
  const isLessThan2MB = file.size / 1024 / 1024 < 2;
  
  if (!isLessThan2MB) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  
  // 读取图片获取宽高比
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      // 检查宽高比是否在4:3的合理范围内 (1.333)
      if (aspectRatio < 1.2 || aspectRatio > 1.5) {
        ElMessage.warning('建议上传宽高比为4:3的图片');
      }
    };
  };
  
  return true;
}

// 处理图片上传
const handleImageUpload = async (options) => {
  const { file, onSuccess, onError, onProgress } = options;
  
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', file);
    
    // 调用上传图片接口，监听进度
    const response = await uploadNoteImage(formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress && onProgress({ percent });
      }
    });
    
    if (response.code === 200 && response.data?.url) {
      noteForm.cover_image = response.data.url;
      onSuccess(response);
      ElMessage.success('图片上传成功');
    } else {
      throw new Error(response.message || '图片上传失败');
    }
  } catch (error) {
    onError(error);
    ElMessage.error('图片上传失败：' + (error.message || '未知错误'));
    console.error('图片上传失败:', error);
  }
}

// 处理图片超出数量
const handleExceed = () => {
  ElMessage.warning('最多只能上传1张封面图片');
}

// 移除图片
const handleRemoveImage = () => {
  imageFileList.value = [];
  noteForm.cover_image = '';
}

// 处理Markdown编辑器中的图片添加
const handleImgAdd = async (pos, file) => {
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', file);
    
    // 调用上传图片接口
    const response = await uploadNoteImage(formData);
    
    if (response.code === 200 && response.data?.url) {
      const url = response.data.url;
      
      // v3.0.2版本直接使用editor的方式插入图片
      const markdown = noteForm.content;
      noteForm.content = markdown.substring(0, pos) + `![图片](${url})` + markdown.substring(pos);
      ElMessage.success('图片插入成功');
    } else {
      throw new Error(response.message || '图片上传失败');
    }
  } catch (error) {
    ElMessage.error('图片上传失败：' + (error.message || '未知错误'));
    console.error('编辑器图片上传失败:', error);
  }
}

// 保存笔记
const handleSaveNote = async () => {
  // 验证表单
  const isValid = await noteFormRef.value.validate().catch(() => false);
  if (!isValid) {
    ElMessage.warning('请检查表单输入');
    return;
  }
  
  // 验证标签格式
  if (!validateTags()) {
    return;
  }
  
  // 验证SEO关键词
  if (!validateKeywords()) {
    return;
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
  };
  
  // 如果是编辑模式，添加时间字段
  if (isEditMode) {
    noteData.created_at = noteForm.created_at;
    noteData.updated_at = noteForm.updated_at;
  }
  
  loading.value = true;
  try {
    let response;
    
    if (isEditMode) {
      response = await updateNote(noteId, noteData);
    } else {
      response = await createNote(noteData);
    }
    
    if (response.code === 200) {
      ElMessage.success(isEditMode ? '笔记更新成功' : '笔记创建成功');
      // 跳转到笔记列表页
      router.push(`/admin/notes`);
    } else {
      ElMessage.error((response.message || '操作失败'));
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'));
    console.error('保存笔记失败:', error);
  } finally {
    loading.value = false;
  }
}

// 取消操作
const handleCancel = () => {
  // 检查是否有未保存的内容
  if (hasUnsavedChanges()) {
    ElMessageBox.confirm('有未保存的内容，确定要离开吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/admin/notes');
    }).catch(() => {
      // 用户取消
    });
  } else {
    router.push('/admin/notes');
  }
}

// 检查是否有未保存的内容
const hasUnsavedChanges = () => {
  return noteForm.title || 
         noteForm.content || 
         noteForm.category_id || 
         tagList.value.length > 0 || 
         imageFileList.value.length > 0;
}

// 组件卸载前
onBeforeUnmount(() => {
  // 不需要清除定时器，因为已经移除了自动保存功能
})

// 初始化页面数据
onMounted(async () => {
  // 先获取分类数据，确保categoriesTree已经加载完成
  await fetchCategories();
  
  // 然后再获取笔记详情
  if (isEditMode) {
    fetchNoteDetail();
  }
})
</script>

<style scoped>
.note-edit-page {
  padding: 1.5rem;
  background-color: #f5f7fa;
  min-height: 100vh;
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
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.note-form-container {
  background-color: #ffffff;
  border-radius: 0.25rem;
}

.tags-display {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #909399;
}

.editor-container {
  border: 1px solid #ebeef5;
  border-radius: 0.25rem;
  overflow: hidden;
  width: 100%;
}

.upload-file-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.edit-mode-fields {
  border-top: 1px solid #ebeef5;
  padding-top: 1rem;
  margin-top: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .note-edit-page {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
}
</style>
