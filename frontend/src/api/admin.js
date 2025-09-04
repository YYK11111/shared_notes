import request from '../utils/request';

// 管理员相关API
export default {
  // 获取管理员列表
  getAdminList(params) {
    return request({
      url: '/api/admins',
      method: 'get',
      params
    });
  },
  
  // 获取单个管理员详情
  getAdminDetail(id) {
    return request({
      url: `/api/admins/${id}`,
      method: 'get'
    });
  },
  
  // 创建管理员
  createAdmin(data) {
    return request({
      url: '/api/admins',
      method: 'post',
      data
    });
  },
  
  // 更新管理员
  updateAdmin(id, data) {
    return request({
      url: `/api/admins/${id}`,
      method: 'put',
      data
    });
  },
  
  // 删除管理员
  deleteAdmin(id) {
    return request({
      url: `/api/admins/${id}`,
      method: 'delete'
    });
  },
  
  // 批量删除管理员
  batchDeleteAdmins(ids) {
    return request({
      url: '/api/admins/batch-delete',
      method: 'post',
      data: { ids }
    });
  },
  
  // 启用/禁用管理员
  toggleAdminStatus(id, status) {
    return request({
      url: `/api/admins/${id}/status`,
      method: 'put',
      data: { status }
    });
  },
  
  // 批量启用/禁用管理员
  batchToggleAdminStatus(ids, status) {
    return request({
      url: '/api/admins/batch-status',
      method: 'put',
      data: { ids, status }
    });
  },
  
  // 重置管理员密码
  resetAdminPassword(id) {
    return request({
      url: `/api/admins/${id}/reset-password`,
      method: 'post'
    });
  },
  
  // 获取角色列表
  getRoleList() {
    return request({
      url: '/api/admin-roles',
      method: 'get'
    });
  }
};