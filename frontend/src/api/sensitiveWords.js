import request from '@/utils/request'

// 添加敏感词
export const addSensitiveWord = (word) => {
  return request({
    url: '/sensitive-words/sensitive-word',
    method: 'post',
    data: { word }
  })
}

// 删除敏感词
export const deleteSensitiveWord = (word) => {
  return request({
    url: `/sensitive-words/sensitive-word/${encodeURIComponent(word)}`,
    method: 'delete'
  })
}

// 获取敏感词列表
export const getSensitiveWords = () => {
  return request({
    url: '/sensitive-words/sensitive-words',
    method: 'get'
  })
}