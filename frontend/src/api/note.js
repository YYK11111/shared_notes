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

// 上传笔记图片 - 重定向到新的统一文件上传API
export const uploadNoteImage = (data) => {
  // 兼容旧的调用方式
  if (data instanceof FormData) {
    // 获取文件对象
    const file = data.get('image')
    if (file instanceof File) {
      // 导入新的文件上传API
      const { uploadNoteImage: newUploadNoteImage } = require('./file')
      return newUploadNoteImage(file)
    }
  } else if (data instanceof File) {
    // 直接调用新API
    const { uploadNoteImage: newUploadNoteImage } = require('./file')
    return newUploadNoteImage(data)
  }
  
  // 如果格式不符合预期，仍然使用旧的接口作为后备
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

// 切换笔记首页推荐状态
export const toggleNoteHomeRecommend = (id, isHomeRecommend) => {
  return request({
    url: `/notes/${id}/home-recommend`,
    method: 'put',
    data: {
      is_home_recommend: isHomeRecommend
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

// 切换笔记置顶状态
export const toggleNoteTop = (id, top, topExpireTime = null) => {
  return request({
    url: `/notes/${id}/top`,
    method: 'put',
    data: {
      top,
      top_expire_time: topExpireTime
    }
  })
}

// 批量修改笔记状态
export const batchUpdateNoteStatus = (ids, status) => {
  return request({
    url: '/notes/batch-update-status',
    method: 'post',
    data: {
      ids,
      status
    }
  })
}

// 审核通过笔记
export const approveNote = (id) => {
  return request({
    url: `/notes/${id}/approve`,
    method: 'put'
  })
}

// 拒绝笔记审核
export const rejectNote = (id, data) => {
  return request({
    url: `/notes/${id}/reject`,
    method: 'put',
    data
  })
}

// 获取笔记预览
export const getNotePreview = (noteId) => {
  return request({
    url: `/notes/${noteId}/preview`,
    method: 'get',
    // 确保超时时间足够长，以支持长笔记处理
    timeout: 30000
  }).then(response => {
    // 统一处理响应格式，确保前端组件能正确解析
    if (response && response.code === 200) {
      // 直接返回处理后的数据
      return response;
    } else {
      // 处理错误情况
      throw new Error(response?.msg || '获取笔记预览失败');
    }
  }).catch(error => {
    // 记录错误信息
    console.error('获取笔记预览API错误:', error);
    // 重新抛出错误，让调用方处理
    throw error;
  });
}

// 切换笔记本周精选状态
export const toggleNoteWeekSelection = (id, isWeekSelection) => {
  return request({
    url: `/notes/${id}/week-selection`,
    method: 'put',
    data: {
      is_week_selection: isWeekSelection
    }
  })
}

// 切换笔记本月推荐状态
export const toggleNoteMonthRecommend = (id, isMonthRecommend) => {
  return request({
    url: `/notes/${id}/month-recommend`,
    method: 'put',
    data: {
      is_month_recommend: isMonthRecommend
    }
  })
}