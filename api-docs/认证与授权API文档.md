# 认证与授权 API 文档

## 概述
本模块包含用户登录、注册、登出、修改密码等认证相关接口。

## 接口列表

### 1. 获取验证码

**路径**: `GET /api/auth/captcha`

**说明**: 实际返回的是图片文件(SVG格式)，响应头中包含X-Captcha-Id用于后续验证

**功能**: 生成并返回验证码图片

**参数**: 无

**返回**: 图片文件 (SVG格式)

**响应头**: 
- `X-Captcha-Id`: 验证码ID，用于后续登录验证

**示例**: 直接访问接口获取验证码图片

---

### 2. 用户登录

**路径**: `POST /api/auth/login`

**说明**: 成功登录后返回的admin对象包含id、username、nickname、role和permissions数组

**功能**: 用户登录认证，验证成功后返回JWT令牌

**参数**: 
```json
{
  "username": "string", // 用户名
  "password": "string", // 密码
  "captcha": "string", // 验证码
  "captchaId": "string" // 验证码ID（从获取验证码接口的X-Captcha-Id响应头中获取）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "string", // JWT令牌
    "refreshToken": "string", // 刷新令牌
    "admin": {
      "id": "number",
      "username": "string",
      "nickname": "string",
      "role": "string",
      "permissions": ["string"]
    }
  }
}
```

**错误码**: 
- 400: 验证码错误/用户名或密码错误
- 500: 登录失败，请稍后重试

---

### 3. 用户登出

**路径**: `POST /api/auth/logout`

**功能**: 用户登出，清除用户会话

**参数**: 无

**返回**: 
```json
{
  "code": 200,
  "msg": "登出成功",
  "data": null
}
```

---

### 4. 修改密码

**路径**: `POST /api/auth/change-password`

**功能**: 用户修改自己的密码

**参数**: 
```json
{
  "currentPassword": "string", // 当前密码
  "newPassword": "string" // 新密码（长度不少于6位）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "密码修改成功，请重新登录",
  "data": null
}
```

**错误码**: 
- 400: 原密码错误/新密码不符合要求
- 500: 密码修改失败，请稍后重试

---

### 5. 重置密码 (超级管理员专用)

**路径**: `POST /api/auth/reset-password`

**说明**: 此接口需要超级管理员权限

**功能**: 超级管理员重置指定管理员的密码

**参数**: 
```json
{
  "adminId": "number", // 管理员ID
  "newPassword": "string" // 新密码（长度不少于6位）
}
```

**返回**: 
```json
{
  "code": 200,
  "msg": "密码重置成功",
  "data": null
}
```

**错误码**: 
- 403: 权限不足，仅超级管理员可执行此操作
- 404: 用户不存在
- 500: 密码重置失败，请稍后重试

---

### 6. 刷新令牌

**路径**: `POST /api/auth/refresh`

**说明**: 此接口通过请求体传递数据，而不是仅通过Authorization头

**功能**: 使用现有令牌获取新的访问令牌

**参数**: 无（令牌通过Authorization头传递，格式为Bearer {token}）

**返回**: 
```json
{
  "code": 200,
  "msg": "令牌刷新成功",
  "data": {
    "token": "string", // 新的JWT令牌
    "refreshToken": "string" // 新的刷新令牌
  }
}
```

**错误码**: 
- 401: 刷新令牌无效或已过期
- 500: 令牌刷新失败，请稍后重试

## 权限说明
- 所有接口均需要相应的权限访问
- 敏感操作(如重置密码)需要超级管理员权限

## 安全说明
- 密码通过bcrypt进行加密存储
- JWT令牌有效期为1小时
- 刷新令牌有效期为7天
- 登录失败超过5次，账号将被锁定30分钟