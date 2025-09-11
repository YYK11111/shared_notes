// 文件配置API调用示例

/**
 * 更新单个文件配置
 * @param {string} key - 配置键名
 * @param {*} value - 配置值
 * @param {string} description - 配置描述（可选）
 * @returns {Promise} - 请求结果
 */
export async function updateFileConfig(key, value, description = '') {
  try {
    // 获取token，实际项目中请根据认证方式获取
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch(`/api/config/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        value,
        description
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      console.log(`配置 ${key} 更新成功`);
      return data;
    } else {
      throw new Error(data.msg || '配置更新失败');
    }
  } catch (error) {
    console.error(`更新配置 ${key} 失败:`, error);
    throw error;
  }
}

/**
 * 批量更新文件配置
 * @param {Array} configs - 配置数组 [{key, value, description?}]
 * @returns {Promise} - 请求结果
 */
export async function batchUpdateFileConfigs(configs) {
  try {
    // 获取token，实际项目中请根据认证方式获取
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch('/api/config/batch/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(configs)
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      console.log('批量配置更新成功');
      return data;
    } else {
      throw new Error(data.msg || '批量配置更新失败');
    }
  } catch (error) {
    console.error('批量更新配置失败:', error);
    throw error;
  }
}

/**
 * 获取单个文件配置
 * @param {string} key - 配置键名
 * @returns {Promise} - 配置值
 */
export async function getFileConfig(key) {
  try {
    // 获取token，实际项目中请根据认证方式获取
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch(`/api/config/${key}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      return data.data;
    } else if (data.code === 404) {
      console.warn(`配置 ${key} 不存在`);
      return null;
    } else {
      throw new Error(data.msg || '获取配置失败');
    }
  } catch (error) {
    console.error(`获取配置 ${key} 失败:`, error);
    throw error;
  }
}

/**
 * 获取所有文件配置
 * @returns {Promise} - 配置对象
 */
export async function getAllFileConfigs() {
  try {
    // 获取token，实际项目中请根据认证方式获取
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const response = await fetch('/api/config/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      // 过滤出file相关的配置
      const fileConfigs = {};
      for (const [key, value] of Object.entries(data.data)) {
        if (key.startsWith('file.')) {
          fileConfigs[key] = value;
        }
      }
      
      return fileConfigs;
    } else {
      throw new Error(data.msg || '获取配置失败');
    }
  } catch (error) {
    console.error('获取文件配置失败:', error);
    throw error;
  }
}

/**
 * 设置文件最大大小配置
 * 同时更新MB和字节两个单位的值，保持一致性
 * @param {number} maxSizeMB - 最大大小(MB)
 * @returns {Promise} - 请求结果
 */
export async function setFileMaxSize(maxSizeMB) {
  try {
    // 计算字节值
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // 批量更新两个配置项
    const result = await batchUpdateFileConfigs([
      {
        key: 'file.max_size',
        value: maxSizeMB,
        description: '文件最大大小(MB)'
      },
      {
        key: 'file.max_size_bytes',
        value: maxSizeBytes,
        description: '文件最大大小(字节)'
      }
    ]);
    
    return result;
  } catch (error) {
    console.error('设置文件最大大小失败:', error);
    throw error;
  }
}

/**
 * 设置允许的文件类型
 * @param {Array<string>} allowedTypes - 允许的文件类型数组
 * @returns {Promise} - 请求结果
 */
export async function setFileAllowedTypes(allowedTypes) {
  try {
    // 将数组转换为JSON字符串
    const jsonValue = JSON.stringify(allowedTypes);
    
    const result = await updateFileConfig(
      'file.allowed_types',
      jsonValue,
      '允许的文件类型'
    );
    
    return result;
  } catch (error) {
    console.error('设置允许的文件类型失败:', error);
    throw error;
  }
}

// 示例用法
// 调用示例：更新文件大小为12MB
// setFileMaxSize(12)
//   .then(() => console.log('文件大小设置成功'))
//   .catch(err => console.error('设置失败:', err));

// 调用示例：更新允许的文件类型
// setFileAllowedTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
//   .then(() => console.log('文件类型设置成功'))
//   .catch(err => console.error('设置失败:', err));

// 调用示例：批量更新所有文件配置
// batchUpdateFileConfigs([
//   { key: 'file.max_size', value: 12 },
//   { key: 'file.max_size_bytes', value: 12582912 },
//   { key: 'file.allowed_types', value: JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp']) },
//   { key: 'file.max_count', value: 5 },
//   { key: 'file.enable', value: 1 }
// ])
//   .then(() => console.log('所有配置更新成功'))
//   .catch(err => console.error('更新失败:', err));