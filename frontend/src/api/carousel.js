import request from '@/utils/request'

// 获取轮播图列表
export const getCarouselList = (params) => {
  return request({
    url: '/admin/carousels',
    method: 'get',
    params
  })
}

// 创建轮播图
export const createCarousel = (data) => {
  return request({
    url: '/admin/carousels',
    method: 'post',
    data
  })
}

// 获取轮播图详情
export const getCarouselDetail = (id) => {
  return request({
    url: `/admin/carousels/${id}`,
    method: 'get'
  })
}

// 更新轮播图
export const updateCarousel = (id, data) => {
  return request({
    url: `/admin/carousels/${id}`,
    method: 'put',
    data
  })
}

// 删除轮播图
export const deleteCarousel = (id) => {
  return request({
    url: `/admin/carousels/${id}`,
    method: 'delete'
  })
}

// 更新轮播图状态
export const updateCarouselStatus = (id, data) => {
  // 使用专门的状态更新接口
  return request({
    url: `/admin/carousels/${id}/status`,
    method: 'patch',
    data: {
      status: data.status
    }
  })
}