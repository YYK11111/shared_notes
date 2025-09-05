import request from '@/utils/request'

// 获取前台笔记列表
export const getUserNoteList = (params) => {
  return request({
    url: '/user/notes',
    method: 'get',
    params
  })
}

// 获取前台笔记详情
export const getUserNoteDetail = (id) => {
  return request({
    url: `/user/notes/${id}`,
    method: 'get'
  })
}

// 获取前台分类列表
export const getUserCategoryList = () => {
  return request({
    url: '/user/categories',
    method: 'get'
  })
}

// 获取分类下的笔记
export const getNotesByCategory = (categoryId, params) => {
  return request({
    url: `/user/categories/${categoryId}/notes`,
    method: 'get',
    params
  })
}

// 提交用户反馈
export const submitFeedback = (data) => {
  return request({
    url: '/user/feedback',
    method: 'post',
    data
  })
}

// 获取热门笔记
export const getHotNotes = (params) => {
  return request({
    url: '/user/hot-notes',
    method: 'get',
    params
  })
}

// 获取推荐笔记
export const getRecommendNotes = (params) => {
  return request({
    url: '/user/recommend-notes',
    method: 'get',
    params
  })
}