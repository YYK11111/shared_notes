<template>
  <div class="user-profile-page">
    <!-- 用户头部信息 -->
    <div class="user-header">
      <div class="user-header-bg">
        <img v-if="userInfo.cover_image" :src="userInfo.cover_image" alt="用户封面" class="cover-image" />
        <div v-else class="cover-placeholder"></div>
      </div>
      <div class="user-info-container">
        <div class="avatar-container">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
          <div v-else class="avatar-placeholder">
            <span>{{ userInitial }}</span>
          </div>
        </div>
        <div class="user-basic-info">
          <h1 class="user-name">{{ userInfo.username }}</h1>
          <p class="user-bio">{{ userInfo.bio || '这个人很懒，什么都没有留下...' }}</p>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.note_count || 0 }}</span>
              <span class="stat-label">笔记</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.followers_count || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.following_count || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
          </div>
        </div>
        <div class="user-actions">
          <el-button v-if="!isCurrentUser" type="primary" @click="handleFollow">
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
          <el-button v-if="isCurrentUser" type="primary" @click="handleEditProfile">
            编辑资料
          </el-button>
          <el-button v-if="!isCurrentUser" @click="handleSendMessage">
            发消息
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 内容标签页 -->
    <div class="content-container">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="笔记" name="notes">
          <div class="notes-section">
            <!-- 筛选和排序 -->
            <div class="filter-sort">
              <el-select v-model="noteFilter" placeholder="筛选" style="width: 120px;">
                <el-option label="全部笔记" value="all"></el-option>
                <el-option label="已发布" value="published"></el-option>
                <el-option label="草稿" value="draft"></el-option>
              </el-select>
              <el-select v-model="noteSort" placeholder="排序" style="width: 120px;">
                <el-option label="最新发布" value="latest"></el-option>
                <el-option label="最热" value="hottest"></el-option>
                <el-option label="最多点赞" value="most_liked"></el-option>
              </el-select>
              <div v-if="isCurrentUser" class="create-note-btn">
                <el-button type="primary" @click="handleCreateNote">
                  <el-icon><Plus /></el-icon>
                  写笔记
                </el-button>
              </div>
            </div>
            
            <!-- 笔记列表 -->
            <div v-if="notes.length > 0" class="note-list">
              <div v-for="note in notes" :key="note.id" class="note-item">
                <div class="note-content">
                  <h3 class="note-title">
                    <router-link :to="'/notes/' + note.id">{{ note.title }}</router-link>
                  </h3>
                  <p class="note-excerpt">{{ truncateText(note.content, 120) }}</p>
                  <div class="note-meta">
                    <span class="note-category">{{ note.category?.name || '未分类' }}</span>
                    <span class="note-time">{{ formatDate(note.created_at) }}</span>
                    <div class="note-stats">
                      <span class="stat-view">
                        <el-icon><View /></el-icon>
                        {{ note.view_count || 0 }}
                      </span>
                      <span class="stat-like">
                        <el-icon><Star /></el-icon>
                        {{ note.like_count || 0 }}
                      </span>
                      <span class="stat-comment">
                        <el-icon><ChatDotRound /></el-icon>
                        {{ note.comment_count || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="note.cover_image" class="note-cover">
                  <img :src="note.cover_image" alt="笔记封面" class="cover-img" />
                </div>
              </div>
            </div>
            
            <!-- 无笔记提示 -->
            <div v-else class="empty-state">
              <el-empty description="暂无笔记"></el-empty>
            </div>
            
            <!-- 分页 -->
            <div v-if="notes.length > 0" class="pagination">
              <el-pagination
                v-model:current-page="notesPage.current"
                v-model:page-size="notesPage.size"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="notesTotal"
                @size-change="handleNotesSizeChange"
                @current-change="handleNotesCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="收藏" name="collections">
          <div class="collections-section">
            <!-- 收藏笔记列表 -->
            <div v-if="collections.length > 0" class="note-list">
              <div v-for="item in collections" :key="item.id" class="note-item">
                <div class="note-content">
                  <h3 class="note-title">
                    <router-link :to="'/notes/' + item.note_id">{{ item.note?.title }}</router-link>
                  </h3>
                  <p class="note-excerpt">{{ truncateText(item.note?.content || '', 120) }}</p>
                  <div class="note-meta">
                    <span class="note-category">{{ item.note?.category?.name || '未分类' }}</span>
                    <span class="note-time">{{ formatDate(item.created_at) }}</span>
                    <div class="note-stats">
                      <span class="stat-view">
                        <el-icon><View /></el-icon>
                        {{ item.note?.view_count || 0 }}
                      </span>
                      <span class="stat-like">
                        <el-icon><Star /></el-icon>
                        {{ item.note?.like_count || 0 }}
                      </span>
                      <span class="stat-comment">
                        <el-icon><ChatDotRound /></el-icon>
                        {{ item.note?.comment_count || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="item.note?.cover_image" class="note-cover">
                  <img :src="item.note?.cover_image" alt="笔记封面" class="cover-img" />
                </div>
              </div>
            </div>
            
            <!-- 无收藏提示 -->
            <div v-else class="empty-state">
              <el-empty description="暂无收藏"></el-empty>
            </div>
            
            <!-- 分页 -->
            <div v-if="collections.length > 0" class="pagination">
              <el-pagination
                v-model:current-page="collectionsPage.current"
                v-model:page-size="collectionsPage.size"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="collectionsTotal"
                @size-change="handleCollectionsSizeChange"
                @current-change="handleCollectionsCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="点赞" name="likes">
          <div class="likes-section">
            <!-- 点赞笔记列表 -->
            <div v-if="likes.length > 0" class="note-list">
              <div v-for="item in likes" :key="item.id" class="note-item">
                <div class="note-content">
                  <h3 class="note-title">
                    <router-link :to="'/notes/' + item.note_id">{{ item.note?.title }}</router-link>
                  </h3>
                  <p class="note-excerpt">{{ truncateText(item.note?.content || '', 120) }}</p>
                  <div class="note-meta">
                    <span class="note-category">{{ item.note?.category?.name || '未分类' }}</span>
                    <span class="note-time">{{ formatDate(item.created_at) }}</span>
                    <div class="note-stats">
                      <span class="stat-view">
                        <el-icon><View /></el-icon>
                        {{ item.note?.view_count || 0 }}
                      </span>
                      <span class="stat-like">
                        <el-icon><Star /></el-icon>
                        {{ item.note?.like_count || 0 }}
                      </span>
                      <span class="stat-comment">
                        <el-icon><ChatDotRound /></el-icon>
                        {{ item.note?.comment_count || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="item.note?.cover_image" class="note-cover">
                  <img :src="item.note?.cover_image" alt="笔记封面" class="cover-img" />
                </div>
              </div>
            </div>
            
            <!-- 无点赞提示 -->
            <div v-else class="empty-state">
              <el-empty description="暂无点赞"></el-empty>
            </div>
            
            <!-- 分页 -->
            <div v-if="likes.length > 0" class="pagination">
              <el-pagination
                v-model:current-page="likesPage.current"
                v-model:page-size="likesPage.size"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="likesTotal"
                @size-change="handleLikesSizeChange"
                @current-change="handleLikesCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane v-if="isCurrentUser" label="设置" name="settings">
          <div class="settings-section">
            <el-card>
              <template #header>
                <div class="card-header-title">账户设置</div>
              </template>
              
              <el-form :model="settingsForm" ref="settingsFormRef" label-width="100px" class="settings-form">
                <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]">
                  <el-input v-model="settingsForm.username" placeholder="请输入用户名" />
                </el-form-item>
                
                <el-form-item label="邮箱" prop="email" :rules="[
                  { required: true, message: '请输入邮箱', trigger: 'blur' },
                  { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
                ]">
                  <el-input v-model="settingsForm.email" placeholder="请输入邮箱" type="email" />
                </el-form-item>
                
                <el-form-item label="简介" prop="bio">
                  <el-input v-model="settingsForm.bio" type="textarea" placeholder="请输入个人简介" :rows="3" />
                </el-form-item>
                
                <el-form-item label="头像">
                  <el-upload
                    v-model:file-list="avatarFileList"
                    class="upload-demo"
                    action=""
                    :before-upload="handleAvatarBeforeUpload"
                    :on-success="handleAvatarUploadSuccess"
                    :auto-upload="false"
                    :show-file-list="true"
                    list-type="picture-card"
                    :limit="1"
                    :on-exceed="handleAvatarExceed"
                  >
                    <el-icon><Plus /></el-icon>
                    <template #file="{ file }">
                      <img :src="file.url" alt="头像" class="avatar-preview" />
                      <div class="el-upload__file-action">
                        <el-icon @click="handleRemoveAvatar"><Delete /></el-icon>
                      </div>
                    </template>
                  </el-upload>
                  <div class="form-hint">建议上传正方形图片，大小不超过2MB</div>
                </el-form-item>
                
                <el-form-item label="封面">
                  <el-upload
                    v-model:file-list="coverFileList"
                    class="upload-demo"
                    action=""
                    :before-upload="handleCoverBeforeUpload"
                    :on-success="handleCoverUploadSuccess"
                    :auto-upload="false"
                    :show-file-list="true"
                    list-type="picture-card"
                    :limit="1"
                    :on-exceed="handleCoverExceed"
                  >
                    <el-icon><Plus /></el-icon>
                    <template #file="{ file }">
                      <img :src="file.url" alt="封面" class="cover-preview" />
                      <div class="el-upload__file-action">
                        <el-icon @click="handleRemoveCover"><Delete /></el-icon>
                      </div>
                    </template>
                  </el-upload>
                  <div class="form-hint">建议上传宽高比为4:1的图片，大小不超过5MB</div>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="handleSaveSettings">保存设置</el-button>
                  <el-button @click="handleCancelSettings">取消</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Plus, Star, View, ChatDotRound, Delete } from '@element-plus/icons-vue'
import { getUserProfile, getUserNotes, getUserCollections, getUserLikes, updateUserProfile, followUser, unfollowUser } from '@/api/user'
import { uploadImage } from '@/api/upload'
import { marked } from 'marked'

const router = useRouter()
const route = useRoute()
const userId = route.params.id || 'me' // 'me'表示当前登录用户

// 状态变量
const loading = ref(false)
const activeTab = ref('notes')
const userInfo = ref({})
const notes = ref([])
const collections = ref([])
const likes = ref([])
const isCurrentUser = ref(false)
const isFollowing = ref(false)

// 分页数据
const notesPage = reactive({ current: 1, size: 10 })
const collectionsPage = reactive({ current: 1, size: 10 })
const likesPage = reactive({ current: 1, size: 10 })
const notesTotal = ref(0)
const collectionsTotal = ref(0)
const likesTotal = ref(0)

// 筛选和排序
const noteFilter = ref('all')
const noteSort = ref('latest')

// 设置表单
const settingsForm = reactive({})
const settingsFormRef = ref()
const avatarFileList = ref([])
const coverFileList = ref([])
const originalSettings = ref({})

// 计算用户首字母
const userInitial = computed(() => {
  if (!userInfo.value.username) return 'U'
  return userInfo.value.username.charAt(0).toUpperCase()
})

// 获取用户信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const response = await getUserProfile(userId)
    userInfo.value = response.data || {}
    
    // 判断是否为当前用户
    isCurrentUser.value = userId === 'me' || userId === userInfo.value.id
    
    // 如果是当前用户，初始化设置表单
    if (isCurrentUser.value) {
      Object.assign(settingsForm, {
        username: userInfo.value.username,
        email: userInfo.value.email,
        bio: userInfo.value.bio || '',
        avatar: userInfo.value.avatar || '',
        cover_image: userInfo.value.cover_image || ''
      })
      
      // 保存原始设置用于取消操作
      originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
      
      // 初始化头像和封面文件列表
      if (userInfo.value.avatar) {
        avatarFileList.value = [{ url: userInfo.value.avatar }]
      }
      if (userInfo.value.cover_image) {
        coverFileList.value = [{ url: userInfo.value.cover_image }]
      }
    }
    
    // 如果是访问其他用户页面，检查是否已关注
    if (!isCurrentUser.value) {
      isFollowing.value = response.data?.is_following || false
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败：' + (error.message || '未知错误'))
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取用户笔记
const fetchUserNotes = async () => {
  try {
    const response = await getUserNotes(userId, {
      page: notesPage.current,
      page_size: notesPage.size,
      filter: noteFilter.value,
      sort: noteSort.value
    })
    notes.value = response.data?.items || []
    notesTotal.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取笔记列表失败：' + (error.message || '未知错误'))
    console.error('获取笔记列表失败:', error)
  }
}

// 获取用户收藏
const fetchUserCollections = async () => {
  try {
    const response = await getUserCollections(userId, {
      page: collectionsPage.current,
      page_size: collectionsPage.size
    })
    collections.value = response.data?.items || []
    collectionsTotal.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取收藏列表失败：' + (error.message || '未知错误'))
    console.error('获取收藏列表失败:', error)
  }
}

// 获取用户点赞
const fetchUserLikes = async () => {
  try {
    const response = await getUserLikes(userId, {
      page: likesPage.current,
      page_size: likesPage.size
    })
    likes.value = response.data?.items || []
    likesTotal.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取点赞列表失败：' + (error.message || '未知错误'))
    console.error('获取点赞列表失败:', error)
  }
}

// 处理关注/取消关注
const handleFollow = async () => {
  try {
    if (isFollowing.value) {
      await unfollowUser(userId)
      ElMessage.success('已取消关注')
    } else {
      await followUser(userId)
      ElMessage.success('关注成功')
    }
    isFollowing.value = !isFollowing.value
    // 更新粉丝数
    if (userInfo.value.followers_count !== undefined) {
      userInfo.value.followers_count += isFollowing.value ? 1 : -1
    }
  } catch (error) {
    ElMessage.error('操作失败：' + (error.message || '未知错误'))
    console.error('关注/取消关注失败:', error)
  }
}

// 处理发消息
const handleSendMessage = () => {
  ElMessage.success('消息功能暂未实现')
}

// 处理编辑个人资料
const handleEditProfile = () => {
  activeTab.value = 'settings'
}

// 处理创建笔记
const handleCreateNote = () => {
  router.push('/admin/notes/create')
}

// 处理保存设置
const handleSaveSettings = async () => {
  // 验证表单
  const isValid = await settingsFormRef.value.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  loading.value = true
  try {
    const response = await updateUserProfile(settingsForm)
    if (response.code === 200) {
      ElMessage.success('设置保存成功')
      // 更新用户信息
      userInfo.value = { ...userInfo.value, ...settingsForm }
      // 更新原始设置
      originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
    } else {
      ElMessage.error((response.message || '保存失败'))
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error('保存设置失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理取消设置
const handleCancelSettings = () => {
  // 恢复原始设置
  if (originalSettings.value) {
    Object.assign(settingsForm, originalSettings.value)
    // 重置文件列表
    avatarFileList.value = originalSettings.value.avatar ? [{ url: originalSettings.value.avatar }] : []
    coverFileList.value = originalSettings.value.cover_image ? [{ url: originalSettings.value.cover_image }] : []
    // 重置表单验证
    settingsFormRef.value.resetFields()
  }
}

// 处理头像上传前校验
const handleAvatarBeforeUpload = (file) => {
  const isLessThan2MB = file.size / 1024 / 1024 < 2
  
  if (!isLessThan2MB) {
    ElMessage.error('头像大小不能超过 2MB!')
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
      // 检查宽高比是否为正方形
      if (Math.abs(aspectRatio - 1) > 0.1) {
        ElMessage.warning('建议上传正方形头像')
      }
    }
  }
  
  return true
}

// 处理封面上传前校验
const handleCoverBeforeUpload = (file) => {
  const isLessThan5MB = file.size / 1024 / 1024 < 5
  
  if (!isLessThan5MB) {
    ElMessage.error('封面大小不能超过 5MB!')
    return false
  }
  
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  return true
}

// 处理头像上传成功
const handleAvatarUploadSuccess = (response) => {
  if (response.code === 200 && response.data?.url) {
    settingsForm.avatar = response.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('头像上传失败：' + (response.message || '未知错误'))
  }
}

// 处理封面上传成功
const handleCoverUploadSuccess = (response) => {
  if (response.code === 200 && response.data?.url) {
    settingsForm.cover_image = response.data.url
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error('封面上传失败：' + (response.message || '未知错误'))
  }
}

// 处理头像超出数量
const handleAvatarExceed = () => {
  ElMessage.warning('最多只能上传1张头像')
}

// 处理封面超出数量
const handleCoverExceed = () => {
  ElMessage.warning('最多只能上传1张封面')
}

// 移除头像
const handleRemoveAvatar = () => {
  avatarFileList.value = []
  settingsForm.avatar = ''
}

// 移除封面
const handleRemoveCover = () => {
  coverFileList.value = []
  settingsForm.cover_image = ''
}

// 处理标签页切换
const handleTabChange = (tab) => {
  if (tab === 'notes') {
    fetchUserNotes()
  } else if (tab === 'collections') {
    fetchUserCollections()
  } else if (tab === 'likes') {
    fetchUserLikes()
  }
}

// 处理笔记分页大小变化
const handleNotesSizeChange = (size) => {
  notesPage.size = size
  fetchUserNotes()
}

// 处理笔记分页当前页变化
const handleNotesCurrentChange = (current) => {
  notesPage.current = current
  fetchUserNotes()
}

// 处理收藏分页大小变化
const handleCollectionsSizeChange = (size) => {
  collectionsPage.size = size
  fetchUserCollections()
}

// 处理收藏分页当前页变化
const handleCollectionsCurrentChange = (current) => {
  collectionsPage.current = current
  fetchUserCollections()
}

// 处理点赞分页大小变化
const handleLikesSizeChange = (size) => {
  likesPage.size = size
  fetchUserLikes()
}

// 处理点赞分页当前页变化
const handleLikesCurrentChange = (current) => {
  likesPage.current = current
  fetchUserLikes()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  // 移除Markdown格式
  const plainText = text.replace(/[#*_\[\]()~`]/g, '')
  // 移除HTML标签
  const cleanText = plainText.replace(/<[^>]*>/g, '')
  if (cleanText.length <= maxLength) return cleanText
  return cleanText.substring(0, maxLength) + '...'
}

// 监听筛选和排序变化
watch([noteFilter, noteSort], () => {
  notesPage.current = 1
  fetchUserNotes()
})

// 初始化页面数据
onMounted(() => {
  fetchUserInfo()
  fetchUserNotes()
})
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 用户头部信息 */
.user-header {
  width: 100%;
  margin-bottom: 2rem;
}

.user-header-bg {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background-color: #e4e7ed;
}

.user-info-container {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 0 2rem;
  margin-top: -60px;
}

.avatar-container {
  position: relative;
  z-index: 10;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  object-fit: cover;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  color: #fff;
}

.user-basic-info {
  flex: 1;
}

.user-name {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.user-bio {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.user-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 0.875rem;
  color: #999;
  margin-top: 0.25rem;
}

.user-actions {
  display: flex;
  gap: 1rem;
}

/* 内容容器 */
.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

/* 笔记部分 */
.notes-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

.filter-sort {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.create-note-btn {
  margin-left: auto;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.note-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.note-item:last-child {
  border-bottom: none;
}

.note-content {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.note-title a {
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
}

.note-title a:hover {
  color: #409eff;
}

.note-excerpt {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: #999;
}

.note-category {
  background-color: #f0f9ff;
  color: #409eff;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.note-stats {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

.stat-view, .stat-like, .stat-comment {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.note-cover {
  width: 180px;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.pagination {
  margin-top: 2rem;
  text-align: center;
}

/* 收藏和点赞部分 */
.collections-section,
.likes-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

/* 设置部分 */
.settings-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

.card-header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.settings-form {
  margin-top: 1.5rem;
}

.form-hint {
  color: #909399;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.avatar-preview,
.cover-preview {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .user-info-container {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 1.5rem;
  }
  
  .user-header-bg {
    height: 150px;
  }
  
  .user-avatar,
  .avatar-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .user-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 0 1rem 1.5rem;
  }
  
  .note-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .note-cover {
    width: 100%;
  }
  
  .cover-img {
    height: 180px;
  }
  
  .filter-sort {
    flex-direction: column;
    align-items: stretch;
  }
  
  .create-note-btn {
    margin-left: 0;
  }
  
  .user-stats {
    gap: 1rem;
  }
  
  .note-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .note-stats {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .user-header-bg {
    height: 100px;
  }
  
  .user-avatar,
  .avatar-placeholder {
    width: 80px;
    height: 80px;
  }
  
  .user-name {
    font-size: 1.5rem;
  }
  
  .notes-section,
  .collections-section,
  .likes-section,
  .settings-section {
    padding: 1rem;
  }
  
  .user-actions {
    flex-direction: column;
  }
}
</style>