# 系统配置 API 文档

## 概述
本模块包含系统配置管理、数据库备份恢复、缓存清理等系统级操作接口。

## 接口列表

### 1. 获取所有系统配置

**路径**: `GET /api/configs`

**功能**: 获取所有系统配置项

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取系统配置成功",
  "data": [
    {
      "id": "number",
      "config_key": "string",
      "config_value": "string",
      "description": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

### 2. 获取单个系统配置

**路径**: `GET /api/configs/:key`

**功能**: 获取指定键的系统配置值

**参数**: 
- key: 配置键名（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "获取配置成功",
  "data": {
    "config_key": "string",
    "config_value": "string",
    "description": "string"
  }
}
```

**错误码**: 
- 404: 配置项不存在

---

### 3. 更新单个系统配置

**路径**: `PUT /api/configs/:key`

**功能**: 更新指定键的系统配置值

**参数**: 
```json
{
  "config_value": "string", // 新的配置值
  "description": "string" // 配置描述（可选）
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "更新配置成功",
  "data": null
}
```

**错误码**: 
- 404: 配置项不存在
- 500: 更新配置失败

---

### 4. 批量更新系统配置

**路径**: `POST /api/configs/batch-update`

**功能**: 批量更新多个系统配置项

**参数**: 
```json
{
  "configs": [
    {
      "config_key": "string",
      "config_value": "string",
      "description": "string" // 可选
    }
  ]
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "批量更新配置成功",
  "data": null
}
```

**错误码**: 
- 400: 配置项不能为空
- 500: 批量更新配置失败

---

### 5. 删除系统配置

**路径**: `DELETE /api/configs/:key`

**功能**: 删除指定键的系统配置项

**参数**: 
- key: 配置键名（路径参数）

**返回**: 
```json
{
  "code": 200,
  "message": "删除配置成功",
  "data": null
}
```

**错误码**: 
- 400: 不允许删除系统关键配置
- 404: 配置项不存在
- 500: 删除配置失败

---

### 6. 数据库备份

**路径**: `POST /api/configs/db-backup`

**功能**: 执行数据库备份操作

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "数据库备份成功",
  "data": {
    "filename": "string",
    "path": "string",
    "size": "string"
  }
}
```

**错误码**: 
- 500: 数据库备份失败

---

### 7. 数据库恢复

**路径**: `POST /api/configs/db-restore`

**功能**: 从备份文件恢复数据库

**参数**: 
```json
{
  "backupFile": "string" // 备份文件名
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "数据库恢复成功",
  "data": null
}
```

**错误码**: 
- 400: 备份文件不存在
- 500: 数据库恢复失败

---

### 8. 清理缓存

**路径**: `POST /api/configs/clear-cache`

**功能**: 清理系统缓存

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "缓存清理成功",
  "data": null
}
```

**错误码**: 
- 500: 清理缓存失败

---

### 9. 获取系统信息

**路径**: `GET /api/configs/system-info`

**功能**: 获取系统运行信息

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取系统信息成功",
  "data": {
    "nodeVersion": "string",
    "databaseVersion": "string",
    "systemUptime": "string",
    "memoryUsage": {
      "rss": "string",
      "heapTotal": "string",
      "heapUsed": "string"
    },
    "cpuUsage": "string",
    "diskUsage": {
      "total": "string",
      "free": "string",
      "used": "string"
    }
  }
}
```

---

### 10. 获取搜索配置

**路径**: `GET /api/configs/search`

**功能**: 获取搜索相关配置

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "message": "获取搜索配置成功",
  "data": {
    "searchEnabled": "boolean",
    "minKeywordLength": "number",
    "maxResults": "number",
    "cacheTtl": "number"
  }
}
```

---

### 11. 更新搜索配置

**路径**: `PUT /api/configs/search`

**功能**: 更新搜索相关配置

**参数**: 
```json
{
  "searchEnabled": "boolean",
  "minKeywordLength": "number",
  "maxResults": "number",
  "cacheTtl": "number"
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "更新搜索配置成功",
  "data": null
}
```

**错误码**: 
- 500: 更新搜索配置失败

---

### 12. 添加敏感词

**路径**: `POST /api/configs/sensitive-words/add`

**功能**: 添加系统敏感词

**参数**: 
```json
{
  "words": ["string"] // 敏感词数组
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "添加敏感词成功",
  "data": null
}
```

**错误码**: 
- 400: 敏感词不能为空
- 500: 添加敏感词失败

---

### 13. 删除敏感词

**路径**: `POST /api/configs/sensitive-words/remove`

**功能**: 删除系统敏感词

**参数**: 
```json
{
  "word": "string" // 要删除的敏感词
}
```

**返回**: 
```json
{
  "code": 200,
  "message": "删除敏感词成功",
  "data": null
}
```

**错误码**: 
- 400: 敏感词不能为空
- 500: 删除敏感词失败

## 权限说明
- 所有接口均需要超级管理员权限
- 部分操作（如数据库恢复）会进行二次确认

## 安全说明
- 数据库备份文件会存储在安全目录
- 敏感操作会记录详细的操作日志
- 系统信息会进行适当的脱敏处理

## 操作建议
- 定期执行数据库备份操作
- 谨慎修改系统核心配置
- 在进行数据库恢复前确保已备份当前数据