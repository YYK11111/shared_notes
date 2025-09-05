import request from '@/utils/request'

// 获取笔记列表
export const getNoteList = (params) => {
  return request({
    url: '/notes',
    method: 'get',
    params
  })
}

// 获取笔记详情
export const getNoteDetail = (id) => {
  return request({
    url: `/notes/${id}`,
    method: 'get'
  })
}

// 创建笔记
export const createNote = (data) => {
  return request({
    url: '/notes',
    method: 'post',
    data
  })
}

// 更新笔记
export const updateNote = (id, data) => {
  return request({
    url: `/notes/${id}`,
    method: 'put',
    data
  })
}

// 删除笔记
export const deleteNote = (id) => {
  return request({
    url: `/notes/${id}`,
    method: 'delete'
  })
}

// 上传笔记图片
export const uploadNoteImage = (data) => {
  return request({
    url: '/notes/upload-image',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 置顶/取消置顶笔记
export const setNoteTop = (id, isTop) => {
  return request({
    url: `/notes/${id}/top`,
    method: 'put',
    data: {
      isTop
    }
  })
}

// 设置笔记首页推荐
export const setNoteRecommend = (id, isRecommend) => {
  return request({
    url: `/notes/${id}/recommend`,
    method: 'put',
    data: {
      isRecommend
    }
  })
}

// 获取笔记统计数据
export const getNoteStats = () => {
  return request({
    url: '/notes/stats',
    method: 'get'
  })
}