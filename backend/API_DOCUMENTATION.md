# 后端API接口文档

## 项目概述

这是一个基于Node.js和Express构建的后端API系统，提供了笔记管理、用户管理、权限控制等功能，为前端提供完整的数据支持和业务逻辑。

## 基础信息

- 服务器地址：`http://localhost:3000`（开发环境）
- API前缀：所有API接口均以 `/api` 开头
- 请求/响应格式：JSON
- 认证方式：JWT Token（Bearer Token）
- 开发框架：Express.js
- 数据库：MySQL

## 响应格式

所有API响应遵循统一格式：

```json
{
  "code": 200, // 状态码，200表示成功，非200表示失败
  "data": {}, // 响应数据，根据不同接口返回不同结构
  "msg": "操作成功" // 消息提示，用于前端显示
}
```

## 认证接口

### 获取验证码

- **URL**: `/api/auth/captcha`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: SVG图片（Content-Type: image/svg+xml）
- **响应头**: 
  - `X-Captcha-Id`: 验证码ID，用于验证时使用
- **错误码**: 
  - 500: 获取验证码失败，请稍后重试
- **说明**: 生成图形验证码，用于登录验证

### 登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **认证**: 不需要
- **请求参数**: 
  - `username`: 用户名（必填）
  - `password`: 密码（必填）
  - `captcha`: 验证码（必填）
  - `captchaId`: 验证码ID（必填）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT访问令牌
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 刷新令牌
      "admin": {
        "id": 1,
        "username": "admin",
        "nickname": "超级管理员",
        "role": "超级管理员",
        "permissions": ["admin:list", "admin:create", "note:edit"]
      }
    },
    "msg": "登录成功"
  }
  ```
- **错误码**: 
  - 400: 用户名、密码和验证码不能为空
  - 400: 验证码错误或已过期，请刷新后重试
  - 401: 用户名或密码错误
  - 401: 账户已禁用，请联系超级管理员
- **说明**: 
  - 自动记录登录日志，包括IP地址和用户代理信息
  - token默认有效期1小时，refreshToken默认有效期7天

### 登出

- **URL**: `/api/auth/logout`
- **方法**: `POST`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "登出成功"
  }
  ```
- **说明**: 前端登出时调用，清理会话状态

### 修改密码

- **URL**: `/api/auth/change-password`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `currentPassword`: 当前密码（必填）
  - `newPassword`: 新密码（必填，长度不能少于6位）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "密码修改成功，请重新登录"
  }
  ```
- **错误码**: 
  - 400: 当前密码和新密码不能为空
  - 400: 新密码长度不能少于6位
  - 400: 当前密码错误
  - 401: 未授权，请先登录
  - 401: 登录已过期，请重新登录
  - 404: 管理员不存在
- **说明**: 自动记录管理员操作日志

### 刷新令牌

- **URL**: `/api/auth/refresh`
- **方法**: `POST`
- **认证**: 需要（在请求头中提供现有令牌）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "msg": "令牌刷新成功"
  }
  ```
- **错误码**: 
  - 401: 未提供令牌
  - 401: 无效的令牌
  - 401: 用户不存在或已禁用
- **说明**: 
  - 允许使用已过期的令牌进行刷新
  - 会重新生成新的访问令牌和刷新令牌

## 管理员管理接口

### 获取管理员列表

- **URL**: `/api/admin`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）
  - `keyword`: 搜索关键词
  - `status`: 状态（可选）
  - `role_id`: 角色ID（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "username": "admin",
          "nickname": "超级管理员",
          "email": "admin@example.com",
          "phone": "13800138000",
          "role_id": 1,
          "role_name": "超级管理员",
          "status": 1,
          "created_at": "2023-01-01 10:00:00",
          "updated_at": "2023-01-02 15:30:00"
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    },
    "msg": "获取管理员列表成功"
  }
  ```

### 获取管理员详情

- **URL**: `/api/admin/:id`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "username": "admin",
      "nickname": "超级管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "role_id": 1,
      "role_name": "超级管理员",
      "status": 1,
      "created_at": "2023-01-01 10:00:00",
      "updated_at": "2023-01-02 15:30:00"
    },
    "msg": "获取管理员详情成功"
  }
  ```

### 创建管理员

- **URL**: `/api/admin`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `username`: 用户名（必填，唯一）
  - `password`: 密码（必填，长度8-20位，必须包含字母和数字）
  - `nickname`: 昵称（必填）
  - `email`: 邮箱（可选）
  - `phone`: 手机号（可选）
  - `role_id`: 角色ID（可选）
  - `status`: 状态（可选，默认1）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 2
    },
    "msg": "创建管理员成功"
  }
  ```

### 更新管理员

- **URL**: `/api/admin/:id`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  - `nickname`: 昵称（可选）
  - `email`: 邮箱（可选）
  - `phone`: 手机号（可选）
  - `role_id`: 角色ID（可选）
  - `status`: 状态（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "更新管理员成功"
  }
  ```
- **说明**: 用户名不可修改

### 删除管理员

- **URL**: `/api/admin/:id`
- **方法**: `DELETE`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "删除管理员成功"
  }
  ```
- **限制**: 不能删除最后一个超级管理员

### 批量删除管理员

- **URL**: `/api/admin/batch-delete`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `ids`: 管理员ID数组（必填，不能为空数组）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "批量删除成功"
  }
  ```
- **限制**: 不能删除所有超级管理员

## 角色管理接口

### 获取角色列表
- **URL**: `/api/admin/roles`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "name": "超级管理员",
        "description": "系统最高权限管理员",
        "created_at": "2023-01-01 10:00:00",
        "updated_at": "2023-01-01 10:00:00"
      }
    ],
    "msg": "获取角色列表成功"
  }
  ```

### 创建角色
- **URL**: `/api/admin/roles`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `name`: 角色名称（必填，唯一）
  - `description`: 描述（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 2
    },
    "msg": "创建角色成功"
  }
  ```

### 更新角色
- **URL**: `/api/admin/roles/:id`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  - `name`: 角色名称（必填）
  - `description`: 描述（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "更新角色成功"
  }
  ```
- **限制**: 超级管理员角色名称不可修改

### 删除角色
- **URL**: `/api/admin/roles/:id`
- **方法**: `DELETE`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "删除角色成功"
  }
  ```
- **限制**: 
  - 不能删除超级管理员角色
  - 角色下有管理员时不能删除

### 获取角色权限
- **URL**: `/api/admin/roles/:id/permissions`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "allPermissions": [
        {
          "id": 1,
          "name": "查看管理员",
          "description": "查看所有管理员列表",
          "isAssigned": true
        }
      ],
      "assignedPermissions": [
        {
          "id": 1,
          "name": "查看管理员",
          "description": "查看所有管理员列表"
        }
      ]
    },
    "msg": "获取角色权限成功"
  }
  ```

### 分配角色权限
- **URL**: `/api/admin/roles/:id/permissions`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  - `permissionIds`: 权限ID数组（必填，必须是数组格式）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "分配角色权限成功"
  }
  ```
- **说明**: 空数组表示清空该角色的所有权限

### 获取登录日志
- **URL**: `/api/admin/login-logs`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）
  - `username`: 用户名（可选，支持模糊搜索）
  - `loginStatus`: 登录状态（可选）
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "username": "admin",
          "ip_address": "127.0.0.1",
          "user_agent": "Mozilla/5.0 ...",
          "login_status": 1,
          "login_time": "2023-01-03 08:30:45",
          "error_message": null
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    },
    "msg": "获取登录日志成功"
  }
  ```

### 获取系统操作日志
- **URL**: `/api/admin/system-logs`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）
  - `action`: 操作类型（可选，支持模糊搜索）
  - `keyword`: 关键词（可选，搜索描述和用户名）
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "admin_id": 1,
          "username": "admin",
          "action": "创建管理员",
          "description": "创建了新的管理员账户",
          "created_at": "2023-01-03 10:15:30"
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    },
    "msg": "获取系统操作日志成功"
  }
  ```

## 分类管理接口

### 获取分类列表

- **URL**: `/api/categories`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `status`: 状态（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "name": "技术分享",
          "description": "分享技术相关内容",
          "parent_id": 0,
          "priority": 1,
          "status": 1,
          "icon": null,
          "created_at": "2023-01-01 10:00:00",
          "updated_at": "2023-01-01 10:00:00",
          "children": [
            {
              "id": 2,
              "name": "前端开发",
              "description": "前端技术相关内容",
              "parent_id": 1,
              "priority": 2,
              "status": 1,
              "icon": null,
              "created_at": "2023-01-01 11:00:00",
              "updated_at": "2023-01-01 11:00:00"
            }
          ]
        }
      ],
      "total": 2
    },
    "msg": "获取分类列表成功"
  }
  ```
- **说明**: 返回树形结构的分类列表，按优先级和ID升序排列

### 获取分类详情

- **URL**: `/api/categories/:id`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "name": "技术分享",
      "description": "分享技术相关内容",
      "parent_id": 0,
      "priority": 1,
      "status": 1,
      "icon": null,
      "created_at": "2023-01-01 10:00:00",
      "updated_at": "2023-01-01 10:00:00"
    },
    "msg": "获取分类详情成功"
  }
  ```
- **错误码**: 
  - 404: 分类不存在

### 创建分类

- **URL**: `/api/categories`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `name`: 分类名称（必填）
  - `description`: 描述（可选）
  - `parent_id` 或 `parentId`: 父分类ID（可选，0表示顶级分类）
  - `priority`: 优先级（可选，1-10之间，默认10）
  - `status`: 状态（可选，默认1）
  - `icon`: 图标（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 3
    },
    "msg": "创建分类成功"
  }
  ```
- **错误码**: 
  - 400: 分类名称不能为空
  - 400: 父分类不存在
  - 400: 优先级必须在1-10之间

### 更新分类

- **URL**: `/api/categories/:id`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  - `name`: 分类名称（必填）
  - `description`: 描述（可选）
  - `parent_id` 或 `parentId`: 父分类ID（可选，0表示顶级分类）
  - `priority`: 优先级（可选，1-10之间）
  - `status`: 状态（可选）
  - `icon`: 图标（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "更新分类成功"
  }
  ```
- **错误码**: 
  - 400: 分类名称不能为空
  - 400: 分类不能设置自身为父分类
  - 400: 分类不能设置自身或子孙分类为父分类
  - 400: 父分类不存在
  - 400: 优先级必须在1-10之间
  - 404: 分类不存在

### 删除分类

- **URL**: `/api/categories/:id`
- **方法**: `DELETE`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "删除分类成功"
  }
  ```
- **错误码**: 
  - 400: 该分类下存在子分类，请先删除子分类
  - 400: 该分类下存在笔记，请先移除笔记关联
  - 404: 分类不存在

### 获取分类笔记数量统计

- **URL**: `/api/categories/stats/note-count`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "name": "技术分享",
        "note_count": 25
      },
      {
        "id": 2,
        "name": "前端开发",
        "note_count": 15
      }
    ],
    "msg": "获取分类统计数据成功"
  }
  ```
- **说明**: 返回每个分类及其关联的笔记数量，按笔记数量降序排列

## 笔记管理接口

### 获取笔记列表

- **URL**: `/api/notes`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）
  - `keyword`: 搜索关键词（可选，模糊搜索标题和内容）
  - `categoryId`: 分类ID（可选）
  - `status`: 状态（可选，0表示禁用，1表示启用）
  - `startDate`: 开始日期（可选，格式：YYYY-MM-DD）
  - `endDate`: 结束日期（可选，格式：YYYY-MM-DD）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "title": "React入门教程",
          "content": "React是一个用于构建用户界面的JavaScript库...",
          "cover_image": "/uploads/cover-1623456789012.jpg",
          "status": 1,
          "is_top": 0,
          "top_expire_time": null,
          "is_home_recommend": 1,
          "is_week_selection": 0,
          "is_month_recommend": 0,
          "view_count": 1234,
          "created_at": "2023-01-01 10:00:00",
          "updated_at": "2023-01-02 15:30:00",
          "category_ids": "1,2",
          "category_names": "技术分享,前端开发"
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10
    },
    "msg": "获取笔记列表成功"
  }
  ```
- **错误码**: 
  - 500: 获取笔记列表失败，请稍后重试

### 获取笔记详情

- **URL**: `/api/notes/:id`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "title": "React入门教程",
      "content": "React是一个用于构建用户界面的JavaScript库...",
      "cover_image": "/uploads/cover-1623456789012.jpg",
      "status": 1,
      "is_top": 0,
      "top_expire_time": null,
      "is_home_recommend": 1,
      "is_week_selection": 0,
      "is_month_recommend": 0,
      "view_count": 1234,
      "created_at": "2023-01-01 10:00:00",
      "updated_at": "2023-01-02 15:30:00",
      "category_ids": [1, 2],
      "category_names": ["技术分享", "前端开发"]
    },
    "msg": "获取笔记成功"
  }
  ```
- **错误码**: 
  - 404: 笔记不存在
  - 500: 获取笔记失败，请稍后重试

### 创建笔记

- **URL**: `/api/notes`
- **方法**: `POST`
- **认证**: 需要
- **响应状态码**: 201（成功创建）
- **请求参数**: 
  - `title`: 标题（必填）
  - `content`: 内容（必填）
  - `category_ids`: 分类ID数组（可选，格式：逗号分隔的字符串或数组）
  - `status`: 状态（可选，0表示禁用，1表示启用）
  - `is_top`: 是否置顶（可选，0表示否，1表示是）
  - `top_expire_time`: 置顶过期时间（可选，格式：YYYY-MM-DD HH:mm:ss）
  - `is_home_recommend`: 是否首页推荐（可选，0表示否，1表示是）
  - `is_week_selection`: 是否本周精选（可选，0表示否，1表示是）
  - `is_month_recommend`: 是否月度推荐（可选，0表示否，1表示是）
  - `cover_image`: 封面图片（文件上传，可选，支持JPG、PNG、GIF格式，最大5MB）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 10
    },
    "msg": "创建笔记成功"
  }
  ```
- **错误码**: 
  - 400: 标题和内容不能为空
  - 400: 只支持JPG、PNG、GIF格式的图片文件
  - 500: 创建笔记失败，请稍后重试

### 更新笔记

- **URL**: `/api/notes/:id`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 同创建笔记，增加以下参数
  - `delete_cover`: 是否删除封面图片（可选，设置为'true'时删除现有封面）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "更新笔记成功"
  }
  ```
- **错误码**: 
  - 400: 标题和内容不能为空
  - 400: 只支持JPG、PNG、GIF格式的图片文件
  - 404: 笔记不存在
  - 500: 更新笔记失败，请稍后重试

### 删除笔记

- **URL**: `/api/notes/:id`
- **方法**: `DELETE`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "删除笔记成功"
  }
  ```
- **说明**: 删除笔记时会同时删除相关的分类关联和封面图片文件
- **错误码**: 
  - 404: 笔记不存在
  - 500: 删除笔记失败，请稍后重试

### 批量删除笔记

- **URL**: `/api/notes/batch-delete`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `ids`: 笔记ID数组（必填）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "批量删除成功"
  }
  ```
- **说明**: 删除笔记时会同时删除相关分类关联和封面图片文件
- **错误码**: 
  - 400: 请选择要删除的笔记
  - 500: 批量删除失败，请稍后重试

### 批量修改笔记状态

- **URL**: `/api/notes/batch-update-status`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `ids`: 笔记ID数组（必填）
  - `status`: 目标状态（必填，0表示禁用，1表示启用）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "批量修改成功"
  }
  ```
- **错误码**: 
  - 400: 请选择要操作的笔记
  - 400: 请指定状态
  - 500: 批量修改失败，请稍后重试

### 编辑器图片上传

- **URL**: `/api/notes/upload-image`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `file`: 图片文件（必填，FormData格式，支持JPG、PNG、GIF格式，最大5MB）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "url": "/uploads/image-1623456789012.jpg"
    },
    "msg": "图片上传成功"
  }
  ```
- **说明**: 用于编辑器中上传图片，返回图片的访问URL
- **错误码**: 
  - 400: 请上传图片文件
  - 400: 只支持JPG、PNG、GIF格式的图片文件
  - 400: 图片文件大小不能超过5MB
  - 500: 图片上传失败，请稍后重试

### 统计笔记数据

- **URL**: `/api/notes/stats/overview`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `startDate`: 开始日期（可选，格式：YYYY-MM-DD）
  - `endDate`: 结束日期（可选，格式：YYYY-MM-DD）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "total": 1000,
      "active": 850,
      "top": 50,
      "recommended": 120
    },
    "msg": "获取统计数据成功"
  }
  ```
- **错误码**: 
  - 500: 获取统计数据失败，请稍后重试

### 笔记统计详情

- **URL**: `/api/notes/stats/detail`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `noteId`: 笔记ID（必填）
  - `timeRange`: 时间范围（可选，默认7d，可选值：1d, 7d, 30d, 90d）
  - `type`: 统计类型（可选，默认views，可选值：views, exposure, conversion_rate）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "dateStats": [
        {"date": "2023-01-01", "value": 120},
        {"date": "2023-01-02", "value": 150}
      ],
      "total": 1250,
      "average": 178.57
    },
    "msg": "获取统计详情成功"
  }
  ```
- **错误码**: 
  - 400: 请指定笔记ID
  - 400: 无效的时间范围
  - 400: 无效的统计类型
  - 500: 获取统计详情失败，请稍后重试

### 批量笔记统计接口（根据统计指标筛选笔记）

- **URL**: `/api/notes/stats/filter`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `condition`: 筛选条件对象（必填）
  - `timeRange`: 时间范围（可选，默认7d）
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "title": "React入门教程",
          "status": 1,
          "views_count": 1234,
          "exposure_count": 5678,
          "conversion_rate": 21.73
        }
      ],
      "total": 50,
      "page": 1,
      "pageSize": 10,
      "totalPages": 5
    },
    "msg": "获取筛选笔记列表成功"
  }
  ```
- **错误码**: 
  - 400: 请提供有效的筛选条件
  - 500: 获取筛选笔记列表失败，请稍后重试

## 分类管理接口

### 获取分类列表（树形结构）

- **URL**: `/api/categories`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `status`: 状态（可选）
- **返回数据**: 树形结构的分类列表

### 获取分类详情

- **URL**: `/api/categories/:id`
- **方法**: `GET`
- **认证**: 需要

### 创建分类

- **URL**: `/api/categories`
- **方法**: `POST`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `name`: 分类名称（必填）
  - `description`: 描述（可选）
  - `parent_id`/`parentId`: 父分类ID（可选，默认0）
  - `priority`: 优先级（1-10，默认10）
  - `status`: 状态（默认1）
  - `icon`: 图标（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 1,
      "name": "新分类",
      "parent_id": 0,
      "priority": 10,
      "status": 1,
      "created_at": "2023-01-01 10:00:00"
    },
    "msg": "分类创建成功"
  }
  ```
- **说明**: 父分类必须存在，优先级必须在1-10之间
- **错误码**: 
  - 400: 分类名称不能为空
  - 400: 分类名称已存在
  - 400: 优先级必须在1-10之间
  - 404: 父分类不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 更新分类

- **URL**: `/api/categories/:id`
- **方法**: `PUT`
- **认证**: 需要（管理员权限）
- **请求参数**: 同创建分类
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "name": "更新后的分类名称",
      "parent_id": 0,
      "priority": 5,
      "status": 1,
      "updated_at": "2023-01-02 15:30:00"
    },
    "msg": "分类更新成功"
  }
  ```
- **说明**: 分类不能设置自身或子孙分类为父分类，优先级必须在1-10之间
- **错误码**: 
  - 400: 分类名称不能为空
  - 400: 分类名称已存在
  - 400: 优先级必须在1-10之间
  - 400: 不能将自身或子孙分类设置为父分类
  - 404: 该分类不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 删除分类

- **URL**: `/api/categories/:id`
- **方法**: `DELETE`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "分类删除成功"
  }
  ```
- **说明**: 该分类下存在子分类或关联笔记时，无法删除
- **错误码**: 
  - 400: 该分类下存在子分类，无法删除
  - 400: 该分类下存在关联笔记，无法删除
  - 404: 该分类不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取分类笔记数量统计

- **URL**: `/api/categories/stats/note-count`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "category_id": 1,
        "category_name": "技术分享",
        "note_count": 50
      },
      {
        "category_id": 2,
        "category_name": "前端开发",
        "note_count": 30
      }
    ],
    "msg": "获取分类笔记数量统计成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

## 反馈管理接口

### 获取反馈列表

- **URL**: `/api/feedback`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）
  - `status`: 状态
  - `type`: 类型
  - `keyword`: 搜索关键词
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "type": "建议",
          "content": "网站加载速度有点慢",
          "contact": "user@example.com",
          "status": "待处理",
          "created_at": "2023-01-01 10:00:00",
          "reply": null
        }
      ],
      "total": 10,
      "page": 1,
      "pageSize": 10
    },
    "msg": "获取反馈列表成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取反馈详情

- **URL**: `/api/feedback/:id`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "type": "建议",
      "content": "网站加载速度有点慢",
      "contact": "user@example.com",
      "status": "待处理",
      "created_at": "2023-01-01 10:00:00",
      "reply": null,
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1"
    },
    "msg": "获取反馈详情成功"
  }
  ```
- **错误码**: 
  - 404: 该反馈不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 提交反馈（无需认证）

- **URL**: `/api/feedback/submit`
- **方法**: `POST`
- **响应状态码**: 201（成功创建）
- **请求参数**: 
  - `type`: 反馈类型（必填）
  - `content`: 反馈内容（必填，不能超过1000字）
  - `contact`: 联系方式（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 1
    },
    "msg": "反馈已收到，感谢您的建议！"
  }
  ```
- **错误码**: 
  - 400: 反馈类型和内容不能为空
  - 400: 反馈内容不能超过1000字
  - 500: 系统暂时无法访问，请稍后重试

### 更新反馈状态

- **URL**: `/api/feedback/:id/status`
- **方法**: `PUT`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `status`: 状态（必填）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "status": "已处理",
      "updated_at": "2023-01-02 15:30:00"
    },
    "msg": "反馈状态更新成功"
  }
  ```
- **错误码**: 
  - 400: 状态不能为空
  - 404: 该反馈不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 回复反馈

- **URL**: `/api/feedback/:id/reply`
- **方法**: `PUT`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `reply`: 回复内容（必填）
  - `status`: 状态（可选，默认值为 "已处理"）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "reply": "感谢您的反馈，我们已处理您的建议。",
      "status": "已处理",
      "replied_at": "2023-01-02 16:00:00"
    },
    "msg": "反馈回复成功"
  }
  ```
- **说明**: 如果反馈中包含有效联系方式，系统会尝试发送回复通知（需要配置邮件服务）
- **错误码**: 
  - 400: 回复内容不能为空
  - 404: 该反馈不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 删除反馈

- **URL**: `/api/feedback/:id`
- **方法**: `DELETE`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "反馈删除成功"
  }
  ```
- **错误码**: 
  - 404: 该反馈不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

## 系统配置接口

### 获取所有系统配置

- **URL**: `/api/config`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "site_name": "个人笔记分享平台",
      "site_description": "分享知识，传递价值",
      "contact_email": "contact@example.com",
      "search_index_enabled": true,
      "cache_expire_time": 3600
    },
    "msg": "获取系统配置成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取单个系统配置

- **URL**: `/api/config/:key`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "key": "site_name",
      "value": "个人笔记分享平台",
      "description": "网站名称"
    },
    "msg": "获取配置成功"
  }
  ```
- **错误码**: 
  - 404: 该配置不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 更新系统配置

- **URL**: `/api/config/:key`
- **方法**: `PUT`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `value`: 配置值（必填）
  - `description`: 描述（可选）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "key": "site_name",
      "value": "更新后的网站名称",
      "description": "网站名称"
    },
    "msg": "配置更新成功"
  }
  ```
- **说明**: 如果配置项不存在，则会创建新的配置项
- **错误码**: 
  - 400: 配置值不能为空
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 批量更新系统配置

- **URL**: `/api/config/batch/update`
- **方法**: `PUT`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  ```json
  [
    {
      "key": "配置键",
      "value": "配置值",
      "description": "描述（可选）"
    },
    // 更多配置项...
  ]
  ```
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "updated": 2
    },
    "msg": "批量配置更新成功"
  }
  ```
- **说明**: 配置数据必须是数组格式，至少提供一项配置
- **错误码**: 
  - 400: 配置数据不能为空且必须是数组格式
  - 400: 配置键和值不能为空
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 删除系统配置

- **URL**: `/api/config/:key`
- **方法**: `DELETE`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "配置删除成功"
  }
  ```
- **错误码**: 
  - 404: 该配置不存在
  - 400: 系统核心配置无法删除
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 数据库备份

- **URL**: `/api/config/database/backup`
- **方法**: `POST`
- **认证**: 需要（超级管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "backup_file": "backup_20230101.sql",
      "size": "10MB",
      "timestamp": "2023-01-01 10:00:00"
    },
    "msg": "数据库备份成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要超级管理员权限
  - 500: 数据库备份失败，请稍后重试

### 数据库恢复

- **URL**: `/api/config/database/restore`
- **方法**: `POST`
- **认证**: 需要（超级管理员权限）
- **请求参数**: 
  - `backup_file`: 备份文件名（必填）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "数据库恢复成功，请重启服务以确保数据生效"
  }
  ```
- **说明**: 恢复数据库操作会覆盖现有数据，请谨慎操作
- **错误码**: 
  - 400: 备份文件名不能为空
  - 404: 备份文件不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要超级管理员权限
  - 500: 数据库恢复失败，请稍后重试

### 清理缓存

- **URL**: `/api/config/cache/clear`
- **方法**: `POST`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true,
      "cleared_keys": 100
    },
    "msg": "缓存清理成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 缓存清理失败，请稍后重试

## 搜索相关接口

### 公共搜索接口（无需认证）

- **URL**: `/api/public/search`
- **方法**: `GET`
- **请求参数**: 
  - `keyword`: 搜索关键词（必填）
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
  - `categoryIds`: 分类ID列表（可选，用逗号分隔）
  - `timeRange`: 时间范围（可选，支持30days、90days）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "title": "笔记标题",
          "content": "笔记内容摘要",
          "views": 1234,
          "created_at": "2023-01-01 12:00:00",
          "category_name": "分类名称",
          "summary": "内容摘要..."
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10,
      "recommendedNotes": []
    },
    "msg": "搜索'关键词'找到 100 条结果"
  }
  ```
- **说明**: 搜索时会记录搜索日志；如无搜索结果，会返回热门笔记推荐
- **错误码**: 
  - 400: 搜索关键词不能为空
  - 500: 系统暂时无法访问，请稍后重试

### 获取热门搜索词（无需认证）

- **URL**: `/api/public/search/hot`
- **方法**: `GET`
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {"keyword": "React教程", "search_count": 1200},
      {"keyword": "JavaScript基础", "search_count": 980}
    ],
    "msg": "获取热门搜索词成功"
  }
  ```
- **错误码**: 
  - 500: 获取热门搜索词失败

### 获取搜索日志（管理员接口）

- **URL**: `/api/search/logs`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认20）
  - `keyword`: 搜索关键词筛选（可选）
  - `startDate`: 开始日期（可选，格式：YYYY-MM-DD）
  - `endDate`: 结束日期（可选，格式：YYYY-MM-DD）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "keyword": "React教程",
          "search_time": "2023-01-01 12:30:45"
        }
      ],
      "total": 500,
      "page": 1,
      "pageSize": 20,
      "totalPages": 25
    },
    "msg": "获取搜索日志成功"
  }
  ```
- **错误码**: 
  - 500: 获取搜索日志失败，请稍后重试

### 获取热门搜索词（管理员接口）

- **URL**: `/api/search/trending`
- **方法**: `GET`
- **认证**: 需要
- **请求参数**: 
  - `timeRange`: 时间范围（可选，默认7d，单位为天）
  - `limit`: 返回数量限制（可选，默认20）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "keyword": "React教程",
        "search_count": 1200,
        "last_searched": "2023-01-01 12:30:45"
      }
    ],
    "msg": "获取热门搜索词成功"
  }
  ```
- **错误码**: 
  - 500: 获取热门搜索词失败，请稍后重试

### 重建搜索索引（超级管理员接口）

- **URL**: `/api/search/index/rebuild`
- **方法**: `POST`
- **认证**: 需要
- **说明**: 仅超级管理员可执行此操作
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "搜索索引重建成功"
  }
  ```
- **错误码**: 
  - 403: 权限不足，仅超级管理员可执行此操作
  - 500: 重建索引失败，请检查MySQL配置和全文索引支持情况

### 获取搜索配置

- **URL**: `/api/system/settings/search`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "sensitive_words": ["敏感词1", "敏感词2"],
      "suggest_count": 5,
      "title_weight": 2,
      "content_weight": 1,
      "enable_suggest": true,
      "enable_trending": true
    },
    "msg": "获取搜索配置成功"
  }
  ```
- **错误码**: 
  - 500: 获取搜索配置失败，请稍后重试

### 更新搜索配置

- **URL**: `/api/system/settings/search`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  ```json
  {
    "sensitive_words": ["敏感词1", "敏感词2"],
    "suggest_count": 5,    // 1-20之间
    "title_weight": 2,     // 大于等于1
    "content_weight": 1,   // 大于等于1
    "enable_suggest": true,
    "enable_trending": true
  }
  ```
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": null,
    "msg": "更新搜索配置成功"
  }
  ```
- **错误码**: 
  - 400: 搜索建议数量应在1-20之间
  - 400: 标题权重应大于等于1
  - 400: 内容权重应大于等于1
  - 500: 更新搜索配置失败，请稍后重试

### 获取系统信息

- **URL**: `/api/config/system/info`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 包含Node.js版本、运行平台、架构、运行时间和内存使用情况的系统信息

### 获取搜索配置

- **URL**: `/api/config/search`
- **方法**: `GET`
- **认证**: 需要
- **返回数据**: 包含敏感词列表、搜索建议数量、权重配置等搜索相关配置

### 更新搜索配置

- **URL**: `/api/config/search`
- **方法**: `PUT`
- **认证**: 需要
- **请求参数**: 
  - `sensitive_words`: 敏感词列表（可选）
  - `suggest_count`: 搜索建议数量（可选，1-20之间）
  - `title_weight`: 标题权重（可选，大于等于1）
  - `content_weight`: 内容权重（可选，大于等于1）
  - `enable_suggest`: 是否启用搜索建议（可选）
  - `enable_trending`: 是否启用热门搜索（可选）

### 添加敏感词

- **URL**: `/api/config/search/sensitive-word`
- **方法**: `POST`
- **认证**: 需要
- **请求参数**: 
  - `word`: 敏感词（必填）

### 删除敏感词

- **URL**: `/api/config/search/sensitive-word/:word`
- **方法**: `DELETE`
- **认证**: 需要

### 公共获取系统配置

- **URL**: `/api/public/config`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 可公开访问的系统配置的键值对对象

## 公共访问接口

### 获取首页数据

- **URL**: `/api/public/home`
- **方法**: `GET`
- **认证**: 不需要

### 获取分类列表

- **URL**: `/api/public/categories`
- **方法**: `GET`
- **认证**: 不需要

### 获取分类下的笔记列表

- **URL**: `/api/public/categories/:categoryId/notes`
- **方法**: `GET`
- **认证**: 不需要
- **请求参数**: 
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认10）

### 获取笔记详情

- **URL**: `/api/public/notes/:id`
- **方法**: `GET`
- **认证**: 不需要

## 用户相关接口

### 获取首页数据

- **URL**: `/api/user/home`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "systemConfigs": {
        "site_name": "个人笔记分享平台",
        "site_description": "分享知识，传递价值"
      },
      "hotNotes": [
        {
          "id": 1,
          "title": "热门笔记标题",
          "category_name": "技术分享",
          "views": 1000,
          "created_at": "2023-01-01 10:00:00"
        }
      ],
      "weeklyNotes": [],
      "monthlyNotes": [],
      "topCategories": [
        {
          "id": 1,
          "name": "技术分享",
          "note_count": 50
        }
      ]
    },
    "msg": "获取首页数据成功"
  }
  ```
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

### 获取分类列表

- **URL**: `/api/user/categories`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "name": "技术分享",
        "note_count": 50,
        "children": [
          {
            "id": 2,
            "name": "前端开发",
            "note_count": 30
          }
        ]
      }
    ],
    "msg": "获取分类列表成功"
  }
  ```
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

### 获取分类下的笔记列表

- **URL**: `/api/user/categories/:id/notes`
- **方法**: `GET`
- **认证**: 不需要
- **请求参数**: 
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
  - `sortBy`: 排序方式（可选，默认newest，可选值：newest, mostViewed）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "title": "笔记标题",
          "category_name": "技术分享",
          "views": 1000,
          "created_at": "2023-01-01 10:00:00"
        }
      ],
      "total": 50,
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "category": {
        "id": 1,
        "name": "技术分享"
      }
    },
    "msg": "获取分类下的笔记列表成功"
  }
  ```
- **错误码**: 
  - 404: 该分类不存在或已被禁用
  - 500: 系统暂时无法访问，请稍后重试

### 获取笔记详情

- **URL**: `/api/user/notes/:id`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "title": "笔记标题",
      "content": "笔记内容...",
      "category_id": 1,
      "category_name": "技术分享",
      "views": 1001,
      "created_at": "2023-01-01 10:00:00",
      "updated_at": "2023-01-02 15:30:00",
      "is_top": 0,
      "is_hot": 1,
      "prevNote": {
        "id": 2,
        "title": "上一篇笔记标题"
      },
      "nextNote": {
        "id": 3,
        "title": "下一篇笔记标题"
      }
    },
    "msg": "获取笔记详情成功"
  }
  ```
- **说明**: 
  - 访问时会自动增加阅读量
  - 返回数据包含上下篇笔记信息
  - 笔记不存在或已下架时返回404错误
- **错误码**: 
  - 404: 该笔记不存在
  - 404: 该笔记已下架，无法查看
  - 500: 系统暂时无法访问，请稍后重试

### 搜索笔记

- **URL**: `/api/user/search`
- **方法**: `GET`
- **认证**: 不需要
- **请求参数**: 
  - `keyword`: 搜索关键词（必填，不能为空）
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
  - `sortBy`: 排序方式（可选，默认relevance，可选值：relevance, newest, mostViewed）
  - `categoryIds`: 分类ID列表（可选，用逗号分隔）
  - `timeRange`: 时间范围（可选，可选值：30days, 90days）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "title": "笔记标题",
          "category_name": "技术分享",
          "views": 1000,
          "created_at": "2023-01-01 10:00:00"
        }
      ],
      "total": 15,
      "page": 1,
      "pageSize": 10,
      "totalPages": 2,
      "recommendedNotes": []
    },
    "msg": "搜索'关键词'找到 15 条结果"
  }
  ```
- **说明**: 
  - 包含敏感词过滤功能
  - 返回数据包含高亮标题和摘要
  - 无搜索结果时会返回热门笔记推荐
  - 自动记录搜索日志
- **错误码**: 
  - 400: 搜索关键词不能为空
  - 500: 系统暂时无法访问，请稍后重试

### 获取热门搜索词

- **URL**: `/api/user/hot-searches`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "keyword": "React",
        "count": 150
      },
      {
        "keyword": "Vue",
        "count": 120
      }
    ],
    "msg": "获取热门搜索词成功"
  }
  ```
- **说明**: 返回最近7天内的热门搜索词，按搜索次数降序排列，最多返回10个
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

### 提交用户反馈

- **URL**: `/api/user/feedback`
- **方法**: `POST`
- **认证**: 不需要
- **请求参数**: 
  - `type`: 反馈类型（必填）
  - `content`: 反馈内容（必填，不能超过500字）
  - `contact`: 联系方式（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 1
    },
    "msg": "反馈已收到，感谢您的宝贵意见！"
  }
  ```
- **错误码**: 
  - 400: 反馈类型和内容不能为空
  - 400: 反馈内容不能超过500字
  - 500: 系统暂时无法访问，请稍后重试

### 获取系统配置

- **URL**: `/api/user/system-configs`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "site_name": "个人笔记分享平台",
      "site_description": "分享知识，传递价值",
      "contact_email": "contact@example.com"
    },
    "msg": "获取系统配置成功"
  }
  ```
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

## 搜索管理接口

### 重建搜索索引

- **URL**: `/api/search/index/rebuild`
- **方法**: `POST`
- **认证**: 需要（超级管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "索引重建任务已启动"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要超级管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取索引状态

- **URL**: `/api/search/index/status`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "status": "completed",
      "total": 100,
      "indexed": 100,
      "lastUpdated": "2023-01-01 10:00:00",
      "indexSize": "10MB"
    },
    "msg": "获取索引状态成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 搜索屏蔽列表管理

#### 获取屏蔽列表

- **URL**: `/api/search/blocked`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认20）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "keyword": "敏感词",
          "created_by": "admin",
          "created_at": "2023-01-01 10:00:00"
        }
      ],
      "total": 1,
      "page": 1,
      "pageSize": 10
    },
    "msg": "获取屏蔽列表成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

#### 添加屏蔽词

- **URL**: `/api/search/blocked/add`
- **方法**: `POST`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `keyword`: 敏感词（必填）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 1,
      "keyword": "敏感词"
    },
    "msg": "添加成功"
  }
  ```
- **错误码**: 
  - 400: 敏感词不能为空
  - 400: 该敏感词已存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

#### 移除屏蔽词

- **URL**: `/api/search/blocked/remove`
- **方法**: `POST`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `noteId`: 笔记ID
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "success": true
    },
    "msg": "移除成功"
  }
  ```
- **错误码**: 
  - 404: 该屏蔽词不存在
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 搜索日志与统计

#### 获取搜索日志

- **URL**: `/api/search/logs`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `keyword`: 搜索关键词（可选）
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
  - `page`: 页码（可选，默认1）
  - `pageSize`: 每页数量（可选，默认10）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "keyword": "React教程",
          "user_ip": "192.168.1.1",
          "user_agent": "Mozilla/5.0...",
          "timestamp": "2023-01-01 10:00:00",
          "result_count": 5
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 10
    },
    "msg": "获取搜索日志成功"
  }
  ```
- **错误码**: 
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取热门搜索词

- **URL**: `/api/search/trending`
- **方法**: `GET`
- **认证**: 需要（管理员权限）
- **请求参数**: 
  - `days`: 最近几天（可选，默认7天，最大30天）
  - `limit`: 返回数量（可选，默认20个，最大100个）
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "keyword": "React",
        "count": 150,
        "trend": "up"
      },
      {
        "keyword": "Vue",
        "count": 120,
        "trend": "down"
      }
    ],
    "msg": "获取热门搜索词成功"
  }
  ```
- **错误码**: 
  - 400: 天数不能大于30天
  - 400: 返回数量不能大于100个
  - 401: 未登录或登录已过期
  - 403: 权限不足，需要管理员权限
  - 500: 系统暂时无法访问，请稍后重试

### 获取热门搜索词

- **URL**: `/api/user/hot-searches`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "keyword": "React",
        "count": 150
      },
      {
        "keyword": "Vue",
        "count": 120
      }
    ],
    "msg": "获取热门搜索词成功"
  }
  ```
- **说明**: 返回最近7天内的热门搜索词，按搜索次数降序排列，最多返回10个
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

### 提交用户反馈

- **URL**: `/api/user/feedback`
- **方法**: `POST`
- **认证**: 不需要
- **请求参数**: 
  - `type`: 反馈类型（必填）
  - `content`: 反馈内容（必填，不能超过500字）
  - `contact`: 联系方式（可选）
- **返回数据**: 
  ```json
  {
    "code": 201,
    "data": {
      "id": 1
    },
    "msg": "反馈已收到，感谢您的宝贵意见！"
  }
  ```
- **错误码**: 
  - 400: 反馈类型和内容不能为空
  - 400: 反馈内容不能超过500字
  - 500: 系统暂时无法访问，请稍后重试

### 获取系统配置

- **URL**: `/api/user/system-configs`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "site_name": "个人笔记分享平台",
      "site_description": "分享知识，传递价值",
      "contact_email": "contact@example.com"
    },
    "msg": "获取系统配置成功"
  }
  ```
- **错误码**: 
  - 500: 系统暂时无法访问，请稍后重试

## 健康检查

- **URL**: `/api/health`
- **方法**: `GET`
- **认证**: 不需要
- **返回数据**: 
  ```json
  {
    "code": 200,
    "data": {
      "status": "ok",
      "version": "1.0.0",
      "uptime": "86400s"
    },
    "msg": "服务运行正常"
  }
  ```
- **错误码**: 
  - 503: 服务暂时不可用