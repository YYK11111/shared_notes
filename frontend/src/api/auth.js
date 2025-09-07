
import request from '@/utils/request'

// 登录
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 登出
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 刷新Token
export const refreshToken = (data) => {
  return request({
    url: '/auth/refresh',
    method: 'post',
    data
  })
}

// 获取可访问路由
export const getAccessibleRoutes = () => {
  return request({
    url: '/route-permissions/accessible-routes',
    method: 'get'
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/auth/info',
    method: 'get'
  })
}

// 获取验证码
export const getCaptcha = () => {
  return request({
    url: '/auth/captcha',
    method: 'get',
    responseType: 'blob'
  })
}