# 个人笔记分享平台

## 项目简介

个人笔记分享平台是一个基于前后端分离架构的全功能Web应用，支持用户创建、编辑、分类、搜索和分享个人笔记。该平台提供了直观的用户界面和强大的后端API，确保用户体验流畅且数据安全。

主要功能包括：
- 用户注册、登录和认证系统
- 笔记创建、编辑和管理
- 笔记分类和标签系统
- 全文搜索功能
- 文件上传和管理
- 笔记分享和权限控制
- 响应式设计，支持多设备访问
- 管理员后台管理功能

## 项目结构

本项目采用前后端分离的架构，目录结构如下：

```
├── .gitignore              # Git忽略配置
├── README.md               # 项目说明文档
├── api-docs/               # API文档目录
│   ├── 分类管理API文档.md
│   ├── 反馈管理API文档.md
│   ├── 搜索管理API文档.md
│   ├── 用户管理API文档.md
│   ├── 笔记管理API文档.md
│   ├── 管理员管理API文档.md
│   ├── 系统配置API文档.md
│   ├── 认证与授权API文档.md
│   └── 路由权限管理API文档.md
├── backend/                # 后端API服务
│   ├── .env.example        # 环境变量配置示例
│   ├── .gitignore          # Git忽略配置
│   ├── API_DOCUMENTATION.md # API文档
│   ├── NEW_API_DOCUMENTATION.md # 新版API文档
│   ├── package.json        # 后端依赖配置
│   ├── src/                # 后端源代码
│   │   ├── database/       # 数据库连接和操作
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # API路由
│   │   ├── utils/          # 工具函数
│   │   └── server.js       # 服务器入口文件
│   ├── test/               # 测试文件目录
│   └── uploads/            # 上传文件存储
├── frontend/               # 前端应用
│   ├── .gitignore          # Git忽略配置
│   ├── README.md           # 前端说明文档
│   ├── index.html          # HTML入口文件
│   ├── package.json        # 前端依赖配置
│   ├── src/                # 前端源代码
│   │   ├── App.vue         # 应用入口组件
│   │   ├── api/            # API请求封装
│   │   ├── components/     # 可复用组件
│   │   ├── main.js         # 入口文件
│   │   ├── router/         # 路由配置
│   │   ├── store/          # 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面组件
│   └── vite.config.js      # Vite配置文件
└── package.json            # 项目根目录配置，包含启动脚本
```

## 快速开始

### 前提条件

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

在项目根目录执行以下命令安装所有依赖：

```bash
npm install          # 安装根目录依赖
cd backend && npm install  # 安装后端依赖
cd ../frontend && npm install  # 安装前端依赖
```

### 配置环境变量

确保在项目根目录和backend目录下都有`.env`文件，配置相应的环境变量。环境变量包括：
- 数据库连接信息（主机、端口、用户名、密码、数据库名）
- 服务器配置（端口、主机）
- JWT配置（密钥、过期时间）
- 文件上传配置（目录、最大文件大小）
- 安全配置（最大登录尝试次数、锁定时间）

可以参考`backend/.env.example`文件创建自己的环境变量配置。

### 启动开发服务器

在项目根目录执行以下命令同时启动前后端开发服务器：

```bash
npm run dev
```

此命令会同时启动：
- 后端服务器（端口3000）
- 前端开发服务器（端口8080）

前端请求会通过Vite的代理功能转发到后端API。启动成功后，可以通过以下方式访问：
- 前端应用：http://localhost:8080
- 后端API：http://localhost:3000/api

后端启动后会显示"数据库连接成功"和"服务器运行在 http://localhost:3000"的提示信息，表示服务已成功启动。

## 其他命令

### 仅启动后端

```bash
npm run dev:backend
```

### 仅启动前端

```bash
npm run dev:frontend
```

### 构建前端项目

```bash
npm run build
```

### 数据库迁移

```bash
npm run migrate
```

### 数据库备份

```bash
npm run backup
```

### API文档查看

```bash
npm run api-docs
```

API文档已生成在`backend/API_DOCUMENTATION.md`和`api-docs/`目录中。

## 测试

项目包含多种测试脚本：
- 后端测试文件位于`backend/test/`目录
- 前端测试文件位于`frontend/`目录
- 项目启动测试脚本用于检查项目结构和配置是否正确

## 注意事项

1. 确保后端和前端的端口配置正确，避免端口冲突
2. 前端请求通过`/api`前缀转发到后端
3. 上传的文件存储在`backend/uploads`目录下
4. 日志文件存储在`backend/logs`目录下
5. 数据库配置在`.env`文件中定义

## 项目技术栈

### 后端
- Express.js - Web框架
- MySQL2 - 数据库连接
- JWT - 用户认证
- Multer - 文件上传
- Sharp - 图像处理
- Nodemon - 开发热重载工具
- Bcryptjs - 密码加密
- Helmet - 安全增强
- Express-rate-limit - 请求限流
- XSS - 跨站脚本防护

### 前端
- Vue 3 - 前端框架
- Element Plus - UI组件库
- Axios - HTTP客户端
- Vite - 构建工具
- Vue Router - 路由管理
- @vueup/vue-quill - 富文本编辑器
- echarts - 数据可视化
- mavon-editor - Markdown编辑器
- quill-markdown - Markdown支持
- quill-markdown-shortcuts - Markdown快捷键支持
- vue-demi - Vue 2/3兼容层

## 开发建议

1. 在开发前确保所有依赖已正确安装
2. 遵循代码风格规范
3. 为新功能编写适当的文档
4. 定期备份数据库
5. 在修改代码后，使用`npm run dev`重启开发服务器以应用更改
6. 前端开发时，建议使用Chrome浏览器的Vue DevTools扩展进行调试
7. 后端开发时，可以使用Postman或类似工具测试API端点
8. 对于前端依赖，注意当前项目使用的Vite版本需要Node.js 20.19+或22.12+版本，尽管在较低版本（如20.13.1）上也能运行，但可能会有警告

## 已知问题

- 前端使用的Vite和@vitejs/plugin-vue包需要Node.js 20.19+或22.12+版本，但在当前Node.js 20.13.1版本上仍然可以运行
- 前端依赖中存在3个中等严重程度的安全漏洞（可通过`npm audit fix --force`命令尝试修复）
- 后端使用的multer@1.4.5-lts.2包已被标记为弃用，建议未来升级到2.x版本