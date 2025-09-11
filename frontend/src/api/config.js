import request from '@/utils/request'

// 获取文件上传配置
export const getFileUploadConfig = () => {
  return request({
    url: '/config/file-upload',
    method: 'get'
  });
};

// 更新文件上传配置
export const updateFileUploadConfig = async (config) => {
  return request({
    url: '/config/file-upload/update',
    method: 'POST',
    data: config
  })
}

// 批量更新系统配置
export const batchUpdateSystemConfigs = async (configs) => {
  return request({
    url: '/config/batch/update',
    method: 'PUT',
    data: configs
  })
}

// 获取单个系统配置
export const getSingleSystemConfig = async (key) => {
  return request({
    url: `/config/${key}`,
    method: 'GET'
  })
}

// 更新单个系统配置
export const updateSingleSystemConfig = async (key, value) => {
  return request({
    url: `/config/${key}`,
    method: 'PUT',
    data: {
      value: value
    }
  })
}

// 获取系统配置
export const getSystemConfigs = () => {
  return request({
    url: '/config',
    method: 'get'
  })
}

// 更新系统配置
export const updateSystemConfigs = (data) => {
  return request({
    url: '/config',
    method: 'put',
    data
  })
}

// 获取搜索配置
export const getSearchConfig = () => {
  return request({
    url: '/search/config',
    method: 'get'
  })
}

// 更新搜索配置
export const updateSearchConfig = (data) => {
  return request({
    url: '/search/config',
    method: 'put',
    data
  })
}



// 获取首页配置
export const getHomeConfig = () => {
  return request({
    url: '/config/home',
    method: 'get'
  })
}

// 更新首页配置
export const updateHomeConfig = (data) => {
  return request({
    url: '/config/home',
    method: 'put',
    data
  })
}

// 系统备份
export const backupSystem = () => {
  return request({
    url: '/config/backup',
    method: 'post'
  })
}

// 获取系统信息
export const getSystemInfo = () => {
  return request({
    url: '/config/system/info',
    method: 'get'
  })
}
