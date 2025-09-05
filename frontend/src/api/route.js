import request from '@/utils/request'

// 获取所有路由列表
export const getAllRoutes = () => {
  return request({
    url: '/route/all',
    method: 'get'
  })
}

// 获取角色路由权限
export const getRoleRoutePermissions = (roleId) => {
  return request({
    url: `/route/role/${roleId}`,
    method: 'get'
  })
}

// 更新角色路由权限
export const updateRoleRoutePermissions = (roleId, data) => {
  return request({
    url: `/route/role/${roleId}`,
    method: 'put',
    data
  })
}

// 获取用户路由权限
export const getUserRoutePermissions = () => {
  return request({
    url: '/route/user',
    method: 'get'
  })
}

// 刷新路由权限缓存
export const refreshRoutePermissionsCache = () => {
  return request({
    url: '/route/refresh-cache',
    method: 'post'
  })
}

// 导出路由权限配置
export const exportRoutePermissions = () => {
  return request({
    url: '/route/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 导入路由权限配置
export const importRoutePermissions = (data) => {
  return request({
    url: '/route/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}