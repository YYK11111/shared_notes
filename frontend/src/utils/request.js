
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
    
    // 输出接口调用信息到控制台
    console.log('==================== API REQUEST ====================')
    console.log('请求类型:', config.method?.toUpperCase())
    console.log('接口路径:', config.url)
    if (config.params) {
      console.log('URL参数:', config.params)
    }
    if (config.data) {
      console.log('请求数据:', config.data)
    }
    console.log('====================================================\n')
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 输出响应信息到控制台
    console.log('==================== API RESPONSE ====================')
    console.log('请求类型:', response.config.method?.toUpperCase())
    console.log('接口路径:', response.config.url)
    console.log('响应数据:', response.data)
    console.log('====================================================\n')
    
    // 对于blob类型的响应，直接返回response对象
    if (response.config.responseType === 'blob') {
      return response
    }
    
    const { code, message } = response.data
    
    // 处理业务错误
    if (code !== 200) {
      ElMessage.error(message || '操作失败')
      return Promise.reject(new Error(message || 'Error'))
    }
    
    return response.data
  },
  async (error) => {
    // 输出错误响应信息到控制台
    console.error('==================== API ERROR ====================')
    console.error('请求类型:', error.config?.method?.toUpperCase())
    console.error('接口路径:', error.config?.url)
    console.error('错误信息:', error.message)
    console.error('错误详情:', error.response?.data || error)
    console.error('====================================================\n')
    const authStore = useAuthStore()
    const originalRequest = error.config
    
    // 处理429错误（请求频率过高）
    if (error.response?.status === 429) {
      ElMessage.error('请求过于频繁，请稍后再试')
      return Promise.reject(error)
    }
    
    // Token过期处理
    // 注意：需要排除登录接口的401错误，避免密码错误时页面刷新
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
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
    
    // 处理登录接口的错误响应
    // 登录接口虽然返回401状态码，但它包含了具体的业务错误信息，应该作为正常响应处理
    if (originalRequest?.url?.includes('/auth/login') && error.response?.data) {
      // 返回包含错误信息的对象，而不是拒绝Promise
      // 这样前端组件可以正确处理登录失败的情况
      return {
        code: error.response.data.code || 401,
        message: error.response.data.msg || error.response.data.message || '登录失败',
        data: null
      }
    }
    
    // 其他错误处理
    ElMessage.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request