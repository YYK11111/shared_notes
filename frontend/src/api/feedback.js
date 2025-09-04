import request from '../utils/request';

// 反馈管理相关API
export default {
  // 获取反馈列表
  getFeedbackList(params = {}) {
    return request({
      url: '/feedback',
      method: 'get',
      params
    });
  },
  
  // 获取单个反馈详情
  getFeedbackDetail(id) {
    return request({
      url: `/feedback/${id}`,
      method: 'get'
    });
  },
  
  // 回复反馈
  replyFeedback(id, data) {
    return request({
      url: `/feedback/${id}/reply`,
      method: 'post',
      data
    });
  },
  
  // 标记反馈为已处理
  markFeedbackAsProcessed(id) {
    return request({
      url: `/feedback/${id}/process`,
      method: 'put'
    });
  },
  
  // 批量标记反馈为已处理
  batchMarkFeedbackAsProcessed(ids) {
    return request({
      url: '/feedback/batch-process',
      method: 'put',
      data: {
        ids
      }
    });
  },
  
  // 删除反馈
  deleteFeedback(id) {
    return request({
      url: `/feedback/${id}`,
      method: 'delete'
    });
  },
  
  // 批量删除反馈
  batchDeleteFeedback(ids) {
    return request({
      url: '/feedback/batch-delete',
      method: 'post',
      data: { ids }
    });
  },
  
  // 搜索反馈
  searchFeedback(keyword, params = {}) {
    return request({
      url: '/feedback/search',
      method: 'get',
      params: {
        keyword,
        ...params
      }
    });
  },
  
  // 获取反馈统计信息
  getFeedbackStatistics() {
    return request({
      url: '/feedback/statistics',
      method: 'get'
    });
  },
  
  // 导出反馈
  exportFeedback(params = {}) {
    return request({
      url: '/feedback/export',
      method: 'get',
      params,
      responseType: 'blob' // 导出文件需要设置响应类型为blob
    });
  }
};