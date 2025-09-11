# 文件配置API使用说明

## 概述

系统使用统一的配置管理接口来处理文件上传相关的配置数据。本文档详细说明前端如何调用API修改文件类型、大小等文件配置数据。

## 配置项说明

文件上传相关的配置键名包括：

| 配置键名 | 数据类型 | 说明 | 示例值 |
|---------|---------|------|--------|
| file.max_size | 数字 | 文件最大大小(MB) | 12 |
| file.max_size_bytes | 数字 | 文件最大大小(字节) | 12582912 |
| file.allowed_types | JSON字符串 | 允许的文件类型数组 | `["image/jpeg","image/png","image/gif","image/webp","application/pdf"]` |
| file.max_count | 数字 | 最大文件数量 | 5 |
| file.enable | 数字 | 是否启用文件上传(1=启用,0=禁用) | 1 |
| file.storage_path | 字符串 | 文件存储路径 | uploads |

## API接口

### 1. 单个更新配置

**请求方式**: PUT
**请求路径**: `/api/config/:key`
**权限要求**: 需要管理员认证

**请求参数**:
- URL参数: `key` - 配置键名（如`file.max_size`）
- 请求体: 
  ```json
  {
    "value": "配置值",
    "description": "配置描述（可选）"
  }
  ```

**示例请求**: 更新文件最大大小为12MB

```javascript
// 更新file.max_size为12
fetch('/api/config/file.max_size', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 你的token'
  },
  body: JSON.stringify({
    value: 12,
    description: '文件最大大小(MB)'
  })
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('配置更新成功');
  } else {
    console.error('配置更新失败:', data.msg);
  }
});
```

**示例请求**: 更新允许的文件类型

```javascript
// 更新file.allowed_types
fetch('/api/config/file.allowed_types', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 你的token'
  },
  body: JSON.stringify({
    value: JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
    description: '允许的文件类型'
  })
});
```

### 2. 批量更新配置

**请求方式**: PUT
**请求路径**: `/api/config/batch/update`
**权限要求**: 需要管理员认证

**请求参数**:
- 请求体: 配置项数组
  ```json
  [
    {
      "key": "配置键名1",
      "value": "配置值1",
      "description": "配置描述（可选）"
    },
    {
      "key": "配置键名2",
      "value": "配置值2",
      "description": "配置描述（可选）"
    }
  ]
  ```

**示例请求**: 批量更新文件上传配置

```javascript
// 批量更新文件上传相关配置
fetch('/api/config/batch/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 你的token'
  },
  body: JSON.stringify([
    {
      key: 'file.max_size',
      value: 12,
      description: '文件最大大小(MB)'
    },
    {
      key: 'file.max_size_bytes',
      value: 12582912,
      description: '文件最大大小(字节)'
    },
    {
      key: 'file.allowed_types',
      value: JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
    },
    {
      key: 'file.max_count',
      value: 5
    },
    {
      key: 'file.enable',
      value: 1
    }
  ])
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('批量配置更新成功', data.data.updatedKeys);
  } else {
    console.error('批量配置更新失败:', data.msg);
  }
});
```

### 3. 获取单个配置

**请求方式**: GET
**请求路径**: `/api/config/:key`
**权限要求**: 需要管理员认证

**示例请求**:

```javascript
// 获取file.max_size配置
fetch('/api/config/file.max_size', {
  headers: {
    'Authorization': 'Bearer 你的token'
  }
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    console.log('配置值:', data.data.config_value);
  } else {
    console.error('获取配置失败:', data.msg);
  }
});
```

### 4. 获取所有系统配置

**请求方式**: GET
**请求路径**: `/api/config/`
**权限要求**: 需要管理员认证

**示例请求**:

```javascript
// 获取所有系统配置
fetch('/api/config/', {
  headers: {
    'Authorization': 'Bearer 你的token'
  }
})
.then(response => response.json())
.then(data => {
  if (data.code === 200) {
    // 获取文件相关配置
    const fileMaxSize = data.data['file.max_size'];
    const fileAllowedTypes = data.data['file.allowed_types'] ? JSON.parse(data.data['file.allowed_types']) : [];
    // ...其他配置
  } else {
    console.error('获取配置失败:', data.msg);
  }
});
```

## 注意事项

1. 所有配置修改接口都需要管理员权限（通过JWT认证）
2. 更新`file.max_size`时，请确保同时更新`file.max_size_bytes`以保持一致性
   - 1MB = 1024 * 1024 字节
   - 例如: 12MB = 12 * 1024 * 1024 = 12582912 字节
3. `file.allowed_types`的值必须是JSON字符串格式的数组
4. 建议使用批量更新接口一次性修改所有相关的文件配置，以提高效率
5. 修改配置后，系统会自动更新配置缓存