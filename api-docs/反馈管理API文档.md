# 反馈管理 API 文档

## 概述
本模块包含用户反馈的提交、查询、处理等功能接口。

## 接口列表

### 1. 获取反馈列表

**路径**: `GET /api/feedbacks`

**功能**: 获取反馈列表，支持分页和筛选

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为10
status: string, // 状态筛选（待处理、已处理、已回复）
type: string, // 类型筛选
keyword: string // 关键词搜索（内容或联系方式）
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取反馈列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "type": "string",
        "content": "string",
        "contact": "string",
        "status": "string",
        "reply_content": "string",
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

### 2. 获取单个反馈详情

**路径**: `GET /api/feedbacks/:id`

**功能**: 获取单个反馈的详细信息

**参数**: 
- id: 反馈ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "获取反馈详情成功",
  "data": {
    "id": "number",
    "type": "string",
    "content": "string",
    "contact": "string",
    "status": "string",
    "reply_content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**错误码**: 
- 404: 反馈不存在

---

### 3. 提交反馈（前台用户）

**路径**: `POST /api/feedbacks`

**功能**: 用户提交反馈意见

**参数**: 
```json
{
  "type": "string", // 反馈类型
  "content": "string", // 反馈内容
  "contact": "string" // 联系方式（可选）
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "反馈提交成功，感谢您的建议！",
  "data": {"id": "number"}
}
```

**错误码**: 
- 400: 反馈类型和内容不能为空

---

### 4. 更新反馈状态

**路径**: `PUT /api/feedbacks/:id/status`

**功能**: 更新反馈的处理状态

**参数**: 
```json
{
  "status": "string" // 目标状态（待处理、已处理、已回复）
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "更新状态成功",
  "data": null
}
```

**错误码**: 
- 404: 反馈不存在
- 500: 更新状态失败

---

### 5. 回复反馈

**路径**: `POST /api/feedbacks/:id/reply`

**功能**: 回复用户反馈

**参数**: 
```json
{
  "replyContent": "string" // 回复内容
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "回复成功",
  "data": null
}
```

**错误码**: 
- 400: 回复内容不能为空
- 404: 反馈不存在
- 500: 回复失败

---

### 6. 删除反馈

**路径**: `DELETE /api/feedbacks/:id`

**功能**: 删除指定的反馈记录

**参数**: 
- id: 反馈ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "删除反馈成功",
  "data": null
}
```

**错误码**: 
- 404: 反馈不存在
- 500: 删除反馈失败

---

### 7. 获取反馈统计数据

**路径**: `GET /api/feedbacks/stats`

**功能**: 获取反馈统计数据

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取统计数据成功",
  "data": {
    "total": "number", // 总反馈数
    "pending": "number", // 待处理数
    "processed": "number", // 已处理数
    "replied": "number", // 已回复数
    "typeDistribution": [
      {"type": "string", "count": "number"}
    ]
  }
}
```

## 权限说明
- 提交反馈接口：公开接口，无需登录
- 管理反馈接口（查询、更新、回复、删除）：需要管理员权限
- 统计数据接口：需要管理员权限

## 数据说明
- 反馈内容支持HTML转义，防止XSS攻击
- 反馈内容长度限制在10-2000个字符
- 联系方式（如邮箱、手机号）会进行脱敏处理

## 响应格式
- 所有接口返回统一的JSON格式
- 包含code、message和data三个字段
- code为200表示成功，其他值表示失败