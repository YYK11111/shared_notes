import request from '@/utils/request'

// 获取管理员列表
export const getAdminList = (params) => {
  return request({
    url: '/admin/admins',
    method: 'get',
    params
  })
}

// 创建管理员
export const createAdmin = (data) => {
  return request({
    url: '/admin',
    method: 'post',
    data
  })
}

// 更新管理员信息
export const updateAdmin = (id, data) => {
  return request({
    url: `/admin/${id}`,
    method: 'put',
    data
  })
}

// 更新管理员状态
export const updateAdminStatus = (id, data) => {
  return request({
    url: `/admin/status/${id}`,
    method: 'put',
    data
  })
}

// 删除管理员
export const deleteAdmin = (id) => {
  return request({
    url: `/admin/${id}`,
    method: 'delete'
  })
}

// 重置管理员密码
export const resetAdminPassword = (id, data) => {
  return request({
    url: `/admin/${id}/reset-password`,
    method: 'put',
    data
  })
}

// 获取角色列表
export const getRoleList = () => {
  return request({
    url: '/admin/roles',
    method: 'get'
  })
}

// 创建角色
export const createRole = (data) => {
  return request({
    url: '/admin/roles',
    method: 'post',
    data
  })
}

// 更新角色
export const updateRole = (id, data) => {
  return request({
    url: `/admin/roles/${id}`,
    method: 'put',
    data
  })
}

// 删除角色
export const deleteRole = (id) => {
  return request({
    url: `/admin/roles/${id}`,
    method: 'delete'
  })
}

// 更新角色状态
export const updateRoleStatus = (id, data) => {
  return request({
    url: `/admin/roles/${id}/status`,
    method: 'put',
    data
  })
}

// 获取单个管理员详情
export const getAdminDetail = (id) => {
  return request({
    url: `/admin/${id}`,
    method: 'get'
  })
}

// 获取角色权限
export const getRolePermissions = (roleId) => {
  return request({
    url: `/admin/roles/${roleId}/permissions`,
    method: 'get'
  })
}

// 分配角色权限
export const assignRolePermissions = (roleId, data) => {
  return request({
    url: `/admin/roles/${roleId}/permissions`,
    method: 'put',
    data
  })
}