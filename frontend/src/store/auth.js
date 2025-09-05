import { defineStore } from 'pinia'
import { login, logout, refreshToken, getAccessibleRoutes } from '@/api/auth'

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