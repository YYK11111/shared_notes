import request from '../utils/request';

// 分类相关API
export default {
  // 获取分类列表
  getCategoryList(params = {}) {
    return request({
      url: '/api/categories',
      method: 'get',
      params
    });
  },
  
  // 获取单个分类详情
  getCategoryDetail(id) {
    return request({
      url: `/api/categories/${id}`,
      method: 'get'
    });
  },
  
  // 创建分类
  createCategory(data) {
    return request({
      url: '/api/categories',
      method: 'post',
      data
    });
  },
  
  // 更新分类
  updateCategory(id, data) {
    return request({
      url: `/api/categories/${id}`,
      method: 'put',
      data
    });
  },
  
  // 删除分类
  deleteCategory(id) {
    return request({
      url: `/api/categories/${id}`,
      method: 'delete'
    });
  },
  
  // 批量删除分类（当前后端未实现，使用单条删除模拟）
  batchDeleteCategories(ids) {
    // 后端未实现批量删除，这里模拟实现
    const deletePromises = ids.map(id => this.deleteCategory(id));
    return Promise.all(deletePromises);
  },
  
  // 分类排序
  sortCategories(data) {
    return request({
      url: '/api/categories/sort',
      method: 'put',
      data
    });
  },
  
  // 获取分类统计
  getCategoryStats() {
    return request({
      url: '/api/categories/stats',
      method: 'get'
    });
  },
  
  // 搜索分类
  searchCategories(keyword) {
    return request({
      url: '/api/categories/search',
      method: 'get',
      params: { keyword }
    });
  },
  

  
  // 更新分类状态
  updateCategoryStatus(id, status) {
    return request({
      url: `/api/categories/${id}/status`,
      method: 'put',
      data: { status }
    });
  },
  
  // 批量更新分类状态
  batchUpdateCategoryStatus(ids, status) {
    return request({
      url: '/api/categories/batch-update-status',
      method: 'put',
      data: { ids, status }
    });
  },
  
  // 获取子分类
  getSubCategories(parentId) {
    return request({
      url: `/api/categories/${parentId}/children`,
      method: 'get'
    });
  },
  
  // 导入分类
  importCategories(formData) {
    return request({
      url: '/api/categories/import',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 导出分类
  exportCategories() {
    return request({
      url: '/api/categories/export',
      method: 'get',
      responseType: 'blob'
    });
  }
};