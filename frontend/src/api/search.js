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

// 搜索建议
export const getSearchSuggestions = (params) => {
  return request({
    url: '/search/suggestions',
    method: 'get',
    params
  })
}