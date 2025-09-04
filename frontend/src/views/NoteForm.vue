<template>
  <div class="note-form-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>{{ isEditMode ? '编辑笔记' : (isDetailMode ? '笔记详情' : '创建笔记') }}</h1>
      <p class="page-description">
        {{ isEditMode ? '修改笔记的内容和设置' : (isDetailMode ? '查看笔记的详细内容' : '创建一篇新的笔记') }}
      </p>
    </div>
    
    <!-- 表单卡片 -->
    <el-card class="form-card">
      <el-form
        ref="noteFormRef"
        :model="noteForm"
        :rules="formRules"
        :disabled="isReadOnly"
        label-width="100px"
        class="note-form"
      >
        <!-- 基本信息 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="noteForm.title"
            placeholder="请输入笔记标题"
            clearable
            maxlength="100"
            show-word-limit
            :disabled="isReadOnly"
          />
        </el-form-item>
        
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
            v-model="noteForm.categoryId"
            :data="categories"
            :props="{
              label: 'name',
              value: 'id',
              children: 'children'
            }"
            :filter-method="filterCategoryNode"
            placeholder="请选择分类"
            clearable
            filterable
            :disabled="isReadOnly"
            style="width: 100%;"
          />
        </el-form-item>
        
        <!-- 内容编辑器 -->
        <el-form-item label="内容" prop="content">
          <div v-if="isDetailMode" class="detail-content-container">
            <div class="detail-content" v-if="noteForm.content && typeof noteForm.content === 'string'">
              <div v-html="renderMarkdownContent(noteForm.content)"></div>
            </div>
            <div v-else-if="noteForm.content && typeof noteForm.content === 'object' && noteForm.content !== null && 'ops' in noteForm.content" class="detail-content">
              <div v-html="renderDeltaContent(noteForm.content)"></div>
            </div>
            <div v-else class="no-content">
              暂无内容
            </div>
          </div>
          <div v-else class="editor-container">
            <mavon-editor
              ref="mavonEditorRef"
              v-model:value="noteForm.content"
              :toolbars="mavonEditorOptions.toolbars"
              :subfield="mavonEditorOptions.subfield"
              :default-open="mavonEditorOptions.defaultOpen"
              :toolbars-flag="mavonEditorOptions.toolbars_flag"
              :editable="mavonEditorOptions.editable"
              :scroll_style="true"
              :box_shadow="false"
              :height="'600px'"
              :min-height="'600px'"
              @imgAdd="handleImageUpload"
              @change="handleContentChange"
            />
          </div>
          <div v-if="!isReadOnly" class="form-tip">支持Markdown语法，可使用快捷键如 #标题、**粗体**、*斜体* 等</div>
        </el-form-item>
        
        <!-- 封面图 -->
        <el-form-item label="封面图" prop="coverImage">
          <div v-if="isReadOnly">
            <img
              v-if="noteForm.coverImage"
              :src="noteForm.coverImage"
              alt="封面图"
              class="detail-cover-image"
            />
          </div>
          <el-upload
            v-else
            v-model:file-list="coverImageList"
            class="upload-demo"
            action=""
            :before-upload="handleBeforeUpload"
            :on-remove="handleRemove"
            :show-file-list="true"
            :auto-upload="false"
            list-type="picture-card"
          >
            <template #default>
              <div v-if="!noteForm.coverImage">
                <el-icon><Plus /></el-icon>
              </div>
              <img
                v-else
                :src="noteForm.coverImage"
                alt="封面图"
                class="cover-image-preview"
              />
            </template>
          </el-upload>
          <div v-if="!isReadOnly" class="form-tip">建议上传尺寸为1200x630的图片，支持JPG、PNG格式</div>
        </el-form-item>
        
        <!-- 摘要 -->
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="noteForm.summary"
            type="textarea"
            placeholder="请输入笔记摘要（选填）"
            :rows="3"
            maxlength="200"
            show-word-limit
            :disabled="isReadOnly"
          />
          <div v-if="!isReadOnly" class="form-tip">摘要是笔记的简短描述，会显示在笔记列表页面</div>
        </el-form-item>
        
        <!-- 标签 -->
        <el-form-item label="标签" prop="tags">
          <el-input
            v-model="noteForm.tags"
            placeholder="请输入标签，用逗号分隔"
            clearable
            :disabled="isReadOnly"
          />
          <div v-if="!isReadOnly" class="form-tip">最多添加10个标签，每个标签不超过10个字符</div>
        </el-form-item>
        
        <!-- 状态设置 -->
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="noteForm.status" :disabled="isReadOnly">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="1">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="置顶" prop="isTop">
          <el-switch
            v-model="noteForm.isTop"
            :active-value="1"
            :inactive-value="0"
            :disabled="isReadOnly"
          />
          <span class="switch-label">{{ noteForm.isTop === 1 ? '是' : '否' }}</span>
        </el-form-item>
        
        <!-- SEO设置 -->
        <el-form-item label="SEO设置" prop="">
          <el-collapse v-model="activeCollapse" :disabled="isReadOnly">
            <el-collapse-item title="SEO设置" name="1">
              <el-form-item label="SEO标题" prop="seoTitle">
                <el-input
                  v-model="noteForm.seoTitle"
                  placeholder="请输入SEO标题（选填，不超过60个字符）"
                  clearable
                  maxlength="60"
                  show-word-limit
                  :disabled="isReadOnly"
                />
                <div v-if="!isReadOnly" class="form-tip">SEO标题将显示在搜索引擎结果中</div>
              </el-form-item>
              
              <el-form-item label="SEO关键词" prop="seoKeywords">
                <el-input
                  v-model="noteForm.seoKeywords"
                  placeholder="请输入SEO关键词（选填，用逗号分隔）"
                  clearable
                  :disabled="isReadOnly"
                />
                <div v-if="!isReadOnly" class="form-tip">SEO关键词有助于提高搜索引擎排名</div>
              </el-form-item>
              
              <el-form-item label="SEO描述" prop="seoDescription">
                <el-input
                  v-model="noteForm.seoDescription"
                  type="textarea"
                  placeholder="请输入SEO描述（选填，不超过160个字符）"
                  :rows="3"
                  maxlength="160"
                  show-word-limit
                  :disabled="isReadOnly"
                />
                <div v-if="!isReadOnly" class="form-tip">SEO描述会显示在搜索引擎结果中</div>
              </el-form-item>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">
              <el-icon><ArrowLeft /></el-icon>
              <span>返回</span>
            </el-button>
            
            <template v-if="!isReadOnly">
              <el-button
                @click="handleSaveDraft"
                :loading="submitting"
              >
                <el-icon><Document /></el-icon>
                <span>保存草稿</span>
              </el-button>
              <el-button
                type="primary"
                @click="handleSubmit"
                :loading="submitting"
              >
                <el-icon v-if="!isEditMode"><Check /></el-icon>
                <el-icon v-else><Edit /></el-icon>
                <span>{{ isEditMode ? '保存修改' : '发布笔记' }}</span>
              </el-button>
            </template>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue';

// 检查是否存在hljs（代码高亮库）
const hljs = window.hljs || null;
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { mavonEditor } from 'mavon-editor';
import 'mavon-editor/dist/css/index.css';
import { Plus, ArrowLeft, Document, Check, Edit } from '@element-plus/icons-vue';
import api from '../utils/api';
import auth from '../utils/auth';

// 路由实例
const router = useRouter();
const route = useRoute();

// 表单引用
const noteFormRef = ref(null);

// 提交状态
const submitting = ref(false);

// 展开的折叠面板
const activeCollapse = ref(['1']);

// 封面图列表
const coverImageList = ref([]);

// 判断是否为编辑模式 - 增强版
const isEditMode = computed(() => {
  // 更精确的判断，确保路径完全匹配编辑模式
  return route.name === 'NoteEdit' || (route.path.includes('/edit') && route.params.id);
});

// 判断是否为详情模式
const isDetailMode = computed(() => {
  return !isEditMode.value && route.params.id;
});

// 当前编辑的笔记ID
const noteId = computed(() => route.params.id);

// 是否为只读模式（详情页）
const isReadOnly = computed(() => isDetailMode.value);

// 表单数据
const noteForm = reactive({
  title: '',
  categoryId: '',
  content: '',
  coverImage: '',
  summary: '',
  tags: '',
  status: 0,
  isTop: 0,
  seoTitle: '',
  seoKeywords: '',
  seoDescription: ''
});

// mavon-editor组件引用
const mavonEditorRef = ref(null);

// 分类列表
const categories = ref([]);

// mavon-editor配置选项
const mavonOptions = reactive({
  toolbars: {
    bold: true,
    italic: true,
    header: true,
    underline: true,
    strikethrough: true,
    mark: true,
    subscript: true,
    quote: true,
    ol: true,
    ul: true,
    link: true,
    imagelink: true,
    code: true,
    codeBlock: true,
    table: true,
    fullscreen: true,
    readmodel: true,
    htmlcode: true,
    help: true,
    undo: true,
    redo: true,
    save: false,
    navigation: false,
    alignleft: true,
    aligncenter: true,
    alignright: true,
    subfield: true,
    preview: true
  }
});

// 动态mavon-editor选项，根据模式切换
const mavonEditorOptions = computed(() => {
  return {
    ...mavonOptions,
    // 编辑和新建模式都使用双栏，只有详情模式使用单栏
    subfield: !isDetailMode.value,
    // 编辑和新建模式默认同时打开编辑区和预览区，详情模式默认预览
    defaultOpen: isDetailMode.value ? 'preview' : 'both',
    // 确保编辑模式下预览区域可见
    preview: !isDetailMode.value,
    // 详情模式下不可编辑
    editable: !isDetailMode.value,
    // 详情模式下隐藏工具栏
    toolbars_flag: !isDetailMode.value,
    // 确保详情模式下完全禁用编辑器
    placeholder: isDetailMode.value ? '' : '请输入笔记内容',
    // 强制在非详情模式下显示预览区域
    ishljs: true
  };
});

// 处理图片上传
const handleImageUpload = async (pos, $file, isModify) => {
  try {
    const formData = new FormData();
    formData.append('file', $file);
    
    const res = await api.note.uploadImage(formData);
    if (res.code === 200 && res.data.url) {
      return Promise.resolve(res.data.url);
    } else {
      const errorMessage = res.message || '图片上传失败，请检查格式或大小';
      ElMessage.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    const errorMessage = error.message || '图片上传失败，请检查网络连接';
    ElMessage.error(errorMessage);
    return Promise.reject(error);
  }
};

// 树形选择器自定义过滤方法
const filterCategoryNode = (value, data) => {
  if (!data) return false;
  
  if (data.name && data.name.toLowerCase().includes(value.toLowerCase())) {
    return true;
  }
  
  if (data.children && data.children.length > 0) {
    return data.children.some(child => filterCategoryNode(value, child));
  }
  
  return false;
};

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入笔记标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2-100个字符之间', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入笔记内容', trigger: 'blur' },
    { min: 10, message: '内容至少包含10个字符', trigger: 'blur' }
  ],
  tags: [
    {
      validator: (rule, value, callback) => {
        if (!value) return callback();
        const tags = value.split(',').filter(tag => tag.trim());
        if (tags.length > 10) {
          callback(new Error('最多添加10个标签'));
        } else {
          const invalidTag = tags.find(tag => tag.length > 10);
          if (invalidTag) {
            callback(new Error('每个标签不超过10个字符'));
          } else {
            callback();
          }
        }
      },
      trigger: 'blur'
    }
  ]
};

// 处理封面图上传前检查
const handleBeforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg';
  const isPNG = file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  
  if (!isJPG && !isPNG) {
    ElMessage.error('只支持JPG、PNG格式的图片');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB');
    return false;
  }
  
  uploadCoverImage(file);
  return false;
};

// 上传封面图
const uploadCoverImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.note.uploadCoverImage(formData);
    if (res.code === 200 && res.data.url) {
      noteForm.coverImage = res.data.url;
      coverImageList.value = [{ url: res.data.url }];
      ElMessage.success('封面图上传成功');
    } else {
      ElMessage.error('封面图上传失败');
    }
  } catch (error) {
    console.error('封面图上传失败:', error);
    ElMessage.error('封面图上传失败');
  }
};

// 处理封面图删除
const handleRemove = () => {
  noteForm.coverImage = '';
  coverImageList.value = [];
};

// 处理表单提交
const handleSubmit = async () => {
  try {
    await noteFormRef.value.validate();
    
    submitting.value = true;
    
    let contentText = noteForm.content;
    if (!contentText || contentText === '') {
      contentText = '';
    } else if (typeof contentText === 'object' && contentText !== null && 'ops' in contentText) {
      contentText = contentText.ops.map(op => op.insert || '').join('');
    } else if (typeof contentText !== 'string') {
      contentText = String(contentText);
    }
    
    const submitData = {
      title: noteForm.title,
      content: contentText,
      cover_image: noteForm.coverImage || null,
      status: noteForm.status !== undefined ? noteForm.status : 1,
      is_top: noteForm.isTop !== undefined ? noteForm.isTop : 0,
      top_expire_time: noteForm.topExpireTime || null,
      is_home_recommend: noteForm.isHomeRecommend || 0,
      is_week_selection: noteForm.isWeekSelection || 0,
      is_month_recommend: noteForm.isMonthRecommend || 0
    };
    
    if (!noteForm.summary) {
      const plainText = contentText.replace(/#|_|`|\*|!|\[|\]|\(|\)/g, '');
      noteForm.summary = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
    }
    
    if (noteForm.categoryId || noteForm.categoryId === 0) {
      submitData.category_ids = Array.isArray(noteForm.categoryId) 
        ? noteForm.categoryId 
        : [noteForm.categoryId];
    } else {
      submitData.category_ids = [];
    }
    
    if (!submitData.title || submitData.title.trim().length === 0) {
      throw new Error('标题不能为空');
    }
    
    if (!submitData.content || submitData.content.trim().length < 10) {
      throw new Error('笔记内容不能为空且至少包含10个字符');
    }
    
    let res;
    // 添加日志以便追踪API调用情况
    console.log('保存草稿 - 当前模式:', isEditMode.value ? '编辑模式' : '新建模式');
    console.log('当前笔记ID:', noteId.value);
    
    if (isEditMode.value && noteId.value) {
      console.log('调用更新API:', api.note.update);
      res = await api.note.update(noteId.value, submitData);
    } else {
      console.log('调用创建API:', api.note.create);
      res = await api.note.create(submitData);
    }
    
    if (res.code === 200 || res.code === 201) {
      const message = isEditMode.value 
        ? '笔记更新成功'
        : (submitData.status === 1 ? '笔记发布成功' : '笔记保存为草稿成功');
      
      ElMessage.success(message);
      
      // 更新最后保存的状态
      updateLastSavedState();
      
      setTimeout(() => {
        router.push('/notes');
      }, 1500);
    } else {
      ElMessage.error(res.message || (isEditMode.value ? '更新失败' : '保存失败'));
    }
  } catch (error) {
    console.error(isEditMode.value ? '更新笔记失败:' : '保存笔记失败:', error);
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(isEditMode.value ? '更新失败，请重试' : '保存失败，请重试');
    }
  } finally {
    submitting.value = false;
  }
};

// 保存草稿
const handleSaveDraft = async () => {
  try {
    if (!noteForm.title || noteForm.title.trim().length === 0) {
      ElMessage.warning('标题不能为空');
      return;
    }
    
    let contentText = noteForm.content;
    if (typeof contentText !== 'string') {
      contentText = String(contentText || '');
    } else {
      contentText = contentText.trim();
    }
    
    if (!contentText || contentText.length === 0) {
      ElMessage.warning('内容不能为空');
      return;
    }
    
    if (contentText.length < 10) {
      ElMessage.warning('笔记内容至少包含10个字符');
      return;
    }
    
    submitting.value = true;
    
    noteForm.status = 0;
    
    if (!noteForm.summary) {
      const plainText = contentText.replace(/#|_|`|\*|!|\[|\]|\(|\)/g, '');
      noteForm.summary = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
    }
    
    const submitData = {
      title: noteForm.title,
      content: contentText,
      cover_image: noteForm.coverImage || null,
      status: 0,
      is_top: noteForm.isTop || 0,
      top_expire_time: noteForm.topExpireTime || null,
      is_home_recommend: noteForm.isHomeRecommend || 0,
      is_week_selection: noteForm.isWeekSelection || 0,
      is_month_recommend: noteForm.isMonthRecommend || 0
    };
    
    if (noteForm.categoryId || noteForm.categoryId === 0) {
      submitData.category_ids = Array.isArray(noteForm.categoryId) 
        ? noteForm.categoryId 
        : [noteForm.categoryId];
    } else {
      submitData.category_ids = [];
    }
    
    let res;
    if (isEditMode.value) {
      res = await api.note.update(noteId.value, submitData);
    } else {
      res = await api.note.create(submitData);
    }
    
    if (res.code === 200 || res.code === 201) {
      ElMessage.success('草稿保存成功');
      
      // 更新最后保存的状态
      updateLastSavedState();
      
      if (!isEditMode.value && res.data && res.data.id) {
        router.push(`/notes/edit/${res.data.id}`);
      }
    } else {
      ElMessage.error(res.message || '保存草稿失败');
    }
  } catch (error) {
    console.error('保存草稿失败:', error);
    ElMessage.error('保存草稿失败，请重试');
  } finally {
    submitting.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  if (hasFormContentChanged()) {
    ElMessageBox.confirm(
      '表单内容尚未保存，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(() => {
        router.push('/notes');
      })
      .catch(() => {
        // 用户取消操作
      });
  } else {
    router.push('/notes');
  }
};

// 保存上一次保存的表单状态，用于比较是否需要自动保存
const lastSavedState = ref({
  title: '',
  categoryId: '',
  content: ''
});

// 检查表单内容是否有变化
const hasFormContentChanged = () => {
  // 比较关键字段是否有变化
  return noteForm.title.trim() !== lastSavedState.value.title.trim() ||
         noteForm.categoryId !== lastSavedState.value.categoryId ||
         String(noteForm.content || '').trim() !== lastSavedState.value.content.trim();
};

// 检查表单是否有内容
const hasFormContent = () => {
  return noteForm.title.trim().length > 0 ||
         String(noteForm.content || '').trim().length > 0;
};

// 更新最后保存的状态
const updateLastSavedState = () => {
  lastSavedState.value = {
    title: noteForm.title,
    categoryId: noteForm.categoryId,
    content: String(noteForm.content || '')
  };
};

// 获取笔记详情
const fetchNoteDetail = async () => {
  try {
    const res = await api.note.getDetail(noteId.value);
    if (res.code === 200 && res.data) {
      const noteData = {
        ...res.data,
        coverImage: res.data.cover_image || '',
        isTop: res.data.is_top || 0,
        isHomeRecommend: res.data.is_home_recommend || 0,
        isWeekSelection: res.data.is_week_selection || 0,
        isMonthRecommend: res.data.is_month_recommend || 0,
        categoryId: res.data.category_ids && res.data.category_ids.length > 0 ? res.data.category_ids[0] : ''
      };
      
      if (noteData.content === undefined || noteData.content === null) {
        noteData.content = '';
      } else if (typeof noteData.content !== 'string') {
        noteData.content = String(noteData.content);
      }
      
      Object.assign(noteForm, noteData);
      
      if (noteForm.coverImage) {
        coverImageList.value = [{ url: noteForm.coverImage }];
      }
      
      // 初始化最后保存状态
      updateLastSavedState();
      
      setTimeout(() => {
        if (mavonEditorRef.value) {
          mavonEditorRef.value.d_value = noteForm.content;
          mavonEditorRef.value.$forceUpdate();
        }
      }, 100);
    } else {
      ElMessage.error(res.message || '获取笔记信息失败');
      setTimeout(() => {
        router.push('/notes');
      }, 1500);
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    ElMessage.error('获取笔记信息失败');
    setTimeout(() => {
      router.push('/notes');
    }, 1500);
  }
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await api.category.getList({ pageSize: 100 });
    if (res.code === 200) {
      categories.value = res.data.list || [];
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

// 防抖保存计时器
let debounceTimer = null;

// 页面加载时初始化数据
onMounted(() => {
  fetchCategories();
  
  if (isEditMode.value || isDetailMode.value) {
    fetchNoteDetail();
  } else {
    // 新建笔记时初始化最后保存状态
    updateLastSavedState();
  }
  
  // 导航守卫
  const originalBeforeRouteLeave = router.beforeEach;
  
  router.beforeEach = (to, from, next) => {
    if ((from.path.includes('/notes/edit') || from.path.includes('/notes/detail')) && 
        from.path.includes(String(noteId.value)) && 
        to.path !== from.path && 
        hasFormContentChanged()) {
      next(false);
      
      ElMessageBox.confirm(
        '表单内容尚未保存，确定要离开吗？',
        '确认离开',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          next(to.path);
        })
        .catch(() => {});
    } else {
      next();
    }
  };
  
  onBeforeUnmount(() => {
    router.beforeEach = originalBeforeRouteLeave;
  });
});

// 监听特定字段变化，实现防抖自动保存
watch([
  () => noteForm.title,
  () => noteForm.categoryId,
  () => noteForm.content
], () => {
  if (isReadOnly.value) return;
  
  clearTimeout(debounceTimer);
  
  // 只有当内容有实际变化时才触发自动保存
  if (hasFormContentChanged()) {
    debounceTimer = setTimeout(() => {
      // 基本验证，防止保存空内容
      if (noteForm.title.trim() && String(noteForm.content || '').trim().length >= 10) {
        console.log('检测到标题、分类或内容变化，自动保存草稿...');
        handleSaveDraft();
      }
    }, 5000); // 5秒无操作后自动保存
  }
}, { deep: true });

// 组件卸载前清理定时器
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});

// 导入markdown-it
import MarkdownIt from 'markdown-it';

// 创建markdown-it实例
const md = new MarkdownIt({
  html: true,         // 允许HTML标签
  xhtmlOut: true,     // 使用更严格的XHTML格式输出
  breaks: true,       // 将\n转换为<br>
  linkify: true,      // 自动识别链接
  typographer: true,  // 启用一些替换和引号美化
  highlight: function (str, lang) {
    // 简单的代码高亮处理
    if (lang && hljs && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    
    return ''; // 不高亮
  }
});

// 渲染Markdown内容
const renderMarkdownContent = (content) => {
  if (!content || content.trim() === '') {
    return '<p>暂无内容</p>';
  }
  
  try {
    // 使用markdown-it渲染Markdown内容
    return md.render(content);
  } catch (error) {
    console.error('Markdown渲染失败:', error);
    return `<p>内容渲染失败: ${error.message}</p>`;
  }
};

// 渲染Delta格式内容
const renderDeltaContent = (delta) => {
  if (!delta || !delta.ops || !Array.isArray(delta.ops)) {
    return '<p>暂无内容</p>';
  }
  
  let html = '';
  delta.ops.forEach(op => {
    if (op.insert) {
      let text = op.insert;
      
      if (op.attributes) {
        let formattedText = text;
        
        if (op.attributes.bold) {
          formattedText = `<strong>${formattedText}</strong>`;
        }
        if (op.attributes.italic) {
          formattedText = `<em>${formattedText}</em>`;
        }
        if (op.attributes.underline) {
          formattedText = `<u>${formattedText}</u>`;
        }
        
        html += formattedText;
      } else {
        html += text;
      }
    }
  });
  
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

// 处理编辑器内容变化
const handleContentChange = (value, render) => {
  noteForm.content = value;
  
  try {
    if (typeof render === 'function') {
      render();
    }
  } catch (error) {
    console.error('渲染函数调用失败:', error);
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.note-form-container {
  padding: 0 0 20px 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
}

.form-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.note-form {
  padding: 24px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  height: 600px;
  min-height: 600px;
  width: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
}

.detail-content-container {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 20px;
  min-height: 600px;
  background-color: #fafafa;
  font-size: 16px;
  line-height: 1.6;
}

.detail-content {
  max-width: 100%;
  word-wrap: break-word;
}

.detail-content h1,
.detail-content h2,
.detail-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.detail-content h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.detail-content h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.detail-content h3 {
  font-size: 1.25em;
}

.detail-content p {
  margin-bottom: 16px;
}

.detail-content strong {
  font-weight: 600;
}

.detail-content em {
  font-style: italic;
}

.detail-content code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
  font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
}

.detail-content br {
  display: block;
  margin: 10px 0;
}

.no-content {
  color: #9ca3af;
  text-align: center;
  padding: 40px 0;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.switch-label {
  margin-left: 12px;
  font-size: 14px;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cover-image-preview {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

@media screen and (max-width: 768px) {
  .note-form {
    padding: 16px;
  }
  
  :deep(.el-form .el-form-item__label) {
    width: 80px;
    font-size: 14px;
  }
  
  :deep(.el-form .el-form-item__content) {
    margin-left: 80px !important;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  :deep(.el-form-actions .el-button) {
    width: 100%;
  }
  
  .editor-container {
    margin-right: -16px;
    margin-left: -16px;
    border-radius: 0;
  }
}

@media screen and (max-width: 480px) {
  :deep(.el-form .el-form-item) {
    display: flex;
    flex-direction: column;
  }
  
  :deep(.el-form .el-form-item__label) {
    width: 100%;
    margin-bottom: 8px;
  }
  
  :deep(.el-form .el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
