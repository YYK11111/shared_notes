import request from '@/utils/request'

/**
 * 获取轮播图列表
 * @param {Object} params - 查询参数
 * @param {string} [params.position] - 轮播图位置（可选）
 * @returns {Promise} - 包含轮播图列表的响应
 */
export const getCarousels = (params = {}) => {
  return request({
    url: '/public/carousels',
    method: 'get',
    params,
    timeout: 10000 // 设置10秒超时，确保图片资源加载充足时间
  })
}

// 以下四个接口已在其他模块中实现：
// 1. GET /home - 获取首页数据接口
// 2. GET /categories - 获取分类列表接口
// 3. GET /categories/:categoryId/notes - 获取分类下的笔记列表接口
// 4. GET /notes/:id - 获取笔记详情接口

/**
 * 搜索笔记
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @param {string} [params.sortBy='relevance'] - 排序方式
 * @param {string} [params.categoryIds] - 分类ID（可选）
 * @param {string} [params.timeRange] - 时间范围（可选）
 * @returns {Promise} - 包含搜索结果和分页信息的响应
 */
export const searchNotes = (params) => {
  return request({
    url: '/public/search',
    method: 'get',
    params: {
      keyword: params.keyword,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      sortBy: params.sortBy || 'relevance',
      categoryIds: params.categoryIds,
      timeRange: params.timeRange
    }
  })
}

/**
 * 获取热门搜索词
 * @returns {Promise} - 包含热门搜索词列表的响应
 */
export const getHotSearchWords = () => {
  return request({
    url: '/public/search/hot',
    method: 'get',
    timeout: 5000 // 设置5秒超时，避免长时间等待
  })
}

/**
 * 提交用户反馈
 * @param {Object} data - 反馈数据
 * @param {string} data.type - 反馈类型
 * @param {string} data.content - 反馈内容
 * @param {string} [data.contact] - 联系方式（可选）
 * @returns {Promise} - 提交结果的响应
 */
export const submitFeedback = (data) => {
  return request({
    url: '/public/feedback',
    method: 'post',
    data: {
      type: data.type,
      content: data.content,
      contact: data.contact
    }
  })
}

/**
 * 获取系统配置
 * @returns {Promise} - 包含系统配置的响应
 */
export const getSystemConfigs = () => {
  return request({
    url: '/public/config',
    method: 'get'
  })
}