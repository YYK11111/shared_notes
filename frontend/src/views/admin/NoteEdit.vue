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
                    <el-progress :percentage="file.percentage" :stroke-width="2" />
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
                :toolbars="toolbars"
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
          
          <!-- 编辑模式下显示的额外字段 -->
          <div v-if="isEditMode" class="edit-mode-fields">
            <!-- 创建时间和更新时间已隐藏，由系统自动处理 -->
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 导入Vue相关函数
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Check, ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElProgress } from 'element-plus'
import { createNote, updateNote, getNoteDetail } from '@/api/note'
import { uploadNoteImage, deleteFile, getFileDataUrl } from '@/api/file'
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
const noteFormRef = ref()
const tagList = ref([])
const imageFileList = ref([])

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
  is_top: 0,
  top_expire_time: null,
  is_home_recommend: 0,
  is_week_selection: 0,
  is_month_recommend: 0,
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

// 处理封面图片 - 重写的函数
const handleCoverImage = async (coverImageId) => {
  // 清空当前图片列表
  imageFileList.value = [];
  
  // 如果没有封面图片ID，直接返回
  if (!coverImageId) {
    return;
  }
  
  try {
    // 调用getFileDataUrl获取文件Data URL
    const dataUrl = await getFileDataUrl(coverImageId);
    
    // 创建图片文件对象
    imageFileList.value = [{
      url: dataUrl,
      status: 'success',
      uid: Date.now(),
      name: `cover_${coverImageId}`,
      raw: null
    }];
    
    // 显示成功提示
    ElMessage.success('封面图片加载成功');
  } catch (error) {
    // 显示错误提示
    ElMessage.error('加载封面图片失败：' + error.message);
    imageFileList.value = [];
  }
}

// 获取笔记详情（编辑模式）
const fetchNoteDetail = async (retryCount = 0) => {
  
  if (!isEditMode) {
    return;
  }
  
  loading.value = true;
  try {
    // 1. 先获取笔记详情
    const response = await getNoteDetail(noteId);
    
    const note = response.data;
    
    // 从API返回的categories数组中提取category_ids
    let categoryIds = [];
    if (note.categories && Array.isArray(note.categories)) {
      categoryIds = note.categories.map(cat => cat.id);
    }
    
    // 修复分类信息不显示问题，并确保置顶、推荐等字段值被正确设置
    Object.assign(noteForm, {
      title: note.title,
      category_id: categoryIds.length > 0 ? categoryIds[0] : '',
      cover_image: note.cover_image || '',
      status: note.status,
      is_recommended: note.is_recommended ? '1' : '0',
      is_top: note.is_top || 0,
      top_expire_time: note.top_expire_time ? dayjs(note.top_expire_time).toDate() : null,
      is_home_recommend: note.is_home_recommend || 0,
      is_week_selection: note.is_week_selection || 0,
      is_month_recommend: note.is_month_recommend || 0,
      content: note.content,
      seo_description: note.seo_description || '',
      seo_keywords: note.seo_keywords || '',
      created_at: dayjs(note.created_at).toDate(),
      updated_at: dayjs(note.updated_at).toDate()
    });
    
    // 设置级联选择器的值
    if (categoryIds.length > 0) {
      // 查找并设置级联路径（使用第一个分类ID）
      const categoryPath = findCategoryPath(categoryIds[0], categoriesTree.value);
      if (categoryPath && categoryPath.length > 0) {
        cascaderValue.value = categoryPath;
      }
    }
    
    // 处理标签
    if (note.tags && Array.isArray(note.tags)) {
      tagList.value = [...note.tags];
    }
    
    // 2. 再处理封面图片（调用统一文件处理接口）
    await handleCoverImage(note.cover_image);
    

    
  } catch (error) {
    
    // 尝试重试逻辑
    if (retryCount < 1 && error.response?.status === 500) {
      ElMessage.warning('获取笔记详情失败，正在尝试重试...');
      // 延迟1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      fetchNoteDetail(retryCount + 1);
      return;
    }
    
    // 显示错误信息并提供重试和返回选项
    ElMessageBox.alert(
      '获取笔记详情失败：' + (error.response?.data?.msg || error.message || '未知错误'),
      '错误',
      {
        confirmButtonText: '重试',
        showCancelButton: true,
        cancelButtonText: '返回列表',
        type: 'error'
      }
    ).then(() => {
      fetchNoteDetail();
    }).catch(() => {
      router.push('/admin/notes');
    });
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
    // 调用上传图片接口，监听进度
    const response = await uploadNoteImage(file, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress && onProgress({ percent });
      }
    });
    
    if (response.code === 200 && response.data?.fileId) {
      // 只保存fileId，不保存完整URL
      noteForm.cover_image = response.data.fileId;
      // 使用getFileDataUrl获取预览
      const dataUrl = await getFileDataUrl(response.data.fileId);
      // 更新imageFileList，使用dataUrl进行预览
      imageFileList.value = [{
        url: dataUrl,
        status: 'success',
        uid: Date.now(),
        name: file.name
      }];
      onSuccess(response);
      ElMessage.success('封面上传成功');
    } else {
      throw new Error(response.message || '封面上传失败');
    }
  } catch (error) {
    onError(error);
    ElMessage.error('封面上传失败：' + (error.message || '未知错误'));
    console.error('封面上传失败:', error);
  }
}

// 处理图片超出数量
const handleExceed = () => {
  ElMessage.warning('最多只能上传1张封面图片');
}

// 检查并上传图片（在保存前自动调用）
const checkAndUploadImage = async () => {
  // 检查是否有选择图片但尚未上传（判断是否有raw文件对象且cover_image为空）
  if (imageFileList.value.length > 0 && 
      imageFileList.value[0].raw && 
      (!noteForm.cover_image || !noteForm.cover_image.trim())) {
    
    // 获取选中的文件
    const file = imageFileList.value[0].raw;
    if (!file) {
      throw new Error('未找到有效的图片文件');
    }
    
    // 执行上传并等待完成
    await new Promise((resolve, reject) => {
      handleImageUpload({
        file,
        onSuccess: (response) => {
          resolve(response);
        },
        onError: (error) => {
          reject(error);
        },
        onProgress: (event) => {
          // 更新进度信息
          if (imageFileList.value[0]) {
            imageFileList.value[0].percentage = event.percent;
            imageFileList.value[0].status = 'uploading';
          }
        }
      });
    });
  }
}

// 移除图片
const handleRemoveImage = async () => {
  // 如果有已上传到服务器的图片（存在fileId），调用接口删除
  if (noteForm.cover_image && noteForm.cover_image.trim()) {
    try {
      // 显示加载状态
      imageUploadLoading.value = true;
      
      // 调用删除文件接口
      await deleteFile(noteForm.cover_image);
      
      // 清空图片信息
      imageFileList.value = [];
      noteForm.cover_image = '';
      
      ElMessage.success('图片删除成功');
    } catch (error) {
      ElMessage.error('删除图片失败：' + (error.message || '未知错误'));
      console.error('删除图片失败:', error);
      // 即使删除失败，也清空本地图片信息，避免状态不一致
      imageFileList.value = [];
      noteForm.cover_image = '';
    } finally {
      imageUploadLoading.value = false;
    }
  } else {
    // 如果是本地未上传的图片，直接清空
    imageFileList.value = [];
    noteForm.cover_image = '';
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
  
  // 在保存之前，先检查并上传图片
  try {
    loading.value = true;
    await checkAndUploadImage();
  } catch (error) {
    loading.value = false;
    ElMessage.error('图片上传失败：' + (error.message || '未知错误'));
    return;
  }
  
  // 准备保存的数据 - 使用普通对象而不是FormData
  // 包含置顶、推荐等字段以确保它们不会被清除，但不允许前端修改
    const formData = {
      title: noteForm.title,
      content: noteForm.content,
      status: noteForm.status,
      tags: JSON.stringify(tagList.value),
      categoryIds: noteForm.category_id ? [noteForm.category_id] : [], // 转换为数组格式
      isTop: noteForm.is_top,
      isHomeRecommend: noteForm.is_home_recommend,
      isWeekSelection: noteForm.is_week_selection,
      isMonthRecommend: noteForm.is_month_recommend,
      seo_description: noteForm.seo_description,
      seo_keywords: noteForm.seo_keywords
    };
  
  // 特殊处理top_expire_time - 只在有值时添加
  if (noteForm.top_expire_time && noteForm.top_expire_time !== null) {
    formData.topExpireTime = noteForm.top_expire_time;
  }
  
  // 处理封面图片
  if (noteForm.cover_image && noteForm.cover_image.trim()) {
    // 只要cover_image存在且不为空，就直接添加到formData中
    formData.cover_image = noteForm.cover_image;
  }
  
  loading.value = true;
  try {
    let response;
    
    if (isEditMode) {
      // 更新时间由后端处理，不需要前端设置
      response = await updateNote(noteId, formData);
    } else {
      response = await createNote(formData);
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
  
  try {
    // 先获取分类数据，确保categoriesTree已经加载完成
    await fetchCategories();
    
    // 然后再获取笔记详情
    if (isEditMode) {
      // 使用await确保fetchNoteDetail执行完成
      await fetchNoteDetail();
    }
    

    
  } catch (error) {
    ElMessage.error('页面加载失败，请刷新页面重试');
  }
});
</script>

<style scoped>
.note-edit-page {
  padding: 1.5rem;
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

.upload-button {
  margin-top: 0.5rem;
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
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

/* 确保删除按钮在鼠标悬浮时显示 */
.upload-file-container:hover .el-upload__file-action {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-upload__file-action {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: none;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-file-container:hover .preview-image {
  opacity: 0.7;
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
