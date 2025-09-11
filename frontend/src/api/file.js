import request from '@/utils/request'

/**
 * 获取文件二进制数据并转换为可显示的URL
 * @param {string} fileId - 文件ID
 * @returns {Promise<string>} - 返回图片的Data URL
 */
export const getFileDataUrl = async (fileId) => {
  // 调用带/api前缀的接口路径
  const apiUrl = `/api/file/get/${fileId}`;
  
  // 发送GET请求获取文件数据
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'image/*'
    }
  });
  
  // 检查响应状态
  if (!response.ok) {
    throw new Error(`获取文件失败: ${response.status}`);
  }
  
  // 将响应转换为Blob对象
  const blob = await response.blob();
  
  // 创建FileReader读取Blob并转换为Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件转换失败'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 统一文件上传接口
 * @param {File} file - 要上传的文件
 * @param {string} businessType - 业务类型，如'avatar', 'cover', 'note', 'feedback'等
 * @param {Object} options - 其他选项
 * @param {Function} options.onUploadProgress - 上传进度回调函数
 * @returns {Promise} - 返回Promise对象
 */
export const uploadFile = (file, businessType = 'other', options = {}) => {
  // 创建FormData对象
  const formData = new FormData()
  formData.append('file', file)
  
  // 构建请求配置
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
  
  // 添加进度回调
  if (options.onUploadProgress) {
    config.onUploadProgress = options.onUploadProgress
  }
  
  return request({
    url: `/file/upload?businessType=${businessType}`,
    method: 'post',
    data: formData,
    ...config
  })
}

/**
 * 上传头像文件
 * @param {File} file - 头像文件
 * @param {Object} options - 上传选项
 * @returns {Promise} - 返回Promise对象
 */
export const uploadAvatar = (file, options = {}) => {
  return uploadFile(file, 'avatar', options)
}

/**
 * 上传封面文件
 * @param {File} file - 封面文件
 * @param {Object} options - 上传选项
 * @returns {Promise} - 返回Promise对象
 */
export const uploadCover = (file, options = {}) => {
  return uploadFile(file, 'cover', options)
}

/**
 * 上传笔记图片
 * @param {File} file - 笔记图片文件
 * @param {Object} options - 上传选项
 * @returns {Promise} - 返回Promise对象
 */
export const uploadNoteImage = (file, options = {}) => {
  return uploadFile(file, 'note', options)
}

/**
 * 上传反馈图片
 * @param {File} file - 反馈图片文件
 * @param {Object} options - 上传选项
 * @returns {Promise} - 返回Promise对象
 */
export const uploadFeedbackImage = (file, options = {}) => {
  return uploadFile(file, 'feedback', options)
}

/**
 * 获取文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise} - 返回Promise对象
 */
export const getFileInfo = (fileId) => {
  return request({
    url: `/file/info/${fileId}`,
    method: 'get'
  })
}

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise} - 返回Promise对象
 */
export const deleteFile = (fileId) => {
  return request({
    url: `/file/delete/${fileId}`,
    method: 'delete'
  })
}