<template>
  <!-- 模板部分不变 -->
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>个人笔记分享平台</h2>
        <p>请登录您的账号</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        autocomplete="on"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="captcha">
          <el-input
            v-model="loginForm.captcha"
            placeholder="请输入验证码"
            prefix-icon="Key"
            autocomplete="off"
            @keydown.enter.prevent="handleLogin"
          />
          <img
            :src="captchaUrl"
            alt="验证码"
            class="captcha-image"
            @click="refreshCaptcha"
            title="点击刷新验证码"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false" @click="handleForgotPassword">忘记密码？</el-link>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '../utils/api';
import auth from '../utils/auth';
import request from '../utils/request';

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 路由实例
const router = useRouter();
const loginFormRef = ref();
const loading = ref(false);

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
  captcha: ''
});

// 验证码相关
const captchaUrl = ref('');
const captchaObjectUrl = ref('');
const captchaId = ref('');

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
  ]
};

// 初始化
onMounted(() => {
  const savedUsername = localStorage.getItem('remembered_username');
  if (savedUsername) {
    loginForm.username = savedUsername;
    loginForm.rememberMe = true;
  }
  refreshCaptcha();
});

// 刷新验证码
const refreshCaptcha = async () => {
  try {
    if (captchaObjectUrl.value) {
      URL.revokeObjectURL(captchaObjectUrl.value);
    }
    
    console.log('准备请求验证码接口');
    
    const startTime = performance.now();
    // 直接调用api.js中修改后的getCaptcha方法
    const result = await api.auth.getCaptcha();
    
    const endTime = performance.now();
    console.log('验证码接口请求完成，耗时:', (endTime - startTime).toFixed(2), 'ms');
    console.log('getCaptcha返回结果:', result);
    
    // 直接从返回对象中获取验证码ID（api.js已经处理过）
    captchaId.value = result.captchaId || 'fallback_' + Date.now();
    
    console.log('最终使用的验证码ID:', captchaId.value);
    
    // 如果还是没有获取到ID，记录详细错误信息
    if (!result.captchaId) {
      console.warn('未获取到验证码ID，使用临时ID作为降级方案');
      console.log('响应头详细信息:', result.headers);
      
      // 尝试再次从响应头中直接获取，确保没有遗漏
      if (result.headers) {
        const directCaptchaId = result.headers['x-captcha-id'] || result.headers['X-Captcha-Id'];
        if (directCaptchaId) {
          console.log('降级尝试成功获取到验证码ID:', directCaptchaId);
          captchaId.value = directCaptchaId;
        }
      }
    }
    
    // 创建图片URL
    captchaObjectUrl.value = URL.createObjectURL(result.data);
    captchaUrl.value = captchaObjectUrl.value;
    loginForm.captcha = '';
  } catch (error) {
    console.error('获取验证码异常:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : null,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : null
    });
    
    // 降级处理：使用本地验证码图片
    captchaId.value = 'mock_captcha_' + Date.now();
    captchaUrl.value = '/captcha.svg?t=' + Date.now();
    loginForm.captcha = '';
    ElMessage.warning('使用本地验证码替代，请直接输入验证码图片上的内容');
  }
};

// 组件卸载时释放资源
onUnmounted(() => {
  if (captchaObjectUrl.value) {
    URL.revokeObjectURL(captchaObjectUrl.value);
  }
});

// 错误信息解析函数（重点优化：支持对象数组格式的错误）
const getErrorMessage = (error) => {
  if (!error || typeof error !== 'object') return '未知错误，请稍后重试';
  if (error.isCancel) return '';

  const errorData = error.response?.data || error.data;
  const status = error.response?.status;

  // 处理已知状态码
  if (status === 400) {
    return errorData?.msg || errorData?.message || '输入信息有误';
  }
  
  if (status === 401) {
    return errorData?.msg || errorData?.message || '用户名或密码错误';
  }

  // 处理字段级错误（重点修复：解析包含message的对象数组）
  if (errorData && typeof errorData === 'object') {
    const fieldErrors = [];
    for (const key in errorData) {
      if (Array.isArray(errorData[key]) && errorData[key].length > 0) {
        // 遍历错误数组，提取每个对象的message属性
        errorData[key].forEach(errorItem => {
          const fieldName = {
            username: '用户名',
            password: '密码',
            captcha: '验证码'
          }[key] || key;
          
          // 优先使用errorItem的message，兼容两种格式
          const errorMsg = errorItem.message || errorItem;
          fieldErrors.push(`${fieldName}${errorMsg}`);
        });
      }
    }
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join('，');
    }

    // 处理常规错误消息
    if (errorData.message || errorData.msg) {
      return errorData.message || errorData.msg;
    }
  }

  if (status) {
    return `请求失败: ${status}`;
  }

  return '网络连接异常，请稍后重试';
};

// 处理登录
const handleLogin = debounce(async () => {
  try {
    // 先进行非空检查，避免验证失败时进入catch块
    const missingFields = [];
    if (!loginForm.username.trim()) missingFields.push('用户名');
    if (!loginForm.password) missingFields.push('密码');
    if (!loginForm.captcha.trim()) missingFields.push('验证码');
    
    if (missingFields.length > 0) {
      ElMessage.warning(`请填写${missingFields.join('、')}`);
      return;
    }
    
    if (!captchaId.value) {
      ElMessage.error('验证码加载失败，请刷新验证码');
      refreshCaptcha();
      return;
    }
    
    // 使用validate方法进行表单验证，捕获验证失败的错误
    let validateSuccess = false;
    try {
      await loginFormRef.value.validate();
      validateSuccess = true;
    } catch (validateError) {
      // 表单验证失败，Element Plus会自动显示错误提示，这里不需要额外处理
      console.log('表单验证失败:', validateError);
      return;
    }
    
    if (validateSuccess) {
      loading.value = true;
      
      const loginData = {
        username: loginForm.username.trim(),
        password: loginForm.password,
        captcha: loginForm.captcha.trim(),
        captchaId: captchaId.value
      };
      
      console.log('登录请求数据:', loginData);
      const res = await api.auth.login(loginData);
      
      if (res.code === 200) {
        // 同时保存token和refreshToken
        auth.setToken(res.data.token, res.data.refreshToken);
        auth.setUserInfo(res.data.admin || res.data.user);
        
        if (loginForm.rememberMe) {
          localStorage.setItem('remembered_username', loginForm.username.trim());
        } else {
          localStorage.removeItem('remembered_username');
        }
        
        ElMessage.success(res.msg || '登录成功，正在跳转...');
        setTimeout(() => {
          router.push({ name: 'Dashboard' });
        }, 1000);
      } else {
        ElMessage.error(res.msg || res.message || '登录失败');
        refreshCaptcha();
      }
    }
  } catch (error) {
    console.error('登录失败:', error);
    
    if (loginFormRef.value) {
      loginFormRef.value.clearValidate();
    }
    
    // 提取字段级错误并设置到表单
    let fieldErrorsFound = false;
    const errorData = error.response?.data || error.data;
    
    if (errorData && typeof errorData === 'object' && loginFormRef.value) {
      for (const key in errorData) {
        if (errorData.hasOwnProperty(key) && Array.isArray(errorData[key]) && errorData[key].length > 0) {
          // 从错误对象中提取message
          const firstError = errorData[key][0];
          const errorMessage = firstError.message || firstError;
          loginFormRef.value.setFieldError(key, errorMessage);
          fieldErrorsFound = true;
        }
      }
    }
    
    // 登录失败刷新验证码
    if (error.response?.status !== 400) {
      refreshCaptcha();
    }
    
    const errorMsg = getErrorMessage(error);
    if (errorMsg && !fieldErrorsFound) {
      ElMessage.error(errorMsg);
    }
  } finally {
    loading.value = false;
  }
}, 300);

// 处理忘记密码
const handleForgotPassword = () => {
  ElMessageBox.prompt('请输入您的邮箱地址，我们将发送重置密码链接。', '忘记密码', {
    confirmButtonText: '发送',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    inputErrorMessage: '邮箱格式不正确'
  }).then(async ({ value }) => {
    try {
      const res = await api.auth.forgotPassword({ email: value });
      if (res.code === 200) {
        ElMessage.success(res.msg || '重置密码邮件已发送，请查收');
      } else {
        ElMessage.error(res.msg || '发送邮件失败');
      }
    } catch (error) {
      console.error('发送重置密码邮件失败:', error);
      const errorMsg = getErrorMessage(error);
      ElMessage.error(errorMsg || '发送邮件失败，请稍后重试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};
</script>

<style scoped>
/* 样式部分不变 */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(79, 70, 229, 0.1) 0%, transparent 50%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #6b7280;
  font-size: 14px;
}

.login-form {
    width: 100%;
  }

  .login-button {
    width: 100%;
    height: 40px;
    font-size: 16px;
    --primary-color: #4f46e5;
    --primary-hover-color: #4338ca;
    
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  .login-button:hover {
    background-color: var(--primary-hover-color);
    border-color: var(--primary-hover-color);
  }

  .captcha-image {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    height: 36px;
    max-width: 100px;
    width: auto;
    cursor: pointer;
    border-radius: 4px;
    object-fit: contain;
  }

  :deep(.el-form-item__content) {
    position: relative;
    margin-bottom: 20px;
  }

:deep(.el-checkbox) {
  margin-right: 0;
}

:deep(.el-link) {
  float: right;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  height: 40px;
}

:deep(.el-input__prefix) {
  left: 12px;
}

:deep(.el-input__inner) {
  height: 40px;
  padding-left: 40px;
}
</style>
