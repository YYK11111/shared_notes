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

// 获取分类详情
export const getUserCategoryDetail = (categoryId) => {
  return request({
    url: `/user/categories/${categoryId}`,
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

// 获取用户分类列表
export const getUserCategoryList = (params) => {
  return request({
    url: '/user/categories',
    method: 'get',
    params
  })
}

// 喜欢/取消喜欢笔记
export const likeNote = (id, data) => {
  return request({
    url: `/user/notes/${id}/like`,
    method: 'post',
    data
  })
}

// 获取评论列表
export const getComments = (noteId, params) => {
  return request({
    url: `/user/notes/${noteId}/comments`,
    method: 'get',
    params
  })
}

// 提交评论
export const submitComment = (noteId, data) => {
  return request({
    url: `/user/notes/${noteId}/comments`,
    method: 'post',
    data
  })
}

// 点赞/取消点赞评论
export const likeComment = (commentId) => {
  return request({
    url: `/user/comments/${commentId}/like`,
    method: 'post'
  })
}

// 提交回复
export const submitReply = (commentId, data) => {
  return request({
    url: `/user/comments/${commentId}/reply`,
    method: 'post',
    data
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

// 获取相关笔记
export const getRelatedNotes = (noteId, params) => {
  return request({
    url: `/user/notes/${noteId}/related`,
    method: 'get',
    params
  })
}