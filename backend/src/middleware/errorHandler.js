const { pool } = require('../database/db');

// 通用错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // 确定错误状态码
  const statusCode = err.statusCode || 500;
  
  // 确定错误消息
  const message = err.message || '系统内部错误，请稍后重试';
  
  // 记录错误日志到数据库
  logErrorToDatabase(err, req);
  
  // 根据环境返回不同详细程度的错误信息
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    code: statusCode,
    data: null,
    msg: message,
    // 非生产环境返回详细错误信息
    ...(!isProduction && { error: err.message, stack: err.stack })
  });
};

// 记录错误日志到数据库
const logErrorToDatabase = async (err, req) => {
  try {
    // 获取请求信息
    const path = req.path || 'unknown';
    const method = req.method || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const params = JSON.stringify(req.params || {});
    const query = JSON.stringify(req.query || {});
    const body = JSON.stringify(getSafeBody(req.body || {}));
    
    // 获取错误信息
    const errorMessage = err.message || 'Unknown error';
    const errorStack = err.stack || '';
    const errorType = err.name || 'Error';
    
    // 限制长度，避免数据库字段溢出
    const truncatedStack = errorStack.length > 2000 ? errorStack.substring(0, 2000) : errorStack;
    
    // 记录到数据库
    await pool.execute(
      'INSERT INTO error_logs (path, method, ip, user_agent, params, query, body, error_message, error_stack, error_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [path, method, ip, userAgent, params, query, body, errorMessage, truncatedStack, errorType]
    );
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
};

// 获取安全的请求体（过滤敏感信息）
const getSafeBody = (body) => {
  const safeBody = { ...body };
  
  // 过滤敏感信息
  const sensitiveFields = ['password', 'token', 'auth', 'creditCard', 'cardNumber'];
  
  sensitiveFields.forEach(field => {
    Object.keys(safeBody).forEach(key => {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        safeBody[key] = '******';
      }
    });
  });
  
  return safeBody;
};

// 404错误处理中间件
const notFoundHandler = (req, res, next) => {
  const error = new Error(`请求的资源 ${req.originalUrl} 不存在`);
  error.statusCode = 404;
  next(error);
};

// 验证中间件 - 验证请求参数
const validationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      // 合并所有参数（查询参数、路径参数、请求体）
      const allParams = {
        ...req.query,
        ...req.params,
        ...req.body
      };
      
      // 验证参数
      const validationResult = schema.validate(allParams);
      
      if (validationResult.error) {
        const errorMessage = validationResult.error.details.map(detail => detail.message).join(', ');
        return res.status(400).json({
          code: 400,
          data: null,
          msg: errorMessage
        });
      }
      
      // 验证通过，继续处理请求
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 速率限制中间件
const rateLimiterMiddleware = (options = {}) => {
  const { max = 100, windowMs = 60000 } = options; // 默认1分钟最多100次请求
  
  // 存储IP地址和请求计数
  const requestCounts = new Map();
  
  return (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // 初始化或更新请求计数
      if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
      }
      
      const requests = requestCounts.get(ip);
      
      // 过滤掉过期的请求
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      
      // 检查是否超过限制
      if (recentRequests.length >= max) {
        return res.status(429).json({
          code: 429,
          data: null,
          msg: '请求过于频繁，请稍后再试'
        });
      }
      
      // 添加当前请求时间戳
      recentRequests.push(now);
      requestCounts.set(ip, recentRequests);
      
      // 继续处理请求
      next();
    } catch (error) {
      next(error);
    }
  };
};

// CORS中间件配置
const corsMiddleware = (req, res, next) => {
  // 设置允许的源
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 设置允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // 设置允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 继续处理请求
  next();
};

// 安全增强中间件
const securityMiddleware = (req, res, next) => {
  // 防止XSS攻击
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 点击劫持保护
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 内容安全策略
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );
  
  // 严格传输安全
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 继续处理请求
  next();
};

// 请求日志中间件
const requestLogger = (req, res, next) => {
  // 不记录静态文件请求
  if (req.path.startsWith('/public/') || req.path.includes('.css') || req.path.includes('.js') || req.path.includes('.jpg') || req.path.includes('.png')) {
    return next();
  }
  
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const path = req.originalUrl;
  
  // 记录请求开始
  console.log(`[${new Date().toISOString()}] ${ip} ${method} ${path}`);
  
  // 监听响应结束事件，记录响应信息
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    console.log(`[${new Date().toISOString()}] ${ip} ${method} ${path} ${statusCode} ${duration}ms`);
  });
  
  // 继续处理请求
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  validationMiddleware,
  rateLimiterMiddleware,
  corsMiddleware,
  securityMiddleware,
  requestLogger
};