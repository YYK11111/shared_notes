<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">登录系统</h2>
      </template>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名">
            <template #prefix><el-icon>
                <User />
              </el-icon></template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix><el-icon>
                <Lock />
              </el-icon></template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <el-input v-model="loginForm.captcha" placeholder="请输入验证码">
            <template #prefix><el-icon>
                <Key />
              </el-icon></template>
          </el-input>
          <div class="captcha-image-container">
            <div class="captcha-wrapper">
              <img 
                :src="captchaImage" 
                alt="验证码" 
                class="captcha-image"
                @click="fetchCaptcha"
              />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Refresh } from '@element-plus/icons-vue'
import { login, getCaptcha } from '@/api/auth'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)
const captchaImage = ref('')
const captchaLoading = ref(false)
const captchaStatus = ref('') // '' | 'loading' | 'error'

// 登录表单数据
const loginForm = ref({
  username: '',
  password: '',
  captcha: '',
  captchaToken: ''
})

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
}

// 获取验证码
const fetchCaptcha = async () => {
  try {
    // 清除之前可能存在的URL，避免内存泄漏
    if (captchaImage.value && captchaImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(captchaImage.value)
    }
    
    // 设置加载状态
    captchaStatus.value = 'loading'
    captchaLoading.value = true
    captchaImage.value = ''
    
    // 由于API设置了responseType: 'blob'，响应拦截器直接返回了完整的response对象
    const res = await getCaptcha()
    
    // 直接使用res.data作为Blob对象（根据auth.js的设置，res.data应该已经是Blob类型）
    captchaImage.value = URL.createObjectURL(res.data)
    
    // 获取并保存验证码ID（从X-Captcha-Id响应头中）
    const captchaId = res.headers['x-captcha-id'] || res.headers['X-Captcha-Id'] || ''
    loginForm.value.captchaToken = captchaId
    
    // 只在开发环境输出调试信息
    if (import.meta.env.DEV) {
      console.log('验证码获取成功')
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    captchaStatus.value = 'error'
    ElMessage.error('获取验证码失败，请点击图片重试')
  } finally {
    captchaLoading.value = false
  }
}

// 处理验证码图片加载失败
const handleCaptchaError = () => {
  // 只有当URL不为空时才显示错误，避免初始加载时的误报
  if (captchaImage.value) {
    console.warn('验证码图片加载失败，正在重试...')
    // 自动重试加载验证码
    setTimeout(() => {
      fetchCaptcha()
    }, 500)
  }
}

// 处理登录
const handleLogin = async () => {
  try {
    // 验证表单
    await loginFormRef.value.validate()

    loading.value = true

    // 调用真实的登录API
    // 注意：根据后端API文档，需要将captchaToken重命名为captchaId
    const loginParams = {
      ...loginForm.value,
      captchaId: loginForm.value.captchaToken
    }
    const res = await login(loginParams)

    // 检查是否登录成功
    if (res.code === 200 && res.data && res.data.token) {
      // 登录成功，保存token
      localStorage.setItem('token', res.data.token)
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken)
      }

      // 使用后端返回的message信息，而不是硬编码
      ElMessage.success(res.msg || res.message || '登录成功')
      // 登录成功后跳转到管理后台首页，触发路由权限获取
      router.push('/admin')
    } else if (res.code !== 200) {
      // 登录失败，有明确的错误码和错误信息
      // 直接抛出包含错误信息的Error对象，进入catch块处理
      throw {
        message: res.msg || res.message || '登录失败'
      }
    } else {
      // 其他情况，返回数据格式可能有问题
      throw new Error('登录失败，返回数据格式错误')
    }
  } catch (error) {
    console.error('登录失败:', error)
    // 检查是否是表单验证错误或包含字段级别的错误信息
    if (error.name === 'ValidateError' || error.captcha || error.username || error.password) {
      // 检查并显示各字段的具体错误信息
      const errorMessages = []
      
      // 处理验证码错误
      if (error.captcha && error.captcha.length > 0) {
        errorMessages.push(error.captcha[0].message)
      }
      
      // 处理用户名错误
      if (error.username && error.username.length > 0) {
        errorMessages.push(error.username[0].message)
      }
      
      // 处理密码错误
      if (error.password && error.password.length > 0) {
        errorMessages.push(error.password[0].message)
      }
      
      // 如果没有具体字段错误，检查是否是必填项未填写
      if (errorMessages.length === 0) {
        let errorFields = []
        
        if (!loginForm.value.username) {
          errorFields.push('用户名')
        }
        if (!loginForm.value.password) {
          errorFields.push('密码')
        }
        if (!loginForm.value.captcha) {
          errorFields.push('验证码')
        }
        
        if (errorFields.length > 0) {
          errorMessages.push(`请输入${errorFields.join('、')}`)
        }
      }
      
      // 显示告警消息，而不是错误消息
      if (errorMessages.length > 0) {
        ElMessage.warning(errorMessages.join('；'))
      }
    } else {
      // 更健壮的错误处理，确保能够获取后端返回的message信息
      let errorMessage = '登录失败，请稍后重试'
      
      // 检查错误对象的不同结构，尝试获取具体的错误信息
      // 1. 检查response.data中的msg字段（后端返回的标准格式）
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg
      }
      // 2. 检查response.data中的message字段
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      // 3. 检查error对象本身的msg字段（request.js返回的格式）
      else if (error.msg) {
        errorMessage = error.msg
      }
      // 4. 检查error对象本身的message字段
      else if (error.message) {
        errorMessage = error.message
      }
      // 5. 检查error.data中的msg字段
      else if (error.data?.msg) {
        errorMessage = error.data.msg
      }
      // 6. 检查error.data中的message字段
      else if (error.data?.message) {
        errorMessage = error.data.message
      }
      // 7. 如果error本身是字符串
      else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // 显示错误消息
      ElMessage.error(errorMessage)
      
      // 重新获取验证码
      fetchCaptcha()
    }
  } finally {
    loading.value = false
  }
}

// 页面加载时获取验证码
onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  max-width: 90%;
}

.login-title {
  text-align: center;
  font-size: 24px;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
}

.el-form-item__label {
  padding-right: 10px !important;
}
  .login-card {
    width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    overflow: hidden;
  }

  .login-title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 30px;
    color: #1890ff;
  }

  .login-form {
    padding: 0 20px 20px;
  }

  .login-button {
    width: 100%;
    font-size: 16px;
    padding: 12px 0;
    border-radius: 6px;
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    border: none;
  }

  .login-button:hover {
    background: linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%);
  }

  .login-button:active {
    background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
  }

  .captcha-image-container {
    position: absolute;
    right: 10px; /* 移到输入框右侧 */
    top: 50%;
    transform: translateY(-50%);
    height: 32px;
    display: flex;
    align-items: center;
  }

  .captcha-wrapper {
    position: relative;
    display: inline-block;
    height: 100%;
    line-height: 0;
  }

  .captcha-image {
    width: 100px;
    height: 32px;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    object-fit: contain;
    vertical-align: middle;
    padding: 0;
    margin: 0;
    line-height: 0;
    background-color: #f5f7fa;
  }

  .el-form-item__label {
    padding-right: 10px !important;
    color: #606266;
  }

  .el-input__wrapper {
    border-radius: 4px;
    height: 40px;
    padding-right: 120px; /* 为验证码图片留出空间 */
  }

  .el-input__wrapper input {
    height: 40px;
    line-height: 40px;
  }

  /* 输入框聚焦效果 */
  .el-input__wrapper.is-focus {
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

</style>