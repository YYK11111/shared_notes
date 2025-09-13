# 笔记管理 API 文档

## 概述
本模块包含笔记的创建、查询、更新、删除等操作接口，支持笔记的分类管理、封面上传等功能。

## 接口列表

### 1. 获取笔记列表

**路径**: `GET /api/notes`

**功能**: 获取笔记列表，支持分页和筛选

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为10
keyword: string, // 关键词搜索（标题或内容）
categoryId: number, // 分类ID筛选
category_id: number, // 分类ID筛选（兼容旧版）
status: number, // 状态筛选（1: 启用, 0: 禁用）
startDate: string, // 开始日期筛选
endDate: string, // 结束日期筛选
parentCategoryId: number, // 父分类ID筛选
isHomeRecommend: number, // 是否首页推荐筛选
isTop: number, // 是否置顶筛选
isWeekSelection: number, // 是否本周精选筛选
isMonthRecommend: number // 是否本月推荐筛选
```

**返回**: 
```json
{
  "code": 200,
  "msg": "获取笔记列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "title": "string",
        "content": "string",
        "status": "number",
        "cover_image": "string",
        "is_top": "number",
        "top_expire_time": "string",
        "is_home_recommend": "number",
        "is_week_selection": "number",
        "is_month_recommend": "number",
        "created_at": "string",
        "updated_at": "string",
        "category_names": "string",
        "category_ids": "string",
        "categories": [
          {"id": "number", "name": "string"}
        ],
        "tag_names": [],
        "tag_ids": []
      }
    ],
    "total": "number",
    "page": "number",
    "pageSize": "number",
    "totalPages": "number"
  }
}
```

---

### 2. 获取笔记详情

**路径**: `GET /api/notes/:id/detail`

**功能**: 获取单条笔记的详细信息

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取笔记详情成功",
  "data": {
    "id": "number",
    "title": "string",
    "content": "string",
    "status": "number",
    "cover_image": "string",
    "is_top": "number",
    "top_expire_time": "string",
    "is_home_recommend": "number",
    "is_week_selection": "number",
    "is_month_recommend": "number",
    "created_at": "string",
    "updated_at": "string",
    "categories": [
      {"id": "number", "name": "string"}
    ],
    "tags": []
  }
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 获取笔记详情失败

---

### 3. 获取笔记详情（兼容旧版）

**路径**: `GET /api/notes/:id`

**功能**: 兼容旧版，重定向到`/api/notes/:id/detail`接口

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 307重定向到`/api/notes/:id/detail`

---

### 4. 创建笔记

**路径**: `POST /api/notes`

**功能**: 创建新的笔记

**参数**: 
```json
{
  "title": "string", // 笔记标题
  "content": "string", // 笔记内容
  "status": "number", // 状态（1: 启用, 0: 禁用）
  "categoryIds": ["number"], // 分类ID数组
  "tagIds": ["number"], // 标签ID数组（当前不处理）
  "cover_image": "string", // 封面图片文件ID
  "isTop": "number", // 是否置顶（1: 是, 0: 否）
  "topExpireTime": "string", // 置顶过期时间（可选，格式：YYYY-MM-DD HH:mm:ss）
  "isHomeRecommend": "number", // 是否首页推荐（1: 是, 0: 否）
  "isWeekSelection": "number", // 是否本周精选（1: 是, 0: 否）
  "isMonthRecommend": "number" // 是否本月推荐（1: 是, 0: 否）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "创建笔记成功",
  "data": {
    "noteId": "number"
  }
}
```

**错误码**: 
- 400: 标题或内容不能为空
- 400: 分类ID格式不正确
- 500: 创建笔记失败

---

### 5. 更新笔记

**路径**: `PUT /api/notes/:id`

**功能**: 更新现有笔记

**参数**: 
```json
{
  "title": "string", // 笔记标题
  "content": "string", // 笔记内容
  "status": "number", // 状态（1: 启用, 0: 禁用）
  "categoryIds": ["number"], // 分类ID数组
  "tagIds": ["number"], // 标签ID数组（当前不处理）
  "cover_image": "string", // 封面图片文件ID
  "isTop": "number", // 是否置顶（1: 是, 0: 否）
  "topExpireTime": "string", // 置顶过期时间（可选，格式：YYYY-MM-DD HH:mm:ss）
  "isHomeRecommend": "number", // 是否首页推荐（1: 是, 0: 否）
  "isWeekSelection": "number", // 是否本周精选（1: 是, 0: 否）
  "isMonthRecommend": "number" // 是否本月推荐（1: 是, 0: 否）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "更新笔记成功",
  "data": null
}
```

**错误码**: 
- 400: 标题或内容不能为空
- 400: 分类ID格式不正确
- 404: 笔记不存在
- 500: 更新笔记失败

---

### 6. 删除笔记

**路径**: `DELETE /api/notes/:id`

**功能**: 删除指定的笔记

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "删除笔记成功",
  "data": null
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 删除笔记失败

---

### 7. 批量删除笔记

**路径**: `DELETE /api/notes/batch-delete`

**功能**: 批量删除多个笔记

**参数**: 
```json
{
  "noteIds": ["number"] // 笔记ID数组
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "批量删除笔记成功",
  "data": null
}
```

**错误码**: 
- 400: 请选择要删除的笔记
- 500: 批量删除笔记失败

---

### 8. 批量修改笔记状态

**路径**: `PUT /api/notes/batch-status`

**功能**: 批量修改多个笔记的状态

**参数**: 
```json
{
  "noteIds": ["number"], // 笔记ID数组
  "status": "number" // 目标状态（1: 启用, 0: 禁用）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "批量修改成功",
  "data": null
}
```

**错误码**: 
- 400: 请选择要修改的笔记
- 400: 请指定状态
- 500: 批量修改失败

---

### 9. 获取笔记统计数据概览

**路径**: `GET /api/notes/stats/overview`

**功能**: 获取笔记统计概览数据

**参数**: 
- startDate: 可选，开始日期（格式：YYYY-MM-DD）
- endDate: 可选，结束日期（格式：YYYY-MM-DD）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取笔记统计数据成功",
  "data": {
    "total": "number", // 总笔记数
    "active": "number", // 启用的笔记数
    "top": "number", // 置顶的笔记数
    "recommended": "number" // 推荐的笔记数
  }
}
```

---

### 10. 切换笔记置顶状态

**路径**: `PUT /api/notes/:id/top`

**功能**: 切换指定笔记的置顶状态

**参数**: 
- id: 笔记ID（路径参数）
```json
{
  "top": "number", // 置顶状态（1: 置顶, 0: 取消置顶）
  "top_expire_time": "string" // 可选，置顶过期时间（格式：YYYY-MM-DD HH:mm:ss）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "置顶成功"或"取消置顶成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定置顶状态
- 404: 笔记不存在
- 500: 切换置顶状态失败

---

### 11. 切换笔记首页推荐状态

**路径**: `PUT /api/notes/:id/home-recommend`

**功能**: 切换指定笔记的首页推荐状态

**参数**: 
- id: 笔记ID（路径参数）
```json
{
  "is_home_recommend": "number" // 首页推荐状态（1: 推荐, 0: 取消推荐）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "设置首页推荐成功"或"取消首页推荐成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定首页推荐状态
- 404: 笔记不存在
- 500: 切换首页推荐状态失败

---

### 12. 切换笔记本周精选状态

**路径**: `PUT /api/notes/:id/week-selection`

**功能**: 切换指定笔记的本周精选状态

**参数**: 
- id: 笔记ID（路径参数）
```json
{
  "is_week_selection": "number" // 本周精选状态（1: 精选, 0: 取消精选）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "设置本周精选成功"或"取消本周精选成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定本周精选状态
- 404: 笔记不存在
- 500: 切换本周精选状态失败

---

### 13. 切换笔记本月推荐状态

**路径**: `PUT /api/notes/:id/month-recommend`

**功能**: 切换指定笔记的本月推荐状态

**参数**: 
- id: 笔记ID（路径参数）
```json
{
  "is_month_recommend": "number" // 本月推荐状态（1: 推荐, 0: 取消推荐）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "设置本月推荐成功"或"取消本月推荐成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定本月推荐状态
- 404: 笔记不存在
- 500: 切换本月推荐状态失败

---

### 14. 获取笔记的HTML预览（后台使用）

**路径**: `GET /api/notes/:id/preview`

**功能**: 获取笔记的HTML预览，支持长笔记异步处理

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 

**对于短笔记（内容长度≤10000字符）**: 
```json
{
  "code": 200,
  "msg": "获取笔记预览成功",
  "data": {
    "id": "number",
    "title": "string",
    "content": "string",
    "status": "number",
    "cover_image": "string",
    "is_top": "number",
    "top_expire_time": "string",
    "is_home_recommend": "number",
    "is_week_selection": "number",
    "is_month_recommend": "number",
    "created_at": "string",
    "updated_at": "string",
    "categories": [
      {"id": "number", "name": "string"}
    ],
    "html_content": "string",
    "isLongNote": false
  }
}
```

**对于长笔记（内容长度>10000字符）**: 
```json
{
  "code": 200,
  "message": "正在处理长笔记，请等待...",
  "data": {
    "basicInfo": {
      "id": "number",
      "title": "string",
      "status": "number",
      "cover_image": "string",
      "is_top": "number",
      "top_expire_time": "string",
      "is_home_recommend": "number",
      "is_week_selection": "number",
      "is_month_recommend": "number",
      "created_at": "string",
      "updated_at": "string",
      "categories": [
        {"id": "number", "name": "string"}
      ]
    },
    "isLongNote": true
  }
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 获取笔记预览失败

---

### 15. 笔记统计详情接口

**路径**: `GET /api/notes/stats/detail`

**功能**: 获取指定笔记的详细统计数据

**参数**: 
- noteId: 笔记ID
- timeRange: 时间范围，可选值：'1d', '7d', '30d', '90d'，默认为'7d'
- type: 统计类型，可选值：'views', 'exposure', 'conversion_rate'，默认为'views'

**返回**: 
```json
{
  "code": 200,
  "msg": "获取笔记统计数据成功",
  "data": {
    "stats": [
      {
        "date": "string",
        "views": "number", // 阅读量统计时返回
        "exposure": "number", // 曝光量统计时返回
        "conversion_rate": "number" // 转化率统计时返回
      }
    ],
    "total": "number",
    "average": "number"
  }
}
```

**错误码**: 
- 400: 请指定笔记ID
- 400: 无效的时间范围
- 400: 无效的统计类型
- 500: 获取统计数据失败

---

### 16. 批量笔记统计接口

**路径**: `POST /api/notes/stats/filter`

**功能**: 根据统计指标筛选笔记

**参数**: 
```json
{
  "condition": "object", // 筛选条件
  "timeRange": "string", // 时间范围，如'7d'表示7天，默认为'7d'
  "page": "number", // 页码，默认为1
  "pageSize": "number" // 每页条数，默认为10
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "获取筛选笔记列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "title": "string",
        "status": "number",
        "views_count": "number",
        "exposure_count": "number",
        "conversion_rate": "number"
      }
    ],
    "total": "number",
    "page": "number",
    "pageSize": "number",
    "totalPages": "number"
  }
}
```

**错误码**: 
- 400: 请提供有效的筛选条件
- 500: 获取筛选笔记列表失败

---

### 17. 编辑器图片上传（已废弃）

**路径**: `POST /api/notes/upload-image`

**功能**: 富文本编辑器图片上传（已废弃）

**说明**: 此接口已废弃，前端应直接调用统一的文件上传接口 `/file/upload`

**返回**: 
```json
{
  "code": 400,
  "msg": "此接口已废弃，请使用统一的文件上传接口 /file/upload",
  "data": null
}
```

## 权限说明
- 所有接口均需要认证和相应的权限访问
- 不同角色有不同的操作权限

## 数据格式要求
- 笔记内容支持HTML富文本格式
- 封面图片支持JPG、PNG、GIF格式，大小不超过5MB
- 笔记标题长度限制在1-200个字符