import request from '../utils/request';

// 日志管理相关API
export default {
  // 获取操作日志列表
  getOperationLogs(params = {}) {
    return request({
      url: '/logs/operation',
      method: 'get',
      params
    });
  },
  
  // 获取登录日志列表
  getLoginLogs(params = {}) {
    return request({
      url: '/logs/login',
      method: 'get',
      params
    });
  },
  
  // 获取错误日志列表
  getErrorLogs(params = {}) {
    return request({
      url: '/logs/error',
      method: 'get',
      params
    });
  },
  
  // 搜索日志
  searchLogs(keyword, params = {}) {
    return request({
      url: '/logs/search',
      method: 'get',
      params: {
        keyword,
        ...params
      }
    });
  },
  
  // 清空日志
  clearLogs(logType) {
    return request({
      url: '/logs/clear',
      method: 'post',
      data: {
        logType
      }
    });
  },
  
  // 导出日志
  exportLogs(logType, params = {}) {
    return request({
      url: '/logs/export',
      method: 'get',
      params: {
        logType,
        ...params
      },
      responseType: 'blob' // 导出文件需要设置响应类型为blob
    });
  },
  
  // 获取日志统计信息
  getLogStatistics(logType) {
    return request({
      url: '/logs/statistics',
      method: 'get',
      params: {
        logType
      }
    });
  },
  
  // 获取系统通知
  getSystemNotifications(params = {}) {
    return request({
      url: '/logs/notifications',
      method: 'get',
      params
    });
  },
  
  // 标记通知为已读
  markNotificationAsRead(id) {
    return request({
      url: `/logs/notifications/${id}/read`,
      method: 'put'
    });
  },
  
  // 批量标记通知为已读
  batchMarkNotificationsAsRead(ids) {
    return request({
      url: '/logs/notifications/batch-read',
      method: 'put',
      data: {
        ids
      }
    });
  }
};