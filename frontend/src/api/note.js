import request from '../utils/request';

// 笔记相关API
export default {
  // 获取笔记列表
  getNoteList(params) {
    return request({
      url: '/notes',
      method: 'get',
      params
    });
  },
  
  // 获取单个笔记详情
  getNoteDetail(id) {
    return request({
      url: `/notes/${id}`,
      method: 'get'
    });
  },
  
  // 创建笔记
  createNote(data) {
    return request({
      url: '/notes',
      method: 'post',
      data
    });
  },
  
  // 更新笔记
  updateNote(id, data) {
    return request({
      url: `/notes/${id}`,
      method: 'put',
      data
    });
  },
  
  // 删除笔记
  deleteNote(id) {
    return request({
      url: `/notes/${id}`,
      method: 'delete'
    });
  },
  
  // 批量删除笔记
  batchDeleteNotes(ids) {
    return request({
      url: '/notes/batch/delete',
      method: 'delete',
      data: { ids }
    });
  },
  
  // 发布/下架笔记
  toggleNoteStatus(id, status) {
    return request({
      url: `/notes/${id}/status`,
      method: 'put',
      data: { status }
    });
  },
  
  // 批量修改笔记状态
  batchUpdateStatus(ids, status) {
    return request({
      url: '/notes/batch/status',
      method: 'put',
      data: { ids, status }
    });
  },

  // 统计笔记数据
  getStatsOverview(params = {}) {
    return request({
      url: '/notes/stats/overview',
      method: 'get',
      params
    });
  },

  // 笔记统计详情
  getStatsDetail(params) {
    return request({
      url: '/notes/stats/detail',
      method: 'get',
      params
    });
  },

  // 批量笔记统计筛选
  batchFilterNotes(data) {
    return request({
      url: '/notes/stats/filter',
      method: 'post',
      data
    });
  },
  
  // 笔记置顶
  top(id, top) {
    return request({
      url: `/notes/${id}/top`,
      method: 'put',
      data: { top }
    });
  },

  // 获取分类笔记统计
  getCategoryStats() {
    return request({
      url: '/notes/stats/category',
      method: 'get'
    });
  },

  // 搜索笔记
  searchNotes(keyword, params = {}) {
    return request({
      url: '/notes/search',
      method: 'get',
      params: {
        keyword,
        ...params
      }
    });
  },

  // 获取热门笔记
  getHotNotes() {
    return request({
      url: '/notes/hot',
      method: 'get'
    });
  },

  // 导入笔记
  importNotes(formData) {
    return request({
      url: '/notes/import',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 导出笔记
  exportNotes(ids) {
    return request({
      url: '/notes/export',
      method: 'get',
      params: { ids },
      responseType: 'blob'
    });
  },

  // 笔记回收站
  getRecycleBin() {
    return request({
      url: '/notes/recycle-bin',
      method: 'get'
    });
  },

  // 恢复笔记
  restoreNote(id) {
    return request({
      url: `/notes/${id}/restore`,
      method: 'put'
    });
  },

  // 清空回收站
  emptyRecycleBin() {
    return request({
      url: '/notes/recycle-bin/empty',
      method: 'delete'
    });
  }
};