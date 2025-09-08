<template>
  <div class="admin-settings-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">个人设置</h2>
        </div>
      </template>
      
      <!-- 设置标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="基本信息" name="basic">
          <div class="settings-form-container">
            <el-form :model="basicForm" ref="basicFormRef" label-width="120px" class="settings-form">
              <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]">
                <el-input v-model="basicForm.username" placeholder="请输入用户名" disabled />
                <div class="form-hint">用户名不可修改</div>
              </el-form-item>
              
              <el-form-item label="邮箱" prop="email" :rules="[
                { required: true, message: '请输入邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
              ]">
                <el-input v-model="basicForm.email" placeholder="请输入邮箱" type="email" />
              </el-form-item>
              
              <el-form-item label="真实姓名" prop="real_name">
                <el-input v-model="basicForm.real_name" placeholder="请输入真实姓名" />
              </el-form-item>
              
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="basicForm.phone" placeholder="请输入联系电话" />
              </el-form-item>
              
              <el-form-item label="所属部门" prop="department">
                <el-input v-model="basicForm.department" placeholder="请输入所属部门" />
              </el-form-item>
              
              <el-form-item label="职位" prop="position">
                <el-input v-model="basicForm.position" placeholder="请输入职位" />
              </el-form-item>
              
              <el-form-item label="简介" prop="bio">
                <el-input v-model="basicForm.bio" type="textarea" placeholder="请输入个人简介" :rows="3" />
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
                  <el-icon><IconPlus /></el-icon>
                  <template #file="{ file }">
                    <img :src="file.url" alt="头像" class="avatar-preview" />
                    <div class="el-upload__file-action">
                      <el-icon @click="handleRemoveAvatar"><IconDelete /></el-icon>
                    </div>
                  </template>
                </el-upload>
                <div class="form-hint">建议上传正方形图片，大小不超过2MB</div>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSaveBasicSettings">保存设置</el-button>
                <el-button @click="handleCancelBasicSettings">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="修改密码" name="password">
          <div class="settings-form-container">
            <el-form :model="passwordForm" ref="passwordFormRef" label-width="120px" class="settings-form">
              <el-form-item label="当前密码" prop="current_password" :rules="[{ required: true, message: '请输入当前密码', trigger: 'blur' }]">
                <el-input v-model="passwordForm.current_password" placeholder="请输入当前密码" show-password />
              </el-form-item>
              
              <el-form-item label="新密码" prop="new_password" :rules="[
                { required: true, message: '请输入新密码', trigger: 'blur' },
                { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' },
                { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/, message: '密码必须包含大小写字母、数字和特殊字符', trigger: 'blur' }
              ]">
                <el-input v-model="passwordForm.new_password" placeholder="请输入新密码" show-password />
                <div class="form-hint">密码必须包含大小写字母、数字和特殊字符，长度8-20位</div>
              </el-form-item>
              
              <el-form-item label="确认新密码" prop="confirm_password" :rules="[
                { required: true, message: '请确认新密码', trigger: 'blur' },
                {
                  validator: (rule, value, callback) => {
                    if (value !== passwordForm.new_password) {
                      callback(new Error('两次输入的密码不一致'))
                    } else {
                      callback()
                    }
                  },
                  trigger: 'blur'
                }
              ]">
                <el-input v-model="passwordForm.confirm_password" placeholder="请确认新密码" show-password />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSavePassword">修改密码</el-button>
                <el-button @click="handleCancelPassword">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="账号安全" name="security">
          <div class="security-section">
            <el-card class="security-item">
              <template #header>
                <div class="security-item-header">
                  <div class="security-item-title">登录设备管理</div>
                  <el-button type="text" @click="handleManageDevices">管理</el-button>
                </div>
              </template>
              <div class="security-item-content">
                <div class="current-device">
                  <el-icon><IconComputer /></el-icon>
                  <span class="device-info">当前设备 - {{ getCurrentDeviceInfo() }}</span>
                </div>
                <div class="other-devices">
                  <span v-if="otherDevices.length > 0">
                    还有 {{ otherDevices.length }} 台设备登录了您的账号
                  </span>
                  <span v-else>目前只有这台设备登录了您的账号</span>
                </div>
              </div>
            </el-card>
            
            <el-card class="security-item">
              <template #header>
                <div class="security-item-header">
                  <div class="security-item-title">登录保护</div>
                  <span class="security-status" :class="{ enabled: twoFactorEnabled }">
                    {{ twoFactorEnabled ? '已开启' : '未开启' }}
                  </span>
                </div>
              </template>
              <div class="security-item-content">
                <p class="security-desc">开启登录保护后，登录时需要输入验证码，提高账号安全性。</p>
                <el-button v-if="!twoFactorEnabled" type="primary" @click="handleEnableTwoFactor">
                  开启
                </el-button>
                <el-button v-else type="danger" @click="handleDisableTwoFactor">
                  关闭
                </el-button>
              </div>
            </el-card>
            
            <el-card class="security-item">
              <template #header>
                <div class="security-item-header">
                  <div class="security-item-title">登录历史</div>
                </div>
              </template>
              <div class="login-history">
                <div v-if="loginHistory.length > 0" class="history-list">
                  <div v-for="record in loginHistory" :key="record.id" class="history-item">
                    <div class="history-info">
                      <div class="history-time">{{ formatDate(record.login_time) }}</div>
                      <div class="history-device">{{ record.device }} - {{ record.location }}</div>
                    </div>
                    <div class="history-status" :class="record.is_current ? 'current' : ''">
                      {{ record.is_current ? '当前会话' : '已退出' }}
                    </div>
                  </div>
                </div>
                <div v-else class="empty-history">暂无登录历史记录</div>
              </div>
            </el-card>
            
            <el-card class="security-item">
              <template #header>
                <div class="security-item-header">
                  <div class="security-item-title">账号注销</div>
                </div>
              </template>
              <div class="security-item-content">
                <p class="security-desc danger">注意：账号注销后，所有数据将无法恢复，请谨慎操作！</p>
                <el-button type="danger" @click="handleAccountDelete">注销账号</el-button>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="通知设置" name="notifications">
          <div class="notifications-section">
            <el-form :model="notificationForm" ref="notificationFormRef" label-width="120px" class="settings-form">
              <el-form-item label="系统通知">
                <el-checkbox-group v-model="notificationForm.system_notifications">
                  <el-checkbox label="邮件通知">邮件通知</el-checkbox>
                  <el-checkbox label="站内通知">站内通知</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="笔记相关通知">
                <el-checkbox-group v-model="notificationForm.note_notifications">
                  <el-checkbox label="有新评论">有新评论</el-checkbox>
                  <el-checkbox label="评论被回复">评论被回复</el-checkbox>
                  <el-checkbox label="笔记被点赞">笔记被点赞</el-checkbox>
                  <el-checkbox label="笔记被收藏">笔记被收藏</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="用户管理通知">
                <el-checkbox-group v-model="notificationForm.user_notifications">
                  <el-checkbox label="新用户注册">新用户注册</el-checkbox>
                  <el-checkbox label="用户反馈">用户反馈</el-checkbox>
                  <el-checkbox label="用户违规">用户违规</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="安全通知">
                <el-checkbox-group v-model="notificationForm.security_notifications">
                  <el-checkbox label="异地登录提醒">异地登录提醒</el-checkbox>
                  <el-checkbox label="密码修改提醒">密码修改提醒</el-checkbox>
                  <el-checkbox label="账号权限变更">账号权限变更</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSaveNotifications">保存设置</el-button>
                <el-button @click="handleCancelNotifications">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminProfile, updateAdminProfile, changeAdminPassword, getAdminSecuritySettings, updateAdminSecuritySettings, getAdminNotificationSettings, updateAdminNotificationSettings } from '@/api/admin'
import { uploadNoteImage } from '@/api/note'

// 状态变量
const loading = ref(false)
const activeTab = ref('basic')

// 表单引用
const basicFormRef = ref()
const passwordFormRef = ref()
const notificationFormRef = ref()

// 基本信息表单
const basicForm = reactive({})
const originalBasicForm = ref({})
const avatarFileList = ref([])

// 密码表单
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// 通知设置表单
const notificationForm = reactive({
  system_notifications: [],
  note_notifications: [],
  user_notifications: [],
  security_notifications: []
})
const originalNotificationForm = ref({})

// 安全设置相关
const twoFactorEnabled = ref(false)
const otherDevices = ref([])
const loginHistory = ref([])

// 获取管理员基本信息
const fetchAdminProfile = async () => {
  loading.value = true
  try {
    const response = await getAdminProfile()
    const adminInfo = response.data || {}
    
    // 填充基本信息表单
    Object.assign(basicForm, {
      username: adminInfo.username || '',
      email: adminInfo.email || '',
      real_name: adminInfo.real_name || '',
      phone: adminInfo.phone || '',
      department: adminInfo.department || '',
      position: adminInfo.position || '',
      bio: adminInfo.bio || '',
      avatar: adminInfo.avatar || ''
    })
    
    // 保存原始数据用于取消操作
    originalBasicForm.value = JSON.parse(JSON.stringify(basicForm))
    
    // 初始化头像文件列表
    if (adminInfo.avatar) {
      avatarFileList.value = [{ url: adminInfo.avatar }]
    }
  } catch (error) {
    ElMessage.error('获取管理员信息失败：' + (error.message || '未知错误'))
    console.error('获取管理员信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取安全设置
const fetchSecuritySettings = async () => {
  try {
    const response = await getAdminSecuritySettings()
    const settings = response.data || {}
    
    // 初始化安全设置
    twoFactorEnabled.value = settings.two_factor_enabled || false
    otherDevices.value = settings.other_devices || []
    loginHistory.value = settings.login_history || []
  } catch (error) {
    ElMessage.error('获取安全设置失败：' + (error.message || '未知错误'))
    console.error('获取安全设置失败:', error)
  }
}

// 获取通知设置
const fetchNotificationSettings = async () => {
  try {
    const response = await getAdminNotificationSettings()
    const settings = response.data || {}
    
    // 填充通知设置表单
    Object.assign(notificationForm, {
      system_notifications: settings.system_notifications || [],
      note_notifications: settings.note_notifications || [],
      user_notifications: settings.user_notifications || [],
      security_notifications: settings.security_notifications || []
    })
    
    // 保存原始数据用于取消操作
    originalNotificationForm.value = JSON.parse(JSON.stringify(notificationForm))
  } catch (error) {
    ElMessage.error('获取通知设置失败：' + (error.message || '未知错误'))
    console.error('获取通知设置失败:', error)
  }
}

// 保存基本信息
const handleSaveBasicSettings = async () => {
  // 验证表单
  const isValid = await basicFormRef.value.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  loading.value = true
  try {
    const response = await updateAdminProfile(basicForm)
    if (response.code === 200) {
      ElMessage.success('基本信息保存成功')
      // 更新原始数据
      originalBasicForm.value = JSON.parse(JSON.stringify(basicForm))
    } else {
      ElMessage.error((response.message || '保存失败'))
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error('保存基本信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消基本信息编辑
const handleCancelBasicSettings = () => {
  // 恢复原始数据
  if (originalBasicForm.value) {
    Object.assign(basicForm, originalBasicForm.value)
    // 重置头像文件列表
    avatarFileList.value = originalBasicForm.value.avatar ? [{ url: originalBasicForm.value.avatar }] : []
    // 重置表单验证
    basicFormRef.value.resetFields()
  }
}

// 修改密码
const handleSavePassword = async () => {
  // 验证表单
  const isValid = await passwordFormRef.value.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  loading.value = true
  try {
    const response = await changeAdminPassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    })
    if (response.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      // 清空表单
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
      passwordFormRef.value.resetFields()
      // 可以在这里添加跳转到登录页的逻辑
    } else {
      ElMessage.error((response.message || '密码修改失败'))
    }
  } catch (error) {
    ElMessage.error('密码修改失败：' + (error.message || '未知错误'))
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消密码修改
const handleCancelPassword = () => {
  passwordForm.current_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
  passwordFormRef.value.resetFields()
}

// 保存通知设置
const handleSaveNotifications = async () => {
  loading.value = true
  try {
    const response = await updateAdminNotificationSettings(notificationForm)
    if (response.code === 200) {
      ElMessage.success('通知设置保存成功')
      // 更新原始数据
      originalNotificationForm.value = JSON.parse(JSON.stringify(notificationForm))
    } else {
      ElMessage.error((response.message || '保存失败'))
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error('保存通知设置失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消通知设置编辑
const handleCancelNotifications = () => {
  // 恢复原始数据
  if (originalNotificationForm.value) {
    Object.assign(notificationForm, originalNotificationForm.value)
    // 重置表单验证
    notificationFormRef.value.resetFields()
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

// 处理头像上传成功
const handleAvatarUploadSuccess = (response) => {
  if (response.code === 200 && response.data?.url) {
    basicForm.avatar = response.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('头像上传失败：' + (response.message || '未知错误'))
  }
}

// 处理头像超出数量
const handleAvatarExceed = () => {
  ElMessage.warning('最多只能上传1张头像')
}

// 移除头像
const handleRemoveAvatar = () => {
  avatarFileList.value = []
  basicForm.avatar = ''
}

// 处理管理登录设备
const handleManageDevices = () => {
  ElMessage.success('设备管理功能暂未实现')
}

// 处理开启两步验证
const handleEnableTwoFactor = () => {
  ElMessageBox.confirm(
    '开启两步验证后，每次登录都需要输入验证码，这将提高您账号的安全性。是否确定开启？',
    '确认开启两步验证',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      // 这里应该调用开启两步验证的API
      // 为了演示，我们模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      twoFactorEnabled.value = true
      ElMessage.success('两步验证已开启')
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 处理关闭两步验证
const handleDisableTwoFactor = () => {
  ElMessageBox.confirm(
    '关闭两步验证会降低您账号的安全性，确定要关闭吗？',
    '确认关闭两步验证',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里应该调用关闭两步验证的API
      // 为了演示，我们模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))
      
      twoFactorEnabled.value = false
      ElMessage.success('两步验证已关闭')
    } catch (error) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 处理账号注销
const handleAccountDelete = () => {
  ElMessageBox.confirm(
    '警告：账号注销后，您的所有数据将被永久删除，且无法恢复。这是不可逆的操作，请谨慎确认！',
    '确认注销账号',
    {
      confirmButtonText: '确认注销',
      cancelButtonText: '取消',
      type: 'danger',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    ElMessage.warning('账号注销功能暂未实现')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 处理标签页切换
const handleTabChange = (tab) => {
  if (tab === 'security' && loginHistory.value.length === 0) {
    fetchSecuritySettings()
  }
  if (tab === 'notifications' && notificationForm.system_notifications.length === 0) {
    fetchNotificationSettings()
  }
}

// 获取当前设备信息
const getCurrentDeviceInfo = () => {
  // 模拟获取设备信息
  const userAgent = navigator.userAgent
  let device = '未知设备'
  
  if (userAgent.includes('Windows')) {
    device = 'Windows PC'
  } else if (userAgent.includes('Macintosh')) {
    device = 'Mac'
  } else if (userAgent.includes('iPhone')) {
    device = 'iPhone'
  } else if (userAgent.includes('iPad')) {
    device = 'iPad'
  } else if (userAgent.includes('Android')) {
    device = 'Android设备'
  }
  
  return device
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化页面数据
onMounted(() => {
  fetchAdminProfile()
  // 预填充模拟数据
  otherDevices.value = [
    { id: 1, device: 'iPhone', location: '北京市', login_time: '2023-10-15 14:30:00' },
    { id: 2, device: 'Mac', location: '上海市', login_time: '2023-10-10 09:15:00' }
  ]
  loginHistory.value = [
    { id: 1, device: 'Windows PC', location: '广州市', login_time: '2023-10-20 16:45:00', is_current: true },
    { id: 2, device: 'iPhone', location: '北京市', login_time: '2023-10-15 14:30:00', is_current: false },
    { id: 3, device: 'Mac', location: '上海市', login_time: '2023-10-10 09:15:00', is_current: false },
    { id: 4, device: 'Android设备', location: '深圳市', login_time: '2023-10-05 11:20:00', is_current: false }
  ]
})
</script>

<style scoped>
.admin-settings-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.settings-form-container {
  padding: 1rem 0;
}

.settings-form {
  max-width: 600px;
}

.form-hint {
  color: #909399;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.avatar-preview {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* 安全设置部分 */
.security-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.security-item {
  transition: all 0.3s ease;
}

.security-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.security-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.security-item-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.security-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.security-status.enabled {
  background-color: #f0f9ff;
  color: #409eff;
}

.security-status.disabled {
  background-color: #f5f5f5;
  color: #909399;
}

.security-item-content {
  padding: 1rem 0;
}

.security-desc {
  margin-bottom: 1rem;
  color: #606266;
  line-height: 1.5;
}

.security-desc.danger {
  color: #f56c6c;
  font-weight: 500;
}

.current-device {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #606266;
}

.other-devices {
  font-size: 0.875rem;
  color: #909399;
}

.login-history {
  max-height: 400px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
}

.history-time {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.history-device {
  font-size: 0.875rem;
  color: #606266;
}

.history-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.history-status.current {
  background-color: #f0f9ff;
  color: #409eff;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #909399;
}

/* 通知设置部分 */
.notifications-section {
  padding: 1rem 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .admin-settings-page {
    padding: 1rem;
  }
  
  .settings-form {
    max-width: 100%;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .security-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>