const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./database/db');
require('dotenv').config();

// 创建Express应用
const app = express();

// 配置中间件 - 明确允许暴露自定义响应头
app.use(cors({
  exposedHeaders: ['X-Captcha-Id'], // 允许前端访问这个自定义响应头
  origin: '*', // 开发环境允许所有来源
  credentials: true, // 允许发送凭证
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 配置请求速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5000, // 开发环境进一步放宽限制，每个IP最多5000个请求
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 测试数据库连接
async function initServer() {
  try {
    await testConnection();

    // 引入路由
    const authRoutes = require('./routes/authRoutes');
    const adminRoutes = require('./routes/adminRoutes');
    const noteRoutes = require('./routes/noteRoutes');
    const categoryRoutes = require('./routes/categoryRoutes');
    const feedbackRoutes = require('./routes/feedbackRoutes');
    const configRoutes = require('./routes/configRoutes');
    const publicRoutes = require('./routes/publicRoutes');
    const userRoutes = require('./routes/userRoutes');
    const searchRoutes = require('./routes/searchRoutes');
    const routePermissionRoutes = require('./routes/routePermissionRoutes');
    const sensitiveWordRoutes = require('./routes/sensitiveWordRoutes');
    const fileRoutes = require('./routes/fileRoutes');

    // 使用路由
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/notes', noteRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/config', configRoutes);
    app.use('/api/public', publicRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/route-permissions', routePermissionRoutes);
    app.use('/api/sensitive-words', sensitiveWordRoutes);
    app.use('/api/file', fileRoutes);

    // 健康检查接口
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

    // 404错误处理
    app.use((req, res, next) => {
      res.status(404).json({ code: 404, data: null, msg: 'Not Found' });
    });

    // 错误处理中间件
    app.use((err, req, res, next) => {
      console.error('Server error:', err.stack);
      res.status(500).json({
        code: 500,
        data: null,
        msg: '系统暂时无法访问，请稍后重试'
      });
    });

    // 启动服务器 - 明确使用端口3000
    const PORT = 3000;
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在 http://${process.env.HOST || 'localhost'}:${PORT}`);
    });

    // 处理服务器关闭
    process.on('SIGINT', () => {
      console.log('服务器正在关闭...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('服务器启动失败:', error.message);
    process.exit(1);
  }
}

// 初始化服务器
initServer();