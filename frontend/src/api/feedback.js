import request from '@/utils/request'

// 获取反馈列表
export const getFeedbackList = (params) => {
  return request({
    url: '/feedback',
    method: 'get',
    params
  })
}

// 获取反馈详情
export const getFeedbackDetail = (id) => {
  return request({
    url: `/feedback/${id}`,
    method: 'get'
  })
}

// 更新反馈状态
export const updateFeedbackStatus = (id, data) => {
  return request({
    url: `/feedback/${id}/status`,
    method: 'put',
    data
  })
}

// 回复反馈
export const replyFeedback = (id, data) => {
  return request({
    url: `/feedback/${id}/reply`,
    method: 'put',
    data
  })
}

// 删除反馈
export const deleteFeedback = (id) => {
  return request({
    url: `/feedback/${id}`,
    method: 'delete'
  })
}

// 获取反馈统计
export const getFeedbackStats = () => {
  return request({
    url: '/feedback/stats',
    method: 'get'
  })
}