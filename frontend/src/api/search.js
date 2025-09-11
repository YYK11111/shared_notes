import request from '@/utils/request'

// 搜索笔记
export const searchNotes = (params) => {
  return request({
    url: '/search/notes',
    method: 'get',
    params
  })
}

// 获取热门搜索词
export const getHotSearchWords = (params) => {
  return request({
    url: '/search/hot-words',
    method: 'get',
    params
  })
}

// 兼容 SearchResult.vue 中导入的函数名
export const getHotSearchKeywords = getHotSearchWords

// 获取搜索历史
export const getSearchHistory = () => {
  return request({
    url: '/search/history',
    method: 'get'
  })
}

// 清除搜索历史
export const clearSearchHistory = () => {
  return request({
    url: '/search/history',
    method: 'delete'
  })
}

// 添加搜索词点击记录
export const addSearchClickRecord = (data) => {
  return request({
    url: '/search/click',
    method: 'post',
    data
  })
}

// 兼容 SearchResult.vue 中导入的函数名
export const addSearchHistory = addSearchClickRecord

// 搜索建议
export const getSearchSuggestions = (params) => {
  return request({
    url: '/search/suggestions',
    method: 'get',
    params
  })
}

// ---------------------------- 搜索管理功能 ----------------------------

// 重建搜索索引
export const rebuildSearchIndex = () => {
  return request({
    url: '/search/index/rebuild',
    method: 'post'
  })
}

// 获取搜索索引状态
export const getSearchIndexStatus = () => {
  return request({
    url: '/search/index/status',
    method: 'get'
  })
}

// 获取搜索屏蔽列表
export const getBlockedNotes = (params) => {
  return request({
    url: '/search/blocked',
    method: 'get',
    params
  })
}

// 添加笔记到搜索屏蔽列表
export const addBlockedNote = (data) => {
  return request({
    url: '/search/blocked/add',
    method: 'post',
    data
  })
}

// 从搜索屏蔽列表移除笔记
export const removeBlockedNote = (data) => {
  return request({
    url: '/search/blocked/remove',
    method: 'post',
    data
  })
}

// 获取搜索日志
export const getSearchLogs = (params) => {
  return request({
    url: '/search/logs',
    method: 'get',
    params
  })
}

// 获取热门搜索词（管理后台用）
export const getTrendingSearchWords = (params) => {
  return request({
    url: '/search/trending',
    method: 'get',
    params
  })
}