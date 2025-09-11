<template>
  <div class="admin-content">
    <div class="page-header">
      <h1>创建管理员</h1>
      <el-button @click="router.back()" type="default">返回</el-button>
    </div>
    
    <el-card class="create-form-card">
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
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="adminForm.password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="adminForm.confirmPassword"
            placeholder="请再次输入密码"
            show-password
            clearable
          />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createAdmin, getRoleList } from '@/api/admin'

const router = useRouter()
const adminFormRef = ref(null)
const roles = ref([])

// 表单数据
const adminForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
  phone: '',
  role_id: '',
  status: 1
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度在 6 到 30 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== adminForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
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

// 提交表单
const handleSubmit = async () => {
  try {
    await adminFormRef.value.validate()
    
    // 移除确认密码字段
    const submitData = {
      ...adminForm
    }
    delete submitData.confirmPassword
    
    const response = await createAdmin(submitData)
    
    if (response.code === 200) {
      ElMessage.success('管理员创建成功')
      router.push('/admin/admins')
    } else {
      ElMessage.error(response.message || '管理员创建失败')
    }
  } catch (error) {
    if (error.name === 'Error') {
      ElMessage.error(error.message)
    } else {
      console.error('Form validation failed:', error)
    }
  }
}

// 取消操作
const handleCancel = () => {
  router.back()
}

// 组件挂载时获取角色列表
onMounted(() => {
  fetchRoles()
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

.create-form-card {
  max-width: 600px;
}
</style>