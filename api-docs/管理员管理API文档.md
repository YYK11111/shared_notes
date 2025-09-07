# 管理员管理 API 文档

## 概述
本模块包含管理员用户管理和角色管理相关接口，用于后台系统管理。

## 接口列表

### 1. 获取管理员列表

**路径**: `GET /api/admin`

**功能**: 获取管理员用户列表，支持分页和筛选

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为10
keyword: string, // 关键词搜索（用户名、邮箱、手机号）
status: number, // 状态筛选（1: 启用, 0: 禁用）
roleId: number // 角色ID筛选
```

**返回**: 
```json
{
  "code": 200,
  "msg": "获取管理员列表成功",
  "data": {
    "list": [
      {
        "id": "number",
        "username": "string",
        "email": "string",
        "phone": "string",
        "role_id": "number",
        "role_name": "string",
        "status": "number",
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

### 2. 获取管理员详情

**路径**: `GET /api/admin/:id`

**功能**: 获取单个管理员的详细信息

**参数**: 
- id: 管理员ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取管理员详情成功",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "phone": "string",
    "role_id": "number",
    "status": "number",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**错误码**: 
- 404: 管理员不存在

---

### 3. 创建管理员

**路径**: `POST /api/admin`

**功能**: 创建新的管理员用户

**参数**: 
```json
{
  "username": "string", // 用户名
  "password": "string", // 密码
  "email": "string", // 邮箱
  "phone": "string", // 手机号
  "roleId": "number", // 角色ID
  "status": "number" // 状态（1: 启用, 0: 禁用）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "创建管理员成功",
  "data": {"id": "number"}
}
```

**错误码**: 
- 400: 用户名已存在/邮箱已存在/手机号已存在/密码不符合要求
- 500: 创建管理员失败

---

### 4. 更新管理员

**路径**: `PUT /api/admin/:id`

**功能**: 更新现有管理员用户的信息

**参数**: 
```json
{
  "username": "string", // 用户名
  "email": "string", // 邮箱
  "phone": "string", // 手机号
  "roleId": "number", // 角色ID
  "status": "number" // 状态（1: 启用, 0: 禁用）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "更新管理员成功",
  "data": null
}
```

**错误码**: 
- 400: 用户名已存在/邮箱已存在/手机号已存在
- 404: 管理员不存在
- 500: 更新管理员失败

---

### 5. 删除管理员

**路径**: `DELETE /api/admin/:id`

**功能**: 删除指定的管理员用户

**参数**: 
- id: 管理员ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "删除管理员成功",
  "data": null
}
```

**错误码**: 
- 403: 无法删除最后一个超级管理员
- 404: 管理员不存在
- 500: 删除管理员失败

---

### 6. 批量删除管理员

**路径**: `POST /api/admin/batch-delete`

**功能**: 批量删除多个管理员用户

**参数**: 
```json
{
  "ids": [number] // 管理员ID数组
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "批量删除管理员成功",
  "data": null
}
```

**错误码**: 
- 400: 请选择要删除的管理员
- 403: 无法删除最后一个超级管理员
- 500: 批量删除管理员失败

---

### 7. 获取角色列表

**路径**: `GET /api/admin/roles`

**功能**: 获取所有角色列表

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "msg": "获取角色列表成功",
  "data": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

### 8. 创建角色

**路径**: `POST /api/admin/roles`

**功能**: 创建新的角色

**参数**: 
```json
{
  "name": "string", // 角色名称
  "description": "string" // 角色描述
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "创建角色成功",
  "data": {"id": "number"}
}
```

**错误码**: 
- 400: 角色名称已存在
- 500: 创建角色失败

---

### 9. 更新角色

**路径**: `PUT /api/admin/roles/:id`

**功能**: 更新现有角色的信息

**参数**: 
```json
{
  "name": "string", // 角色名称
  "description": "string" // 角色描述
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "更新角色成功",
  "data": null
}
```

**错误码**: 
- 400: 角色名称已存在
- 404: 角色不存在
- 500: 更新角色失败

---

### 10. 删除角色

**路径**: `DELETE /api/admin/roles/:id`

**功能**: 删除指定的角色

**参数**: 
- id: 角色ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "删除角色成功",
  "data": null
}
```

**错误码**: 
- 400: 该角色下还有管理员用户，无法删除
- 404: 角色不存在
- 500: 删除角色失败

---

### 11. 获取角色权限

**路径**: `GET /api/admin/roles/:id/permissions`

**功能**: 获取指定角色的权限列表

**参数**: 
- id: 角色ID（路径参数）

**返回**: 
```json
{
  "code": 200,
  "msg": "获取角色权限成功",
  "data": {
    "roleId": "number",
    "permissions": ["string"] // 权限编码列表
  }
}
```

---

### 12. 分配角色权限

**路径**: `PUT /api/admin/roles/:id/permissions`

**功能**: 为指定角色分配权限

**参数**: 
```json
{
  "permissions": ["string"] // 权限编码数组
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "分配权限成功",
  "data": null
}
```

**错误码**: 
- 404: 角色不存在
- 500: 分配权限失败

---

### 13. 获取登录日志列表

**路径**: `GET /api/admin/logs/login`

**功能**: 获取管理员登录日志列表

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为10
username: string, // 用户名筛选
startDate: string, // 开始日期
endDate: string, // 结束日期
ip: string // IP地址筛选
```

**返回**: 
```json
{
  "code": 200,
  "msg": "获取登录日志成功",
  "data": {
    "list": [
      {
        "id": "number",
        "username": "string",
        "ip": "string",
        "user_agent": "string",
        "login_time": "string",
        "status": "string"
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

### 14. 获取系统操作日志列表

**路径**: `GET /api/admin/logs/operation`

**功能**: 获取系统操作日志列表

**参数**: 
```
page: number, // 页码，默认为1
pageSize: number, // 每页条数，默认为10
username: string, // 操作用户名
operationType: string, // 操作类型
startDate: string, // 开始日期
endDate: string, // 结束日期
module: string // 操作模块
```

**返回**: 
```json
{
  "code": 200,
  "msg": "获取操作日志成功",
  "data": {
    "list": [
      {
        "id": "number",
        "admin_id": "number",
        "username": "string",
        "operation_type": "string",
        "module": "string",
        "target_id": "number",
        "details": "string",
        "ip": "string",
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

## 权限说明
- 所有接口均需要超级管理员权限或相应的管理权限
- 敏感操作会进行权限验证和日志记录
- 系统使用`role_code`字段进行角色判断，标准角色包括：
  - `super_admin`: 超级管理员（拥有所有权限）
  - `admin`: 管理员（拥有大部分管理权限）
  - `user`: 基础用户（拥有基础权限）

## 数据安全
- 密码通过bcrypt进行加密存储
- 敏感信息如手机号、邮箱在特定条件下会进行脱敏处理
- 操作日志记录所有关键操作，便于追溯