


          
# 文件管理系统接口文档

## 1. 概述
本文档描述了文件管理系统的所有接口，包括文件上传、下载、删除和获取文件信息等功能。

## 2. 基础路径
所有接口的基础路径为：`/file`

## 3. 接口详情

### 3.1 文件上传接口

**路径**: `/upload`

**方法**: POST

**权限**: 需要认证（Bearer Token）

**描述**: 上传单个文件到服务器，支持根据业务类型分类存储。

**请求参数**: 
- **查询参数**: 
  - `businessType`: 业务类型（如'avatar', 'cover', 'note', 'feedback'），默认为'other'
- **表单数据**: 
  - `file`: 要上传的文件

**请求示例**: 
```javascript
// 使用FormData上传文件
const formData = new FormData();
formData.append('file', fileObject);

fetch('/file/upload?businessType=note', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token_here'
  },
  body: formData
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "fileId": "唯一的文件ID"
  }
}
```

**失败响应**: 
- 文件大小超过限制: `{"code": 400, "message": "文件大小超过限制"}`
- 文件类型不支持: `{"code": 400, "message": "不支持的文件类型，仅支持: image/jpeg, image/png, image/gif, image/webp"}`
- 服务器错误: `{"code": 500, "message": "上传失败，请稍后重试"}`

### 3.2 文件获取/预览接口

**路径**: `/get/:fileId`

**方法**: GET

**权限**: 无需认证

**描述**: 根据文件ID获取文件内容，支持图片预览和文件下载。

**请求参数**: 
- **路径参数**: 
  - `fileId`: 文件的唯一标识符

**请求示例**: 
```javascript
// 获取图片文件用于预览
fetch('/file/get/123e4567-e89b-12d3-a456-426614174000')
```

**响应**: 
- 成功: 返回文件内容（图片直接显示，其他文件下载）
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "获取文件失败，请稍后重试"}`

### 3.3 文件删除接口

**路径**: `/delete/:fileId`

**方法**: DELETE

**权限**: 需要认证（Bearer Token）

**描述**: 根据文件ID删除文件，包括数据库记录和本地存储的文件。

**请求参数**: 
- **路径参数**: 
  - `fileId`: 文件的唯一标识符

**请求示例**: 
```javascript
fetch('/file/delete/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "文件删除成功",
  "data": null
}
```

**失败响应**: 
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "删除文件失败，请稍后重试"}`

### 3.4 文件信息获取接口

**路径**: `/info/:fileId`

**方法**: GET

**权限**: 需要认证（Bearer Token）

**描述**: 根据文件ID获取文件的详细信息。

**请求参数**: 
- **路径参数**: 
  - `fileId`: 文件的唯一标识符

**请求示例**: 
```javascript
fetch('/file/info/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "获取文件信息成功",
  "data": {
    "file_id": "123e4567-e89b-12d3-a456-426614174000",
    "file_name": "example.jpg",
    "file_type": "image/jpeg",
    "file_size": 102400,
    "business_type": "note",
    "created_at": "2023-10-01 12:00:00"
  }
}
```

**失败响应**: 
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "获取文件信息失败，请稍后重试"}`

## 4. 文件存储说明
1. 文件按日期和业务类型自动分类存储在服务器上
2. 存储路径格式: `uploads/年/月/业务类型/`
3. 文件名使用UUID生成，保留原始文件后缀
4. 文件元数据存储在数据库的`files`表中

## 5. 上传限制
- 文件大小限制: 默认5MB（可通过配置修改）
- 支持的文件类型: 默认支持'image/jpeg', 'image/png', 'image/gif', 'image/webp'（可通过配置修改）

## 6. 错误码说明
| 错误码 | 描述 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误或文件不符合要求 |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |
        