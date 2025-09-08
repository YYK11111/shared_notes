import request from '@/utils/request'

// 获取分类列表
export const getCategoryList = (params) => {
  return request({
    url: '/categories',
    method: 'get',
    params
  })
}

// 获取分类详情
export const getCategoryDetail = (id) => {
  return request({
    url: `/categories/${id}`,
    method: 'get'
  })
}

// 创建分类
export const createCategory = (data) => {
  return request({
    url: '/categories',
    method: 'post',
    data
  })
}

// 更新分类
export const updateCategory = (id, data) => {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除分类
export const deleteCategory = (id) => {
  return request({
    url: `/categories/${id}`,
    method: 'delete'
  })
}

// 获取分类笔记数量统计
export const getCategoryStats = () => {
  return request({
    url: '/categories/stats/note-count',
    method: 'get'
  })
}

// 分类排序
export const sortCategories = (data) => {
  return request({
    url: '/categories/sort',
    method: 'put',
    data
  })
}

// 更新分类状态
export const updateCategoryStatus = (id, data) => {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}