# 路由权限管理 API 文档

## 概述
本模块包含路由权限相关的接口，用于前端动态构建路由表和权限控制。

## 接口列表

### 1. 获取用户可访问的路由列表

**路径**: `GET /api/route-permissions/accessible-routes`

**功能**: 根据用户权限获取可访问的路由列表，用于前端动态构建路由表

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取可访问路由成功",
  "data": [
    {
      "path": "string",
      "name": "string",
      "component": "string",
      "meta": {
        "title": "string",
        "icon": "string",
        "requiresAuth": "boolean",
        "permission": "string"
      }
    }
  ]
}
```

**说明**: 
- 超级管理员 (`role_code: super_admin`) 会返回所有路由
- 其他角色会根据其权限获取对应的路由列表
- permission为null的路由表示不需要特定权限

---

## 系统支持的路由配置说明

系统支持的所有路由配置如下（仅供参考，实际路由可能根据系统版本有所不同）：

```json
[
  {
    "path": "/dashboard",
    "name": "Dashboard",
    "component": "Dashboard",
    "meta": {
      "title": "仪表盘",
      "icon": "dashboard",
      "requiresAuth": true,
      "permission": null // 仪表盘不需要特定权限
    }
  },
  {
    "path": "/admins",
    "name": "Admins",
    "component": "Admins",
    "meta": {
      "title": "管理员管理",
      "icon": "users",
      "requiresAuth": true,
      "permission": "admin_manage" // 需要管理员管理权限
    }
  },
  {
    "path": "/notes",
    "name": "Notes",
    "component": "Notes",
    "meta": {
      "title": "笔记管理",
      "icon": "file-text",
      "requiresAuth": true,
      "permission": "article_manage" // 需要文章管理权限
    }
  },
  {
    "path": "/categories",
    "name": "Categories",
    "component": "Categories",
    "meta": {
      "title": "分类管理",
      "icon": "list",
      "requiresAuth": true,
      "permission": "category_manage" // 需要分类管理权限
    }
  },
  {
    "path": "/feedbacks",
    "name": "Feedbacks",
    "component": "Feedbacks",
    "meta": {
      "title": "反馈管理",
      "icon": "message-circle",
      "requiresAuth": true,
      "permission": "feedback_manage" // 需要反馈管理权限
    }
  },
  {
    "path": "/logs",
    "name": "Logs",
    "component": "Logs",
    "meta": {
      "title": "日志管理",
      "icon": "file-exclamation",
      "requiresAuth": true,
      "permission": "log_view" // 需要日志查看权限
    }
  },
  {
    "path": "/system",
    "name": "System",
    "component": "System",
    "meta": {
      "title": "系统设置",
      "icon": "settings",
      "requiresAuth": true,
      "permission": "system_config" // 需要系统配置权限
    }
  }
]
```

## 权限说明
- 该接口需要用户登录认证
- 系统使用`role_code`字段进行角色判断：
  - 超级管理员 (`role_code: super_admin`) 可以获取所有路由
  - 管理员 (`role_code: admin`) 拥有大部分管理路由的访问权限
  - 基础用户 (`role_code: user`) 拥有基础路由的访问权限
- 普通管理员只能获取其权限范围内的路由

## 路由权限配置说明
- 路由配置中的permission字段表示访问该路由所需的权限编码
- 如果permission为null，表示该路由不需要特定权限，所有已登录用户都可以访问
- 前端根据返回的路由列表动态构建可访问的菜单和路由

## 使用场景
- 前端初始化时调用此接口获取当前用户可访问的路由
- 根据返回的路由列表动态注册路由和渲染菜单
- 实现基于角色的访问控制(RBAC)