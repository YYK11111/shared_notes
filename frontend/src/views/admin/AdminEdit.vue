<template>
  <div class="admin-content">
    <div class="page-header">
      <h1>编辑管理员</h1>
      <el-button @click="router.back()" type="default">返回</el-button>
    </div>
    
    <el-card class="edit-form-card">
      <el-form
        ref="adminFormRef"
        :model="adminForm"
        :rules="formRules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="adminForm.username"
            placeholder="请输入用户名"
            clearable
            :disabled="true"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleResetPassword">重置密码</el-button>
        </el-form-item>
        
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="adminForm.nickname"
            placeholder="请输入昵称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="adminForm.email"
            placeholder="请输入邮箱"
            clearable
            type="email"
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="adminForm.phone"
            placeholder="请输入手机号"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role_id">
          <el-select
            v-model="adminForm.role_id"
            placeholder="请选择角色"
            clearable
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="adminForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input
            v-model="newPassword"
            placeholder="请输入新密码"
            show-password
            :clearable="true"
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="confirmPassword"
            placeholder="请再次输入新密码"
            show-password
            :clearable="true"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelResetPassword">取消</el-button>
          <el-button type="primary" @click="confirmResetPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDialog, ElInput, ElButton } from 'element-plus'
import { getAdminList, updateAdmin, getRoleList, resetAdminPassword, getAdminDetail } from '@/api/admin'

const router = useRouter()
const route = useRoute()
const adminId = route.params.id
const adminFormRef = ref(null)
const roles = ref([])
const loading = ref(false)
const resetPasswordDialogVisible = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// 表单数据
const adminForm = reactive({
  id: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  role_id: '',
  status: 1
})

// 表单验证规则
const formRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur'
    }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'blur' }
  ]
}

// 获取角色列表
const fetchRoles = async () => {
  try {
    const response = await getRoleList()
    if (response.code === 200 && response.data) {
      roles.value = response.data.list || []
    } else {
      ElMessage.error('获取角色列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to fetch roles:', error)
  }
}

// 获取管理员详情
const fetchAdminDetail = async () => {
  if (!adminId) {
    ElMessage.error('管理员ID不存在')
    router.push('/admin/admins')
    return
  }

  loading.value = true
  try {
    const response = await getAdminDetail(adminId)
    if (response.code === 200 && response.data) {
      Object.assign(adminForm, response.data)
    } else {
      ElMessage.error('获取管理员信息失败')
      router.push('/admin/admins')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to fetch admin detail:', error)
    router.push('/admin/admins')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await adminFormRef.value.validate()
    
    const response = await updateAdmin(adminId, adminForm)
    
    if (response.code === 200) {
      ElMessage.success('管理员信息更新成功')
      router.push('/admin/admins')
    } else {
      ElMessage.error(response.message || '管理员信息更新失败')
    }
  } catch (error) {
    if (error.name === 'Error') {
      ElMessage.error(error.message)
    } else {
      console.error('Form validation failed:', error)
    }
  }
}

// 重置密码
const handleResetPassword = () => {
  resetPasswordDialogVisible.value = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  if (!newPassword.value) {
    ElMessage.error('请输入新密码')
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  if (newPassword.value.length < 6 || newPassword.value.length > 30) {
    ElMessage.error('密码长度应在 6 到 30 个字符之间')
    return
  }
  
  try {
    const response = await resetAdminPassword(adminId, { password: newPassword.value })
    
    if (response.code === 200) {
      ElMessage.success('密码重置成功')
      resetPasswordDialogVisible.value = false
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      ElMessage.error(response.message || '密码重置失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to reset password:', error)
  }
}

// 取消重置密码
const cancelResetPassword = () => {
  resetPasswordDialogVisible.value = false
  newPassword.value = ''
  confirmPassword.value = ''
}

// 取消操作
const handleCancel = () => {
  router.back()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRoles()
  fetchAdminDetail()
})
</script>

<style scoped>
.admin-content {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-form-card {
  max-width: 600px;
}
</style>