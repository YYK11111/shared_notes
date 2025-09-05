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
status: number, // 状态筛选（1: 启用, 0: 禁用）
startDate: string, // 开始日期筛选
endDate: string // 结束日期筛选
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取笔记列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "title": "string",
        "content": "string",
        "status": "number",
        "view_count": "number",
        "is_top": "number",
        "is_home_recommend": "number",
        "is_week_selection": "number",
        "is_month_recommend": "number",
        "cover_image": "string",
        "categories": "string",
        "created_at": "string",
        "updated_at": "string"
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

**路径**: `GET /api/notes/:id`

**功能**: 获取单条笔记的详细信息

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "获取笔记详情成功",
  "data": {
    "id": "number",
    "title": "string",
    "content": "string",
    "status": "number",
    "view_count": "number",
    "is_top": "number",
    "is_home_recommend": "number",
    "is_week_selection": "number",
    "is_month_recommend": "number",
    "cover_image": "string",
    "categories": [
      {"id": "number", "name": "string"}
    ],
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 获取笔记详情失败

---

### 3. 创建笔记

**路径**: `POST /api/notes`

**功能**: 创建新的笔记，支持文件上传

**参数**: (multipart/form-data)
```
title: string, // 笔记标题
content: string, // 笔记内容
status: number, // 状态（1: 启用, 0: 禁用）
categoryIds: string, // 分类ID列表，逗号分隔
isTop: number, // 是否置顶（1: 是, 0: 否）
isHomeRecommend: number, // 是否首页推荐（1: 是, 0: 否）
coverImage: file // 封面图片（可选）
```

**返回**: 
```json
{
  "code": 200,
  "message": "创建笔记成功",
  "data": {
    "id": "number",
    "title": "string"
  }
}
```

**错误码**: 
- 400: 标题或内容不能为空
- 500: 创建笔记失败

---

### 4. 更新笔记

**路径**: `PUT /api/notes/:id`

**功能**: 更新现有笔记，支持文件上传

**参数**: (multipart/form-data)
```
title: string, // 笔记标题
content: string, // 笔记内容
status: number, // 状态（1: 启用, 0: 禁用）
categoryIds: string, // 分类ID列表，逗号分隔
isTop: number, // 是否置顶（1: 是, 0: 否）
coverImage: file, // 封面图片（可选）
removeCover: number // 是否移除封面（1: 是）
```

**返回**: 
```json
{
  "code": 200,
  "message": "更新笔记成功",
  "data": null
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 更新笔记失败

---

### 5. 删除笔记

**路径**: `DELETE /api/notes/:id`

**功能**: 删除指定的笔记

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "删除笔记成功",
  "data": null
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 删除笔记失败

---

### 6. 批量删除笔记

**路径**: `POST /api/notes/batch-delete`

**功能**: 批量删除多个笔记

**参数**: 
```json
{
  "ids": [number] // 笔记ID数组
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "批量删除笔记成功",
  "data": null
}
```

**错误码**: 
- 400: 请选择要删除的笔记
- 500: 批量删除笔记失败

---

### 7. 批量修改笔记状态

**路径**: `POST /api/notes/batch-status`

**功能**: 批量修改多个笔记的状态

**参数**: 
```json
{
  "ids": [number], // 笔记ID数组
  "status": number // 目标状态（1: 启用, 0: 禁用）
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "批量修改状态成功",
  "data": null
}
```

**错误码**: 
- 400: 请选择要操作的笔记/请指定目标状态
- 500: 批量修改状态失败

---

### 8. 获取笔记统计数据

**路径**: `GET /api/notes/stats/overview`

**功能**: 获取笔记统计概览数据

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取统计数据成功",
  "data": {
    "total": "number", // 总笔记数
    "enabled": "number", // 启用的笔记数
    "disabled": "number", // 禁用的笔记数
    "top": "number", // 置顶的笔记数
    "recommended": "number" // 推荐的笔记数
  }
}
```

---

### 9. 切换笔记置顶状态

**路径**: `POST /api/notes/:id/toggle-top`

**功能**: 切换指定笔记的置顶状态

**参数**: 
- id: 笔记ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "切换置顶状态成功",
  "data": {
    "isTop": "number" // 新的置顶状态（1: 是, 0: 否）
  }
}
```

**错误码**: 
- 404: 笔记不存在
- 500: 切换置顶状态失败

---

### 10. 编辑器图片上传

**路径**: `POST /api/notes/upload-image`

**功能**: 富文本编辑器图片上传

**参数**: (multipart/form-data)
```
image: file // 图片文件
```

**返回**: 
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "string" // 图片URL
  }
}
```

**错误码**: 
- 400: 请选择图片文件/不支持的图片格式/图片大小超过限制
- 500: 上传失败

## 权限说明
- 所有接口均需要认证和相应的权限访问
- 不同角色有不同的操作权限

## 数据格式要求
- 笔记内容支持HTML富文本格式
- 封面图片支持JPG、PNG、GIF格式，大小不超过5MB
- 笔记标题长度限制在1-200个字符