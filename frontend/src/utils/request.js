import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useAuthStore } from '@/store/auth'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
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