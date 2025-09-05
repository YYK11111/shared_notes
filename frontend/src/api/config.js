import request from '@/utils/request'

// 获取系统配置
export const getSystemConfig = () => {
  return request({
    url: '/config',
    method: 'get'
  })
}

// 更新系统配置
export const updateSystemConfig = (data) => {
  return request({
    url: '/config',
    method: 'put',
    data
  })
}

// 获取搜索配置
export const getSearchConfig = () => {
  return request({
    url: '/config/search',
    method: 'get'
  })
}

// 更新搜索配置
export const updateSearchConfig = (data) => {
  return request({
    url: '/config/search',
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

// 系统恢复
export const restoreSystem = (data) => {
  return request({
    url: '/config/restore',
    method: 'post',
    data
  })
}

// 获取备份列表
export const getBackupList = () => {
  return request({
    url: '/config/backups',
    method: 'get'
  })
}