


          
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

**描述**: 上传单个文件到服务器，支持根据业务类型分类存储，自动进行图片压缩，并支持文件重复检测。

**请求参数**: 
- **查询参数**: 
  - `businessType`: 业务类型（如'avatar', 'cover', 'note', 'feedback'），默认为'other'
  - `resourceId`: 可选，关联的资源ID
  - `resourceType`: 可选，关联的资源类型
- **表单数据**: 
  - `file`: 要上传的文件

**请求示例**: 
```javascript
// 使用FormData上传文件
const formData = new FormData();
formData.append('file', fileObject);

fetch('/file/upload?businessType=note&resourceId=123&resourceType=note', {
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

### 3.4 获取文件信息接口

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
    "created_at": "2023-10-01 12:00:00",
    "storage_path": "文件存储路径"
  }
}
```

**失败响应**: 
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "获取文件信息失败，请稍后重试"}`

### 3.5 建立文件与资源的关联

**路径**: `/link`

**方法**: POST

**权限**: 需要认证（Bearer Token）

**描述**: 建立文件与其他资源（如笔记、反馈等）之间的关联关系。

**请求参数**: 
- **请求体参数**: 
  - `fileId`: 文件的唯一标识符
  - `resourceId`: 资源的唯一标识符
  - `resourceType`: 资源类型（如'note', 'feedback', 'user'等）

**请求示例**: 
```javascript
fetch('/file/link', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileId: '123e4567-e89b-12d3-a456-426614174000',
    resourceId: '456',
    resourceType: 'note'
  })
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "文件与资源关联成功",
  "data": null
}
```

**失败响应**: 
- 参数缺失: `{"code": 400, "message": "fileId、resourceId和resourceType为必填参数"}`
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "关联失败，请稍后重试"}`

### 3.6 解除文件与资源的关联

**路径**: `/unlink`

**方法**: DELETE

**权限**: 需要认证（Bearer Token）

**描述**: 解除文件与其他资源之间的关联关系。

**请求参数**: 
- **查询参数**: 
  - `fileId`: 文件的唯一标识符
  - `resourceId`: 资源的唯一标识符
  - `resourceType`: 资源类型

**请求示例**: 
```javascript
fetch('/file/unlink?fileId=123e4567-e89b-12d3-a456-426614174000&resourceId=456&resourceType=note', {
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
  "message": "文件与资源解除关联成功",
  "data": null
}
```

**失败响应**: 
- 参数缺失: `{"code": 400, "message": "fileId、resourceId和resourceType为必填参数"}`
- 关联关系不存在: `{"code": 404, "message": "关联关系不存在"}`
- 服务器错误: `{"code": 500, "message": "解除关联失败，请稍后重试"}`

### 3.7 获取与资源关联的文件列表

**路径**: `/list-by-resource`

**方法**: GET

**权限**: 需要认证（Bearer Token）

**描述**: 获取与指定资源关联的所有文件列表。

**请求参数**: 
- **查询参数**: 
  - `resourceId`: 资源的唯一标识符
  - `resourceType`: 资源类型

**请求示例**: 
```javascript
fetch('/file/list-by-resource?resourceId=456&resourceType=note', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "获取资源关联文件列表成功",
  "data": [
    {
      "file_id": "123e4567-e89b-12d3-a456-426614174000",
      "file_name": "example.jpg",
      "file_type": "image/jpeg",
      "file_size": 102400,
      "business_type": "note",
      "created_at": "2023-10-01 12:00:00"
    },
    // 更多文件信息...
  ]
}
```

**失败响应**: 
- 参数缺失: `{"code": 400, "message": "resourceId和resourceType为必填参数"}`
- 服务器错误: `{"code": 500, "message": "获取失败，请稍后重试"}`

### 3.8 获取与文件关联的资源列表

**路径**: `/list-by-file/:fileId`

**方法**: GET

**权限**: 需要认证（Bearer Token）

**描述**: 获取与指定文件关联的所有资源列表。

**请求参数**: 
- **路径参数**: 
  - `fileId`: 文件的唯一标识符

**请求示例**: 
```javascript
fetch('/file/list-by-file/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
})
```

**成功响应**: 
```json
{
  "code": 200,
  "message": "获取文件关联资源列表成功",
  "data": [
    {
      "resource_id": "456",
      "resource_type": "note",
      "created_at": "2023-10-01 12:00:00"
    },
    // 更多资源信息...
  ]
}
```

**失败响应**: 
- 文件不存在: `{"code": 404, "message": "文件不存在"}`
- 服务器错误: `{"code": 500, "message": "获取失败，请稍后重试"}`

## 4. 文件存储说明
1. 文件按日期和业务类型自动分类存储在服务器上
2. 存储路径格式: `uploads/年/月/业务类型/`
3. 文件名使用UUID生成，保留原始文件后缀
4. 文件元数据存储在数据库的`files`表中
5. 文件与资源的关联关系存储在`file_resource_mapping`表中

## 5. 上传限制
- 文件大小限制: 默认5MB（可通过配置修改）
- 支持的文件类型: 默认支持'image/jpeg', 'image/png', 'image/gif', 'image/webp'（可通过配置修改）
- 支持的最大文件数量: 默认5个文件（可通过配置修改）

## 6. 错误码说明
| 错误码 | 描述 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误或文件不符合要求 |
| 401 | 未授权（需要登录） |
| 404 | 文件不存在或关联关系不存在 |
| 500 | 服务器内部错误 |
        