<template>
  <div class="admin-form-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>{{ isEditMode ? '编辑管理员' : '创建管理员' }}</h1>
      <p class="page-description">{{ isEditMode ? '修改管理员的基本信息' : '添加新的管理员账号' }}</p>
    </div>
    
    <!-- 表单卡片 -->
    <el-card class="form-card">
      <el-form
        ref="adminFormRef"
        :model="adminForm"
        :rules="formRules"
        label-width="120px"
        class="admin-form"
      >
        <!-- 基本信息 -->
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="adminForm.username"
            placeholder="请输入用户名"
            :disabled="isEditMode"
            clearable
          />
          <div class="form-tip">用户名用于登录，创建后不可修改</div>
        </el-form-item>
        
        <el-form-item
          v-if="!isEditMode"
          label="密码" 
          prop="password"
        >
          <el-input
            v-model="adminForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
            clearable
          />
          <div class="form-tip">密码长度8-20位，必须包含字母和数字</div>
        </el-form-item>
        
        <el-form-item
          v-if="!isEditMode"
          label="确认密码" 
          prop="confirmPassword"
        >
          <el-input
            v-model="adminForm.confirmPassword"
            placeholder="请再次输入密码"
            type="password"
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
            type="email"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="adminForm.phone"
            placeholder="请输入手机号"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="adminForm.role"
            placeholder="请选择角色"
            clearable
          >
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <div class="form-tip">超级管理员拥有最高权限</div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="adminForm.status"
            :active-value="1"
            :inactive-value="0"
          />
          <span class="switch-label">{{ adminForm.status === 1 ? '启用' : '禁用' }}</span>
        </el-form-item>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">
              <el-icon><ArrowLeft /></el-icon>
              <span>取消</span>
            </el-button>
            <el-button
              type="primary"
              @click="handleSubmit"
              :loading="submitting"
            >
              <el-icon v-if="!isEditMode"><Check /></el-icon>
              <el-icon v-else><Edit /></el-icon>
              <span>{{ isEditMode ? '保存修改' : '创建管理员' }}</span>
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';
import auth from '../utils/auth';

// 路由实例
const router = useRouter();
const route = useRoute();

// 表单引用
const adminFormRef = ref(null);

// 提交状态
const submitting = ref(false);

// 判断是否为编辑模式
const isEditMode = computed(() => {
  return route.path.includes('/edit') && route.params.id;
});

// 当前编辑的管理员ID
const adminId = computed(() => route.params.id);

// 当前用户信息
const currentUser = computed(() => auth.getUserInfo() || {});

// 是否是超级管理员
const isSuperAdmin = computed(() => currentUser.value.role === 'super_admin');

// 表单数据
const adminForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
  phone: '',
  role: 'admin',
  status: 1
});

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在4-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符', trigger: 'blur' },
    {
      validator: async (rule, value, callback) => {
        if (!value) return callback();
        try {
          const res = await api.admin.checkUsername(value, isEditMode.value ? adminId.value : null);
          if (res.code === 200 && !res.data.isAvailable) {
            callback(new Error('用户名已存在'));
          } else {
            callback();
          }
        } catch (error) {
          callback(new Error('验证用户名失败'));
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在8-20个字符之间', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== adminForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2-20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    {
      validator: async (rule, value, callback) => {
        if (!value) return callback();
        try {
          const res = await api.admin.checkEmail(value, isEditMode.value ? adminId.value : null);
          if (res.code === 200 && !res.data.isAvailable) {
            callback(new Error('邮箱已被使用'));
          } else {
            callback();
          }
        } catch (error) {
          callback(new Error('验证邮箱失败'));
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' },
    {
      validator: async (rule, value, callback) => {
        if (!value) return callback();
        try {
          const res = await api.admin.checkPhone(value, isEditMode.value ? adminId.value : null);
          if (res.code === 200 && !res.data.isAvailable) {
            callback(new Error('手机号已被使用'));
          } else {
            callback();
          }
        } catch (error) {
          callback(new Error('验证手机号失败'));
        }
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请设置状态', trigger: 'change' }
  ]
};

// 处理表单提交
const handleSubmit = async () => {
  try {
    // 验证表单
    await adminFormRef.value.validate();
    
    submitting.value = true;
    
    // 准备提交数据
    const submitData = {
      ...adminForm,
      // 编辑模式下不需要提交用户名和密码
      ...(isEditMode.value && {
        username: undefined,
        password: undefined,
        confirmPassword: undefined
      })
    };
    
    let res;
    if (isEditMode.value) {
      // 编辑管理员
      res = await api.admin.updateAdmin(adminId.value, submitData);
    } else {
      // 创建管理员
      res = await api.admin.createAdmin(submitData);
    }
    
    if (res.code === 200) {
      ElMessage.success(isEditMode.value ? '管理员信息更新成功' : '管理员创建成功');
      
      // 跳转回管理员列表页面
      setTimeout(() => {
        router.push('/admins');
      }, 1500);
    } else {
      ElMessage.error(res.message || (isEditMode.value ? '更新失败' : '创建失败'));
    }
  } catch (error) {
    console.error(isEditMode.value ? '更新管理员失败:' : '创建管理员失败:', error);
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(isEditMode.value ? '更新失败，请重试' : '创建失败，请重试');
    }
  } finally {
    submitting.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  // 如果表单有内容，提示用户是否确认离开
  if (hasFormContent()) {
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
        router.push('/admins');
      })
      .catch(() => {
        // 用户取消操作
      });
  } else {
    router.push('/admins');
  }
};

// 检查表单是否有内容
const hasFormContent = () => {
  return Object.values(adminForm).some(value => {
    return value !== '' && value !== null && value !== undefined;
  });
};

// 获取管理员详情
const fetchAdminDetail = async () => {
  try {
    const res = await api.admin.getAdminDetail(adminId.value);
    if (res.code === 200 && res.data) {
      // 填充表单数据
      Object.assign(adminForm, res.data);
    } else {
      ElMessage.error(res.message || '获取管理员信息失败');
      // 如果获取失败，跳转回管理员列表
      setTimeout(() => {
        router.push('/admins');
      }, 1500);
    }
  } catch (error) {
    console.error('获取管理员详情失败:', error);
    ElMessage.error('获取管理员信息失败');
    // 如果获取失败，跳转回管理员列表
    setTimeout(() => {
      router.push('/admins');
    }, 1500);
  }
};

// 页面加载时初始化数据
onMounted(() => {
  if (isEditMode.value) {
    // 如果是编辑模式，获取管理员详情
    fetchAdminDetail();
  } else {
    // 如果是创建模式，设置默认值
    adminForm.role = 'admin';
    adminForm.status = 1;
  }
});

// 监听路由变化，防止用户直接修改URL
const routeWatcher = (newRoute) => {
  if (newRoute.path !== route.path) {
    // 页面已经加载，路由变化时处理
    if (hasFormContent()) {
      ElMessageBox.confirm(
        '表单内容尚未保存，确定要离开吗？',
        '确认离开',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
    }
  }
};

// 在组件卸载前移除路由监听
const onUnmounted = () => {
  route.unwatch(routeWatcher);
};

// 导出组件卸载时的清理函数
defineExpose({ onUnmounted });
</script>

<style scoped>
/* 管理员表单页面容器 */
.admin-form-container {
  padding: 0 0 20px 0;
}

/* 页面标题 */
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

/* 表单卡片 */
.form-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 管理员表单 */
.admin-form {
  padding: 24px;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 开关标签 */
.switch-label {
  margin-left: 12px;
  font-size: 14px;
  color: #6b7280;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 表单项样式调整 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 768px) {
  .admin-form {
    padding: 16px;
  }
  
  :deep(.el-form .el-form-item__label) {
    width: 100px;
    font-size: 14px;
  }
  
  :deep(.el-form .el-form-item__content) {
    margin-left: 100px !important;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  :deep(.el-form-actions .el-button) {
    width: 100%;
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