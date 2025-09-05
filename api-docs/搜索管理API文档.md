# 搜索管理 API 文档

## 概述
本模块包含搜索索引管理、搜索屏蔽列表、搜索日志查询等功能接口。

## 接口列表

### 1. 重建搜索索引

**路径**: `POST /api/search/index/rebuild`

**功能**: 重建全文搜索索引

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "搜索索引重建成功",
  "data": null
}
```

**错误码**: 
- 403: 权限不足，仅超级管理员可执行此操作
- 500: 重建索引失败，请检查MySQL配置和全文索引支持情况

---

### 2. 获取索引状态

**路径**: `GET /api/search/index/status`

**功能**: 获取当前搜索索引的状态信息

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取索引状态成功",
  "data": {
    "index_exists": "boolean", // 索引是否存在
    "indexed_count": "number", // 已索引的笔记数量
    "total_active_notes": "number", // 总激活笔记数量
    "index_coverage": "string" // 索引覆盖率
  }
}
```

---

### 3. 获取搜索屏蔽列表

**路径**: `GET /api/search/blocked`

**功能**: 获取被屏蔽的笔记列表

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number // 每页条数，默认为20
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取搜索屏蔽列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "note_id": "number",
        "note_title": "string",
        "blocked_by": "number",
        "blocked_at": "string"
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

### 4. 添加笔记到搜索屏蔽列表

**路径**: `POST /api/search/blocked/add`

**功能**: 将指定笔记添加到搜索屏蔽列表

**参数**: 
```json
{
  "noteId": "number" // 笔记ID
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "添加到屏蔽列表成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定要屏蔽的笔记ID/该笔记已在屏蔽列表中
- 404: 笔记不存在
- 500: 添加到屏蔽列表失败

---

### 5. 从搜索屏蔽列表移除笔记

**路径**: `POST /api/search/blocked/remove`

**功能**: 从搜索屏蔽列表移除指定笔记

**参数**: 
```json
{
  "noteId": "number" // 笔记ID
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "从屏蔽列表移除成功",
  "data": null
}
```

**错误码**: 
- 400: 请指定要移除的笔记ID
- 404: 该笔记不在屏蔽列表中
- 500: 从屏蔽列表移除失败

---

### 6. 获取搜索日志

**路径**: `GET /api/search/logs`

**功能**: 获取用户搜索日志记录

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为20
keyword: string, // 搜索关键词筛选
startDate: string, // 开始日期
endDate: string // 结束日期
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取搜索日志成功",
  "data": {
    "list": [
      {
        "id": "number",
        "keyword": "string",
        "search_time": "string",
        "ip": "string",
        "user_agent": "string"
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

### 7. 获取热门搜索词

**路径**: `GET /api/search/trending`

**功能**: 获取热门搜索词列表

**参数**: 
```
timeRange: string, // 时间范围，默认为7d（7天）
limit: number // 返回数量，默认为20
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取热门搜索词成功",
  "data": [
    {
      "keyword": "string",
      "search_count": "number",
      "last_searched": "string"
    }
  ]
}
```

## 权限说明
- 所有接口均需要管理员权限
- 重建索引接口需要超级管理员权限

## 数据说明
- 搜索索引使用MySQL全文索引功能
- 索引重建过程可能需要较长时间，取决于数据量大小
- 屏蔽列表中的笔记不会在搜索结果中显示
- 搜索日志记录包括搜索关键词、时间、IP地址和用户代理信息

## 响应格式
- 所有接口返回统一的JSON格式
- 包含code、message和data三个字段
- code为200表示成功，其他值表示失败