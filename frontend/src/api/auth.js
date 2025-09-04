import request from '../utils/request';
import auth from '../utils/auth';

// 认证相关API
export default {
  // 登录
  login(data) {
    return request({
      url: '/api/auth/login',
      method: 'post',
      data
    });
  },
  
  // 登出
  logout() {
    return request({
      url: '/api/auth/logout',
      method: 'post'
    });
  },
  
  // 获取当前登录用户信息
  getCurrentUser() {
    // 从本地存储获取用户信息，避免发送API请求
    return new Promise((resolve) => {
      const userInfo = auth.getUserInfo();
      if (userInfo) {
        resolve({ code: 200, data: userInfo });
      } else {
        // 如果本地没有用户信息，返回空对象
        resolve({ code: 200, data: {} });
      }
    });
  },
  
  // 刷新令牌
  refreshToken() {
    return request({
      url: '/api/auth/refresh',
      method: 'post'
    });
  },
  
  // 重置密码
  resetPassword(data) {
    return request({
      url: '/api/auth/reset-password',
      method: 'post',
      data
    });
  },
  
  // 发送重置密码邮件
  sendResetPasswordEmail(data) {
    return request({
      url: '/api/auth/send-reset-email',
      method: 'post',
      data
    });
  },
  
  // 修改密码
  changePassword(data) {
    return request({
      url: '/api/auth/change-password',
      method: 'post',
      data
    });
  }
};