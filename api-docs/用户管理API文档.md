# 用户管理 API 文档

## 概述
本模块包含用户相关的前台接口，如获取首页数据、分类列表、笔记详情、搜索功能等。

## 接口列表

### 1. 获取首页数据

**路径**: `GET /api/user/home`

**功能**: 获取网站首页展示数据，包括推荐笔记、最新笔记、热门笔记等

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取首页数据成功",
  "data": {
    "systemConfig": {"key": "value"}, // 系统配置
    "hotNotes": [/* 热门笔记列表 */],
    "weekSelection": [/* 本周精选列表 */],
    "monthRecommend": [/* 月度推荐列表 */],
    "highPriorityCategories": [/* 高优先级分类列表 */]
  }
}
```

---

### 2. 获取分类列表

**路径**: `GET /api/user/categories`

**功能**: 获取分类列表（前台使用），构建树形结构

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取分类列表成功",
  "data": [
    {
      "id": "number",
      "name": "string",
      "parent_id": "number",
      "status": "number",
      "priority": "number",
      "children": [/* 子分类列表 */]
    }
  ]
}
```

---

### 3. 获取分类下的笔记列表

**路径**: `GET /api/user/categories/:categoryId/notes`

**功能**: 获取指定分类下的笔记列表，支持分页和排序

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number // 每页条数，默认为10
```

**返回**: 
```json
{
  "code": 200,
  "message": "获取分类笔记成功",
  "data": {
    "list": [
      {
        "id": "number",
        "title": "string",
        "content": "string",
        "status": "number",
        "view_count": "number",
        "is_top": "number",
        "cover_image": "string",
        "created_at": "string"
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

### 4. 获取笔记详情

**路径**: `GET /api/user/notes/:id`

**功能**: 获取笔记详情，并更新阅读量，提供上下篇导航

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
    "view_count": "number",
    "is_top": "number",
    "cover_image": "string",
    "categories": "string", // 分类名称，逗号分隔
    "created_at": "string",
    "prevNote": {"id": "number", "title": "string"},
    "nextNote": {"id": "number", "title": "string"}
  }
}
```

**错误码**: 
- 404: 笔记不存在或已禁用

---

### 5. 搜索笔记

**路径**: `GET /api/user/search`

**功能**: 搜索笔记，支持关键词过滤、敏感词过滤

**参数**: 
```
keyword: string, // 搜索关键词
page: number, // 页码，默认为1
pageSize: number // 每页条数，默认为10
```

**返回**: 
```json
{
  "code": 200,
  "message": "搜索成功",
  "data": {
    "list": [
      {
        "id": "number",
        "title": "string",
        "content": "string",
        "view_count": "number",
        "cover_image": "string",
        "categories": "string",
        "created_at": "string"
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

### 6. 获取热门搜索词

**路径**: `GET /api/user/search/hot`

**功能**: 获取近7天热门搜索词

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取热门搜索词成功",
  "data": [
    {
      "keyword": "string",
      "search_count": "number"
    }
  ]
}
```

---

### 7. 提交用户反馈

**路径**: `POST /api/user/feedback`

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

### 8. 获取系统配置

**路径**: `GET /api/user/config`

**功能**: 获取系统配置信息

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取系统配置成功",
  "data": {
    "key1": "value1",
    "key2": "value2",
    // 其他配置项
  }
}
```

## 权限说明
- 所有接口均为公开接口，不需要登录即可访问
- 部分数据会根据用户权限进行过滤

## 数据说明
- 笔记内容会进行敏感词过滤
- 搜索功能包含搜索日志记录和关键词高亮
- 提交反馈内容长度限制在10-2000个字符

## 响应格式
- 所有接口返回统一的JSON格式
- 包含code、message和data三个字段
- code为200表示成功，其他值表示失败