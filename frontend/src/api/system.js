import request from '../utils/request';

// 系统设置相关API
export default {
  // 获取站点设置
  getSiteSettings() {
    return request({
      url: '/system/settings/site',
      method: 'get'
    });
  },
  
  // 更新站点设置
  updateSiteSettings(data) {
    return request({
      url: '/system/settings/site',
      method: 'put',
      data
    });
  },
  
  // 获取数据库设置
  getDatabaseSettings() {
    return request({
      url: '/system/settings/database',
      method: 'get'
    });
  },
  
  // 更新数据库设置
  updateDatabaseSettings(data) {
    return request({
      url: '/system/settings/database',
      method: 'put',
      data
    });
  },
  
  // 获取搜索设置
  getSearchSettings() {
    return request({
      url: '/system/settings/search',
      method: 'get'
    });
  },
  
  // 更新搜索设置
  updateSearchSettings(data) {
    return request({
      url: '/system/settings/search',
      method: 'put',
      data
    });
  },
  
  // 获取安全设置
  getSecuritySettings() {
    return request({
      url: '/system/settings/security',
      method: 'get'
    });
  },
  
  // 更新安全设置
  updateSecuritySettings(data) {
    return request({
      url: '/system/settings/security',
      method: 'put',
      data
    });
  },
  
  // 备份数据库
  backupDatabase() {
    return request({
      url: '/system/database/backup',
      method: 'post'
    });
  },
  
  // 恢复数据库
  restoreDatabase(file) {
    const formData = new FormData();
    formData.append('backupFile', file);
    
    return request({
      url: '/system/database/restore',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 获取数据库备份列表
  getBackupList() {
    return request({
      url: '/system/database/backups',
      method: 'get'
    });
  },
  
  // 删除备份文件
  deleteBackup(id) {
    return request({
      url: `/system/database/backups/${id}`,
      method: 'delete'
    });
  },
  
  // 获取系统状态
  getSystemStatus() {
    return request({
      url: '/system/status',
      method: 'get'
    });
  }
};