# 笔记管理系统前端开发方案

## 一、项目概述

基于已完成的后端API，本前端方案将实现一套完整的"后台管理+前台展示"系统，采用Vue 3技术栈，通过调用后端API实现所有业务功能。系统分为两个主要部分：管理员后台（用于内容管理）和用户前台（用于内容浏览）。

## 二、技术栈选型

### 核心框架
- **Vue 3**：采用Composition API语法，使用`<script setup>`简化代码
- **Vite**：构建工具，提供快速的热更新和构建性能
- **Vue Router**：路由管理，实现页面跳转和权限控制
- **Pinia**：状态管理，替代Vuex，更简洁的API和TypeScript支持

### UI组件库
- **后台管理**：Element Plus（提供丰富的管理后台组件）
- **前台展示**：Tailwind CSS（灵活的原子化CSS框架，便于定制样式）

### 工具库
- **Axios**：HTTP客户端，封装API请求
- **mavonEditor**：Markdown编辑器，用于笔记内容编辑
- **marked**：Markdown转HTML，用于笔记内容预览
- **DOMPurify**：HTML净化，防止XSS攻击
- **dayjs**：日期时间处理
- **lodash**：实用工具函数库

## 三、项目结构设计

```
src/
├── api/                # API接口封装
│   ├── auth.js         # 认证相关接口
│   ├── note.js         # 笔记管理接口
│   ├── user.js         # 前台用户接口
│   ├── admin.js        # 管理员接口
│   ├── config.js       # 系统配置接口
│   ├── feedback.js     # 反馈管理接口
│   ├── category.js     # 分类管理接口
│   ├── search.js       # 搜索相关接口
│   └── route.js        # 路由权限接口
├── assets/             # 静态资源
│   ├── images/         # 图片资源
│   └── styles/         # 全局样式
├── components/         # 公共组件
│   ├── common/         # 通用组件（按钮、卡片等）
│   ├── layout/         # 布局组件
│   └── editor/         # 编辑器相关组件
├── hooks/              # 自定义钩子
│   ├── useAuth.js      # 认证相关钩子
│   ├── usePagination.js # 分页相关钩子
│   └── useMessage.js   # 消息提示钩子
├── router/             # 路由配置
│   ├── index.js        # 路由入口
│   ├── adminRoutes.js  # 后台路由
│   └── frontRoutes.js  # 前台路由
├── store/              # Pinia状态管理
│   ├── auth.js         # 认证状态
│   ├── notes.js        # 笔记相关状态
│   └── system.js       # 系统配置状态
├── utils/              # 工具函数
│   ├── request.js      # Axios封装
│   ├── format.js       # 格式化工具
│   └── validate.js     # 验证工具
├── views/              # 页面组件
│   ├── admin/          # 后台页面
│   └── front/          # 前台页面
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## 四、核心功能实现

### 1. API请求封装

```javascript
// src/utils/request.js
import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useAuthStore } from '@/store/auth'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    // 添加Token
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, message } = response.data
    
    // 处理业务错误
    if (code !== 200) {
      ElMessage.error(message || '操作失败')
      return Promise.reject(new Error(message || 'Error'))
    }
    
    return response.data
  },
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config
    
    // Token过期处理
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // 尝试刷新Token
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
          { refreshToken: authStore.refreshToken }
        )
        
        if (data.code === 200) {
          authStore.setToken(data.data.token)
          authStore.setRefreshToken(data.data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.data.token}`
          return request(originalRequest)
        } else {
          // 刷新Token失败，需要重新登录
          authStore.logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        authStore.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // 其他错误处理
    ElMessage.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

### 2. 认证与权限控制

```javascript
// src/store/auth.js
import { defineStore } from 'pinia'
import { login, logout, refreshToken } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    routes: []
  }),
  
  actions: {
    // 登录
    async login(userData) {
      const res = await login(userData)
      this.token = res.data.token
      this.refreshToken = res.data.refreshToken
      this.userInfo = res.data.user
      
      // 保存到本地存储
      localStorage.setItem('token', this.token)
      localStorage.setItem('refreshToken', this.refreshToken)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      
      return res
    },
    
    // 登出
    async logout() {
      try {
        await logout()
      } finally {
        this.token = ''
        this.refreshToken = ''
        this.userInfo = {}
        this.routes = []
        
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userInfo')
      }
    },
    
    // 设置Token
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    // 设置刷新Token
    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken
      localStorage.setItem('refreshToken', refreshToken)
    },
    
    // 获取可访问路由
    async getAccessibleRoutes() {
      const res = await getAccessibleRoutes()
      this.routes = res.data
      return res.data
    }
  },
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isSuperAdmin: (state) => state.userInfo.role === 'super_admin'
  }
})
```

### 3. 动态路由实现

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import FrontLayout from '@/components/layout/FrontLayout.vue'

// 静态路由
const staticRoutes = [
  // 前台路由
  {
    path: '/',
    name: 'FrontLayout',
    component: FrontLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/front/Home.vue')
      },
      {
        path: 'notes/:id',
        name: 'NoteDetail',
        component: () => import('@/views/front/NoteDetail.vue')
      },
      {
        path: 'categories/:id',
        name: 'CategoryNotes',
        component: () => import('@/views/front/CategoryNotes.vue')
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/front/Search.vue')
      }
    ]
  },
  
  // 认证相关路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  }
]

// 管理员路由（需要权限控制）
const adminRoutes = {
  path: '/admin',
  name: 'AdminLayout',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [] // 动态添加
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  // 未登录访问需要认证的页面，跳转到登录页
  if (requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }
  
  // 已登录访问登录页，跳转到首页
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/admin')
  }
  
  // 处理管理员路由
  if (to.path.startsWith('/admin') && authStore.isLoggedIn) {
    // 如果还没有加载动态路由
    if (authStore.routes.length === 0) {
      try {
        // 获取可访问的路由
        const accessibleRoutes = await authStore.getAccessibleRoutes()
        
        // 动态添加路由
        accessibleRoutes.forEach(route => {
          adminRoutes.children.push({
            path: route.path,
            name: route.name,
            component: () => import(`@/views/admin/${route.component}.vue`),
            meta: route.meta
          })
        })
        
        router.addRoute(adminRoutes)
        
        // 重新导航到目标路由
        return next({ ...to, replace: true })
      } catch (error) {
        console.error('Failed to load routes:', error)
        return next('/login')
      }
    }
  }
  
  next()
})

export default router
```

### 4. 笔记管理功能（后台）

```vue
<!-- src/views/admin/Notes.vue -->
<template>
  <div class="notes-management">
    <el-page-header @back="handleBack" content="笔记管理" />
    
    <el-card class="mt-4">
      <div class="flex justify-between items-center mb-4">
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="搜索标题或内容" 
          style="width: 300px"
          clearable
        />
        
        <el-button type="primary" @click="handleAddNote">
          <el-icon><Plus /></el-icon>
          新增笔记
        </el-button>
      </div>
      
      <el-table 
        :data="tableData" 
        border 
        stripe
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="categories" label="分类" />
        <el-table-column prop="view_count" label="浏览量" width="100" />
        <el-table-column 
          prop="status" 
          label="状态" 
          width="100"
        >
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="created_at" 
          label="创建时间" 
          width="180"
        />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="handleEditNote(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteNote(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="mt-4"
      />
    </el-card>
    
    <!-- 笔记编辑弹窗 -->
    <note-editor-dialog 
      :visible="dialogVisible"
      :note-id="currentNoteId"
      @close="dialogVisible = false"
      @success="handleNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { getNoteList, deleteNote } from '@/api/note'
import NoteEditorDialog from '@/components/editor/NoteEditorDialog.vue'
import { ElMessage } from 'element-plus'

// 搜索表单
const searchForm = ref({
  keyword: '',
  categoryId: '',
  status: '',
  startDate: '',
  endDate: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 弹窗状态
const dialogVisible = ref(false)
const currentNoteId = ref('')

// 获取笔记列表
const fetchNoteList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...searchForm.value
    }
    
    const res = await getNoteList(params)
    tableData.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error('获取笔记列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchNoteList()
})

// 分页事件处理
const handleSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchNoteList()
}

const handleCurrentChange = (page) => {
  pagination.value.page = page
  fetchNoteList()
}

// 新增笔记
const handleAddNote = () => {
  currentNoteId.value = ''
  dialogVisible.value = true
}

// 编辑笔记
const handleEditNote = (row) => {
  currentNoteId.value = row.id
  dialogVisible.value = true
}

// 删除笔记
const handleDeleteNote = async (id) => {
  try {
    await deleteNote(id)
    ElMessage.success('删除成功')
    fetchNoteList()
  } catch (error) {
    console.error('删除笔记失败:', error)
  }
}

// 笔记保存成功后刷新列表
const handleNoteSaved = () => {
  fetchNoteList()
}

// 返回上一页
const handleBack = () => {
  history.back()
}
</script>
```

### 5. 富文本编辑器组件（基于mavonEditor）

```vue
<!-- src/components/editor/NoteEditorDialog.vue -->
<template>
  <el-dialog 
    v-model="visible" 
    title="编辑笔记" 
    width="900px"
    :before-close="handleClose"
  >
    <el-form 
      ref="noteFormRef" 
      :model="noteForm" 
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="标题" prop="title">
        <el-input 
          v-model="noteForm.title" 
          placeholder="请输入笔记标题"
          maxlength="200"
        />
      </el-form-item>
      
      <el-form-item label="分类" prop="categoryIds">
        <el-select
          v-model="noteForm.categoryIds"
          multiple
          placeholder="请选择分类"
        >
          <el-option
            v-for="category in categoryList"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="内容" prop="content">
        <mavon-editor
          v-model="noteForm.content"
          :toolbars="toolbars"
          :ishljs="true"
          @imgAdd="handleImageUpload"
          placeholder="请输入笔记内容..."
          style="min-height: 400px"
        />
      </el-form-item>
      
      <el-form-item label="状态">
        <el-radio-group v-model="noteForm.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item>
        <el-checkbox v-model="noteForm.isTop">置顶</el-checkbox>
        <el-checkbox v-model="noteForm.isHomeRecommend" class="ml-4">首页推荐</el-checkbox>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'
import { createNote, updateNote, getNoteDetail } from '@/api/note'
import { getCategoryList } from '@/api/category'
import { uploadNoteImage } from '@/api/note'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  noteId: {
    type: [String, Number],
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// 表单数据
const noteForm = ref({
  title: '',
  content: '',
  categoryIds: [],
  status: 1,
  isTop: 0,
  isHomeRecommend: 0
})

// 分类列表
const categoryList = ref([])

// 表单验证规则
const rules = ref({
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ],
  categoryIds: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
})

// 编辑器配置
const toolbars = {
  bold: true,
  italic: true,
  header: true,
  link: true,
  image: true,
  code: true,
  table: true,
  fullscreen: true,
  strikethrough: true,
  underline: true,
  alignment: true
}

// 表单引用
const noteFormRef = ref(null)

// 监听noteId变化，加载笔记详情
watch(
  () => props.noteId,
  async (newVal) => {
    if (newVal) {
      await fetchNoteDetail(newVal)
    } else {
      // 重置表单
      noteForm.value = {
        title: '',
        content: '',
        categoryIds: [],
        status: 1,
        isTop: 0,
        isHomeRecommend: 0
      }
    }
  },
  { immediate: true }
)

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    const res = await getCategoryList()
    categoryList.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取笔记详情
const fetchNoteDetail = async (id) => {
  try {
    const res = await getNoteDetail(id)
    const note = res.data
    noteForm.value = {
      title: note.title,
      content: note.content,
      categoryIds: note.categoryIds ? note.categoryIds.split(',').map(Number) : [],
      status: note.status,
      isTop: note.is_top,
      isHomeRecommend: note.is_home_recommend
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error)
  }
}

// 页面加载时获取分类
onMounted(() => {
  fetchCategoryList()
})

// 图片上传处理
const handleImageUpload = async (pos, $file) => {
  const formData = new FormData()
  formData.append('image', $file)
  
  try {
    const res = await uploadNoteImage(formData)
    // 插入图片到编辑器
    noteForm.value.content = noteForm.value.content + `\n![图片](${res.data.url})\n`
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await noteFormRef.value.validate()
    
    // 处理分类ID为逗号分隔的字符串
    const formData = new FormData()
    Object.entries(noteForm.value).forEach(([key, value]) => {
      if (key === 'categoryIds') {
        formData.append(key, value.join(','))
      } else {
        formData.append(key, value)
      }
    })
    
    if (props.noteId) {
      // 更新笔记
      await updateNote(props.noteId, formData)
      ElMessage.success('更新成功')
    } else {
      // 创建笔记
      await createNote(formData)
      ElMessage.success('创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    console.error('保存笔记失败:', error)
  }
}

// 关闭弹窗
const handleClose = () => {
  noteFormRef.value.resetFields()
  emit('close')
}
</script>
```

### 6. 前台笔记详情页

```vue
<!-- src/views/front/NoteDetail.vue -->
<template>
  <div class="note-detail">
    <el-card>
      <div class="note-header">
        <h1>{{ noteDetail.title }}</h1>
        <div class="meta-info">
          <span>分类: {{ noteDetail.categories }}</span>
          <span>发布时间: {{ formatDate(noteDetail.created_at) }}</span>
          <span>浏览量: {{ noteDetail.view_count }}</span>
        </div>
      </div>
      
      <div 
        class="note-content" 
        v-html="renderedContent"
      ></div>
      
      <!-- 上下篇导航 -->
      <div class="note-navigation">
        <div v-if="noteDetail.prevNote">
          上一篇: <router-link :to="`/notes/${noteDetail.prevNote.id}`">{{ noteDetail.prevNote.title }}</router-link>
        </div>
        <div v-if="noteDetail.nextNote">
          下一篇: <router-link :to="`/notes/${noteDetail.nextNote.id}`">{{ noteDetail.nextNote.title }}</router-link>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getNoteDetail } from '@/api/user'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'

// 路由信息
const route = useRoute()
const noteId = route.params.id

// 笔记详情
const noteDetail = ref({})

// 渲染后的内容
const renderedContent = computed(() => {
  if (!noteDetail.value.content) return ''
  // 先转换为HTML，再进行XSS过滤
  return DOMPurify.sanitize(marked.parse(noteDetail.value.content))
})

// 获取笔记详情
const fetchNoteDetail = async () => {
  try {
    const res = await getNoteDetail(noteId)
    noteDetail.value = res.data
  } catch (error) {
    console.error('获取笔记详情失败:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchNoteDetail()
})

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.note-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.note-header h1 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
  color: #333;
}

.meta-info {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.note-content {
  line-height: 1.8;
  font-size: 1rem;
  color: #333;
}

.note-content h2, .note-content h3 {
  margin: 1.5rem 0 1rem;
  color: #2c3e50;
}

.note-content p {
  margin-bottom: 1rem;
}

.note-content img {
  max-width: 100%;
  margin: 1.5rem auto;
  display: block;
  border-radius: 4px;
}

.note-content pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.note-navigation {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.note-navigation a {
  color: #42b983;
  text-decoration: none;
}

.note-navigation a:hover {
  text-decoration: underline;
}
</style>
```

## 五、关键功能模块说明

### 1. 后台管理系统

#### 1.1 仪表盘
- 展示系统统计数据（笔记总数、分类数、反馈数等）
- 显示最近动态和待处理事项

#### 1.2 笔记管理
- 笔记列表展示（支持分页、搜索、筛选）
- 笔记创建/编辑/删除
- 笔记状态管理（启用/禁用）
- 笔记置顶和推荐设置

#### 1.3 分类管理
- 分类树形结构展示
- 分类创建/编辑/删除
- 分类排序和状态管理

#### 1.4 反馈管理
- 反馈列表展示
- 反馈详情查看
- 反馈状态更新和回复
- 反馈统计分析

#### 1.5 系统配置
- 系统基础配置管理
- 搜索配置管理
- 数据库备份与恢复
- 缓存清理

#### 1.6 管理员管理
- 管理员列表展示
- 管理员创建/编辑/删除
- 角色管理和权限分配

### 2. 前台展示系统

#### 2.1 首页
- 系统配置信息展示
- 热门笔记、推荐笔记列表
- 分类导航展示

#### 2.2 分类浏览
- 分类树形结构展示
- 分类下笔记列表展示

#### 2.3 笔记详情
- 笔记内容展示（Markdown转HTML）
- 上下篇导航
- 阅读量统计

#### 2.4 搜索功能
- 关键词搜索
- 搜索结果展示
- 热门搜索词展示

#### 2.5 用户反馈
- 反馈提交表单

## 六、安全与性能优化

### 1. 安全措施
- XSS防护：使用DOMPurify净化HTML内容
- CSRF防护：利用JWT令牌验证
- 输入验证：前端表单验证和后端接口验证双重保障
- 敏感信息处理：密码加密存储，敏感数据脱敏展示

### 2. 性能优化
- 路由懒加载：减少初始加载时间
- 图片懒加载：提高页面加载速度
- 数据缓存：合理缓存不常变动的数据
- 分页加载：大数据列表分页加载
- 组件按需加载：减少不必要的资源加载

## 七、开发与部署流程

### 1. 开发环境
- Node.js 16+
- npm 7+ 或 yarn 1.22+
- VS Code（推荐）+ Volar插件

### 2. 开发命令
```bash
# 安装依赖
npm install

# 开发环境启动
npm run dev

# 构建生产版本
npm run build

# 代码格式化
npm run lint
```

### 3. 部署方案
- 构建静态资源：`npm run build`
- 部署到Nginx或其他静态资源服务器
- 配置适当的缓存策略和Gzip压缩

## 八、总结

本方案基于Vue 3技术栈，充分利用提供的后端API，实现了一套完整的笔记管理系统前端解决方案。系统分为后台管理和前台展示两部分，功能完整，界面美观，交互友好。

通过动态路由和权限控制，确保不同角色的用户只能访问其权限范围内的功能；通过mavonEditor实现了Markdown格式的笔记编辑和预览；通过完善的错误处理和用户反馈，提升了系统的可用性。

方案考虑了安全性和性能优化，遵循现代前端开发最佳实践，便于后续维护和扩展。