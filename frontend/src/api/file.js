import request from '@/utils/request'

/**
 * 获取文件二进制数据并转换为可显示的URL
 * @param {string} fileId - 文件ID
 * @returns {Promise<string>} - 返回图片的Data URL
 */
export const getFileDataUrl = async (fileId) => {
  // 设置响应类型为blob以便处理二进制数据
  const config = {
    responseType: 'blob',
    headers: {
      'Accept': 'image/*'
    }
  };
  
  // 使用request方法发送GET请求获取文件数据
  // 当responseType为blob时，request返回的是整个response对象
  // 使用绝对路径以确保正确的请求路径
  const response = await request({
    url: `/file/get/${fileId}`,
    method: 'get',
    ...config
  });
  
  // 从response对象中获取blob数据
  const blob = response.data;
  
  // 创建FileReader读取Blob并转换为Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件转换失败'));
    reader.readAsDataURL(blob);
  });
}

/** 
 * 获取文件二进制数据并通过URL.createObjectURL生成可显示的临时URL 
 * @param {string} fileId - 文件ID 
 * @returns {Promise<{url: string, revoke: () => void}>} - 返回图片临时URL及释放函数 
 */ 
export const getFileObjectUrl = async (fileId) => {
  // 1. 校验fileId参数有效性
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('无效的文件ID');
  }

  // 2. 设置请求配置（含超时）
  const config = {
    responseType: 'blob',
    headers: {
      'Accept': 'image/*'
    },
    timeout: 10000, // 10秒超时
  };

  try {
    // 3. 发送请求获取文件Blob
    const response = await request({
      url: `/file/get/${fileId}`,
      method: 'get',
      ...config
    });

    // 4. 校验HTTP响应状态
    if (!response) {
      throw new Error('获取文件失败: 响应为空');
    }
    
    // 根据response的结构进行不同的状态校验
    // 如果是Fetch API的Response对象
    if (response.status !== undefined) {
      if (response.status >= 200 && response.status < 300) {
        // 请求成功
      } else {
        throw new Error(`获取文件失败: HTTP状态码 ${response.status} ${response.statusText || ''}`);
      }
    } 
    // 如果是自定义响应对象
    else if (response.code !== undefined) {
      if (response.code !== 200) {
        throw new Error(`获取文件失败: 错误码 ${response.code} ${response.message || ''}`);
      }
    }

    // 5. 校验Blob有效性和类型
    const blob = response.data;
    if (!(blob instanceof Blob)) {
      throw new Error('返回的数据不是有效的Blob对象');
    }
    if (!blob.type.startsWith('image/')) {
      throw new Error(`文件类型错误: 预期图片类型，实际为${blob.type}`);
    }

    // 6. 生成临时URL并返回（附带释放函数）
    const url = URL.createObjectURL(blob);
    return {
      url,
      // 提供主动释放URL的方法，避免内存泄漏
      revoke: () => URL.revokeObjectURL(url)
    };
  } catch (err) {
    console.error(`获取文件临时URL失败 (fileId: ${fileId}):`, err);
    throw new Error(`获取图片失败: ${err.message}`);
  }
};

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
 * 上传反馈图片
 * @param {File} file - 反馈图片文件
 * @param {Object} options - 上传选项
 * @returns {Promise} - 返回Promise对象
 */
export const uploadCarouselImage = (file, options = {}) => {
  return uploadFile(file, 'carousel', options)
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

/**
 * 建立文件与资源的关联
 * @param {string} fileId - 文件ID
 * @param {string} resourceId - 资源ID
 * @param {string} resourceType - 资源类型（如: note, user, feedback等）
 * @returns {Promise} - 返回Promise对象
 */
export const linkFileResource = (fileId, resourceId, resourceType) => {
  return request({
    url: '/file/link',
    method: 'post',
    data: {
      fileId,
      resourceId,
      resourceType
    }
  })
}

/**
 * 解除文件与资源的关联
 * @param {string} fileId - 文件ID
 * @param {string} resourceId - 资源ID
 * @param {string} resourceType - 资源类型
 * @returns {Promise} - 返回Promise对象
 */
export const unlinkFileResource = (fileId, resourceId, resourceType) => {
  return request({
    url: `/file/unlink?fileId=${fileId}&resourceId=${resourceId}&resourceType=${resourceType}`,
    method: 'delete'
  })
}

/**
 * 获取与资源关联的文件列表
 * @param {string} resourceId - 资源ID
 * @param {string} resourceType - 资源类型
 * @returns {Promise} - 返回Promise对象
 */
export const getFilesByResource = (resourceId, resourceType) => {
  return request({
    url: `/file/list-by-resource?resourceId=${resourceId}&resourceType=${resourceType}`,
    method: 'get'
  })
}

/**
 * 获取与文件关联的资源列表
 * @param {string} fileId - 文件ID
 * @returns {Promise} - 返回Promise对象
 */
export const getResourcesByFile = (fileId) => {
  return request({
    url: `/file/list-by-file/${fileId}`,
    method: 'get'
  })
}