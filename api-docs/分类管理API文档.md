# 分类管理 API 文档

## 概述
本模块包含笔记分类的创建、查询、更新、删除等操作接口，支持分类树结构的管理。

## 接口列表

### 1. 获取分类列表

**路径**: `GET /api/categories`

**功能**: 获取所有分类列表，构建树形结构

**参数**: 
- status: 可选，分类状态（1: 启用, 0: 禁用）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取分类列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "name": "string",
        "parent_id": "number",
        "status": "number",
        "priority": "number",
        "description": "string",
        "icon": "string",
        "children": [/* 子分类列表 */]
      }
    ],
    "total": "number"
  }
}
```

---

### 2. 获取分类详情

**路径**: `GET /api/categories/:id`

**功能**: 获取单个分类的详细信息

**参数**: 
- id: 分类ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取分类详情成功",
  "data": {
    "id": "number",
    "name": "string",
    "parent_id": "number",
    "status": "number",
    "priority": "number",
    "description": "string",
    "icon": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**错误码**: 
- 404: 分类不存在

---

### 3. 创建分类

**路径**: `POST /api/categories`

**功能**: 创建新的分类

**参数**: 
```json
{
  "name": "string", // 分类名称
  "parent_id": "number", // 父分类ID，0表示顶级分类（支持parentId和parent_id两种格式）
  "status": "number", // 状态（1: 启用, 0: 禁用）
  "priority": "number", // 优先级，范围1-10，数字越大优先级越高
  "description": "string", // 分类描述（可选）
  "icon": "string" // 分类图标（可选）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "创建分类成功",
  "data": {"id": "number"}
}
```

**错误码**: 
- 400: 分类名称不能为空/分类名称已存在
- 500: 创建分类失败

---

### 4. 更新分类

**路径**: `PUT /api/categories/:id`

**功能**: 更新现有分类的信息

**参数**: 
```json
{
  "name": "string", // 分类名称
  "parent_id": "number", // 父分类ID（支持parentId和parent_id两种格式）
  "status": "number", // 状态
  "priority": "number", // 优先级，范围1-10
  "description": "string", // 分类描述（可选）
  "icon": "string" // 分类图标（可选）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "更新分类成功",
  "data": null
}
```

**错误码**: 
- 400: 分类名称不能为空/分类名称已存在/存在循环引用
- 404: 分类不存在
- 500: 更新分类失败

---

### 5. 删除分类

**路径**: `DELETE /api/categories/:id`

**功能**: 删除指定的分类

**参数**: 
- id: 分类ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "删除分类成功",
  "data": null
}
```

**错误码**: 
- 400: 该分类下存在子分类/该分类下存在笔记关联
- 404: 分类不存在
- 500: 删除分类失败

---

### 6. 获取分类笔记数量统计

**路径**: `GET /api/categories/stats/note-count`

**功能**: 获取各个分类下的笔记数量统计

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "msg": "获取分类统计数据成功",
  "data": [
    {
      "id": "number",
      "name": "string",
      "note_count": "number"
    }
  ]
}
```

## 权限说明
- 所有接口均需要认证和相应的权限访问
- 不同角色有不同的操作权限

## 数据说明
- 分类支持无限层级的树形结构
- 系统会自动检测并防止循环引用
- 分类名称长度限制在1-50个字符
- 删除分类前必须先移除关联的笔记和子分类

## 响应格式
- 所有接口返回统一的JSON格式
- 包含code、msg和data三个字段
- code为200表示成功，其他值表示失败