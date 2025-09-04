/**
 * API服务文件
 * 集中管理所有后端API接口
 */
import request, { cancelAllRequests } from './request';
import errorHandler from './errorHandler';
import { handleAndShowError } from './errorHandler';

// 请求配置默认值
const DEFAULT_REQUEST_CONFIG = {
  showErrorToast: true, // 是否显示错误提示
  showSuccessToast: false, // 是否显示成功提示
  withLoading: false, // 是否显示加载状态
  loadingMessage: '处理中...', // 加载提示消息
  loadingTarget: null // 加载目标DOM选择器
};

/**
 * 包装请求函数，添加统一的错误处理
 * @param {Function} requestFn - 原始请求函数
 * @param {Object} options - 请求配置选项
 * @returns {Function} 包装后的请求函数
 */
function wrapRequest(requestFn, options = {}) {
  const config = { ...DEFAULT_REQUEST_CONFIG, ...options };
  
  return async function(...args) {
    let loadingInstance = null;
    
    try {
      // 如果需要显示加载状态
      if (config.withLoading) {
        // 这里需要根据实际使用的UI库来实现加载状态
        // 由于我们使用Element Plus，可以导入ElLoading
        const { ElLoading } = await import('element-plus');
        loadingInstance = ElLoading.service({
          lock: true,
          text: config.loadingMessage,
          background: 'rgba(0, 0, 0, 0.7)',
          target: config.loadingTarget
        });
      }
      
      // 执行请求
      const response = await requestFn(...args);
      
      // 如果需要显示成功提示
      if (config.showSuccessToast && response?.msg) {
        const { ElMessage } = await import('element-plus');
        ElMessage.success(response.msg);
      }
      
      return response;
    } catch (error) {
      // 处理错误
      return handleAndShowError(error, config.showErrorToast);
    } finally {
      // 关闭加载状态
      if (loadingInstance) {
        loadingInstance.close();
      }
    }
  };
}

// 导入request

/**
 * 登录相关API
 */
const authApi = {
  // 用户登录
  login: wrapRequest((data) => request.post('/api/auth/login', data, { requiresAuth: false }), { withLoading: true, showSuccessToast: true }),
  // 用户登出
  logout: wrapRequest(() => request.post('/api/auth/logout', {}, { requiresAuth: false }), { withLoading: true }),
  // 获取当前用户信息（从本地存储获取，因为后端没有提供/auth/me接口）
  getCurrentUser: wrapRequest(() => {
    return new Promise((resolve, reject) => {
      try {
        // 从本地存储中获取用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        if (userInfo) {
          resolve(userInfo);
        } else {
          // 如果本地没有用户信息，返回一个默认的未登录状态
          resolve({ id: null, username: '', nickname: '', role: '', permissions: [] });
        }
      } catch (error) {
        console.error('获取本地用户信息失败:', error);
        // 出错时也返回一个默认状态，避免应用崩溃
        resolve({ id: null, username: '', nickname: '', role: '', permissions: [] });
      }
    });
  }),
  // 刷新令牌 - 使用Authorization头
  refreshToken: wrapRequest((data) => request.post('/api/auth/refresh', {}, { headers: { 'Authorization': `Bearer ${data.refreshToken}` } }), { showErrorToast: false }),
  // 忘记密码
  forgotPassword: wrapRequest((data) => request.post('/api/auth/forgot-password', data), { withLoading: true, showSuccessToast: true }),
  // 重置密码
  resetPassword: wrapRequest((data) => request.post('/api/auth/reset-password', data), { withLoading: true, showSuccessToast: true }),
  // 获取验证码 - 确保正确获取X-Captcha-Id响应头
  getCaptcha: async () => {
    try {
      console.log('开始调用getCaptcha方法');
      const config = {
        responseType: 'blob',
        requiresAuth: false
      };
      
      // 使用已导入的request对象发起请求
      const response = await request.get('/api/auth/captcha', config);
      
      console.log('验证码请求成功，响应状态:', response.status);
      console.log('完整响应头对象:', response.headers);
      
      // 直接尝试获取X-Captcha-Id响应头（后端明确指定的键名）
      let captchaId = null;
      
      // 方式1：直接从headers对象中获取（axios返回的headers通常是小写的）
      if (response.headers) {
        captchaId = response.headers['x-captcha-id'] || response.headers['X-Captcha-Id'];
        console.log('方式1 - 从headers对象获取验证码ID:', captchaId);
      }
      
      // 如果还没获取到，检查是否有其他方式
      if (!captchaId && typeof response.headers.get === 'function') {
        captchaId = response.headers.get('x-captcha-id') || response.headers.get('X-Captcha-Id');
        console.log('方式2 - 使用get方法获取验证码ID:', captchaId);
      }
      
      // 输出所有响应头键，便于调试
      if (response.headers && typeof response.headers.keys === 'function') {
        const headerKeys = Array.from(response.headers.keys());
        console.log('所有响应头键:', headerKeys);
      }
      
      // 返回一个包含图片数据和验证码ID的对象
      return {
        data: response.data,  // 验证码图片的blob数据
        headers: response.headers,  // 保留原始响应头
        captchaId: captchaId  // 提取出的验证码ID
      };
    } catch (error) {
      console.error('获取验证码异常:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        } : null,
        config: error.config
      });
      throw error;
    }
  }

};

/**
 * 管理员相关API
 */
const adminApi = {
  // 获取管理员列表
  getList: wrapRequest((params) => request.get('/api/admins', { params })),
  // 创建管理员
  create: wrapRequest((data) => request.post('/api/admins', data), { withLoading: true, showSuccessToast: true }),
  // 获取管理员详情
  getDetail: wrapRequest((id) => request.get(`/api/admins/${id}`)),
  // 更新管理员
  update: wrapRequest((id, data) => request.put(`/api/admins/${id}`, data), { withLoading: true, showSuccessToast: true }),
  // 删除管理员
  delete: wrapRequest((id) => request.delete(`/api/admins/${id}`), { withLoading: true, showSuccessToast: true }),
  // 批量删除管理员
  batchDelete: wrapRequest((ids) => request.post('/api/admins/batch-delete', { ids }), { withLoading: true, showSuccessToast: true }),
  // 更新管理员状态
  updateStatus: wrapRequest((id, status) => request.put(`/api/admins/${id}/status`, { status }), { withLoading: true, showSuccessToast: true }),
  // 重置管理员密码
  resetPassword: wrapRequest((id, data) => request.put(`/api/admins/${id}/reset-password`, data), { withLoading: true, showSuccessToast: true }),
  // 获取管理员角色列表
  getRoles: wrapRequest(() => request.get('/api/admin-roles'))
};

/**
 * 笔记相关API
 */
const noteApi = {
  // 获取笔记列表 - 使用完整URL绕过代理
  getList: wrapRequest((params) => request.get('http://localhost:3000/api/notes', { params, baseURL: '' })),
  // 创建笔记
  create: wrapRequest((data) => request.post('/api/notes', data), { withLoading: true, showSuccessToast: true }),
  // 获取笔记详情
  getDetail: wrapRequest((id) => request.get(`/api/notes/${id}`)),
  // 更新笔记
  update: wrapRequest((id, data) => request.put(`/api/notes/${id}`, data), { withLoading: true, showSuccessToast: true }),
  // 删除笔记
  delete: wrapRequest((id) => request.delete(`/api/notes/${id}`), { withLoading: true, showSuccessToast: true }),
  // 批量删除笔记
  batchDelete: wrapRequest((ids) => request.post('/api/notes/batch-delete', { ids }), { withLoading: true, showSuccessToast: true }),
  // 批量修改笔记状态
  batchUpdateStatus: wrapRequest((ids, status) => request.post('/api/notes/batch-update-status', { ids, status }), { withLoading: true, showSuccessToast: true }),
  // 置顶笔记
  top: wrapRequest((id, isTop) => request.put(`/api/notes/${id}/top`, { isTop: isTop }), { withLoading: true, showSuccessToast: true }),
  // 统计笔记数据
  getStatsOverview: wrapRequest((params = {}) => request.get('/api/notes/stats/overview', { params })),
  // 笔记统计详情
  getStatsDetail: wrapRequest((params) => request.get('/api/notes/stats/detail', { params })),
  // 批量笔记统计筛选
  batchFilterNotes: wrapRequest((data) => request.post('/api/notes/stats/filter', data), { withLoading: true, showSuccessToast: true })
};

/**
 * 分类相关API
 */
const categoryApi = {
  // 获取分类列表 - 使用完整URL绕过代理
  getList: wrapRequest((params) => request.get('http://localhost:3000/api/categories', { params, baseURL: '' })),
  // 创建分类
  create: wrapRequest((data) => request.post('/api/categories', data), { withLoading: true, showSuccessToast: true }),
  // 获取分类详情
  getDetail: wrapRequest((id) => request.get(`/api/categories/${id}`)),
  // 更新分类
  update: wrapRequest((id, data) => request.put(`/api/categories/${id}`, data), { withLoading: true, showSuccessToast: true }),
  // 删除分类
  delete: wrapRequest((id) => request.delete(`/api/categories/${id}`), { withLoading: true, showSuccessToast: true }),
  // 批量删除分类
  batchDelete: wrapRequest((ids) => request.post('/api/categories/batch-delete', { ids }), { withLoading: true, showSuccessToast: true }),
  // 更新分类排序
  updateSort: wrapRequest((data) => request.put('/api/categories/sort', data), { withLoading: true, showSuccessToast: true }),
  // 获取分类树
  getTree: wrapRequest(() => request.get('/api/categories')),
  // 获取分类统计
  getStats: wrapRequest(() => request.get('/api/categories/stats'))
};

/**
 * 系统设置相关API
 */
const systemApi = {
  // 获取系统设置
  getSettings: wrapRequest((type) => request.get(`/api/system/settings/${type}`)),
  // 更新系统设置
  updateSettings: wrapRequest((type, data) => request.put(`/api/system/settings/${type}`, data), { withLoading: true, showSuccessToast: true }),
  // 系统信息
  getInfo: wrapRequest(() => request.get('/api/system/info')),
  // 系统状态
  getStatus: wrapRequest(() => request.get('/api/system/status')),
  // 清理缓存
  clearCache: wrapRequest(() => request.post('/api/system/clear-cache'), { withLoading: true, showSuccessToast: true }),
  // 备份数据库
  backupDatabase: wrapRequest(() => request.post('/api/system/backup-database'), { withLoading: true, showSuccessToast: true }),
  // 获取备份列表
  getBackups: wrapRequest(() => request.get('/api/system/backups')),
  // 恢复数据库
  restoreDatabase: wrapRequest((id) => request.post(`/api/system/restore-database/${id}`), { withLoading: true, showSuccessToast: true })
};

/**
 * 日志相关API
 */
const logApi = {
  // 获取操作日志
  getOperationLogs: wrapRequest((params) => request.get('/api/logs/operation', { params })),
  // 获取登录日志
  getLoginLogs: wrapRequest((params) => request.get('/api/logs/login', { params })),
  // 获取错误日志
  getErrorLogs: wrapRequest((params) => request.get('/api/logs/error', { params })),
  // 清空日志
  clearLogs: wrapRequest((type) => request.delete(`/api/logs/${type}/clear`), { withLoading: true, showSuccessToast: true }),
  // 导出日志
  exportLogs: wrapRequest((type, params) => request.get(`/api/logs/${type}/export`, {
    params,
    responseType: 'blob'
  }), { withLoading: true, showSuccessToast: true }),
  // 获取日志统计
  getLogStats: wrapRequest((type, params) => request.get(`/api/logs/${type}/stats`, { params }))
};

/**
 * 反馈相关API
 */
const feedbackApi = {
  // 获取反馈列表
  getList: wrapRequest((params) => request.get('/api/feedbacks', { params })),
  // 获取反馈详情
  getDetail: wrapRequest((id) => request.get(`/api/feedbacks/${id}`)),
  // 更新反馈状态
  updateStatus: wrapRequest((id, status) => request.put(`/api/feedbacks/${id}/status`, { status }), { withLoading: true, showSuccessToast: true }),
  // 回复反馈
  reply: wrapRequest((id, data) => request.post(`/api/feedbacks/${id}/reply`, data), { withLoading: true, showSuccessToast: true }),
  // 删除反馈
  delete: wrapRequest((id) => request.delete(`/api/feedbacks/${id}`), { withLoading: true, showSuccessToast: true }),
  // 批量删除反馈
  batchDelete: wrapRequest((ids) => request.post('/api/feedbacks/batch-delete', { ids }), { withLoading: true, showSuccessToast: true }),
  // 导出反馈
  exportFeedbacks: wrapRequest((params) => request.get('/api/feedbacks/export', {
    params,
    responseType: 'blob'
  }), { withLoading: true, showSuccessToast: true })
};

/**
 * 仪表盘相关API
 */
const dashboardApi = {
  // 获取仪表盘概览数据
  getOverview: wrapRequest(() => request.get('/api/dashboard/overview')),
  // 获取最近活动
  getRecentActivities: wrapRequest((params) => request.get('/api/dashboard/recent-activities', { params })),
  // 获取热门笔记
  getHotNotes: wrapRequest((params) => request.get('/api/dashboard/hot-notes', { params })),
  // 获取用户增长趋势
  getUserGrowthTrend: wrapRequest((params) => request.get('/api/dashboard/user-growth-trend', { params })),
  // 获取内容统计
  getContentStats: wrapRequest(() => request.get('/api/dashboard/content-stats'))
};

// 整合所有API模块
const api = {
  auth: authApi,
  admin: adminApi,
  note: {
    ...noteApi,
    // 上传图片（编辑器内）
    uploadImage: wrapRequest((formData) => request.post('/api/notes/upload-image', formData), { withLoading: true })
  },
  category: categoryApi,
  system: systemApi,
  log: logApi,
  feedback: feedbackApi,
  dashboard: dashboardApi,
  
  // 工具方法
  utils: {
    // 取消所有请求
    cancelAllRequests
  }
};

// 导出API对象
export default api;

// 导出Vue插件，用于全局挂载API
export const ApiPlugin = {
  install(app) {
    // 挂载到app实例上
    app.config.globalProperties.$api = api;
    // 挂载到window上，方便在非组件环境下使用
    window.$api = api;
  }
};

// 导出其他工具函数
export { wrapRequest, DEFAULT_REQUEST_CONFIG };