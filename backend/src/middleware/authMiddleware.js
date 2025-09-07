
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
require('dotenv').config();

// 认证中间件 - 验证JWT令牌
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头中获取授权令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, data: null, msg: '未提供有效的令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ code: 401, data: null, msg: '令牌已过期，请重新登录' });
      }
      return res.status(401).json({ code: 401, data: null, msg: '无效的令牌' });
    }
    
    // 检查管理员是否存在且状态正常
    const [admins] = await pool.execute(
      'SELECT a.*, r.name as role_name, r.code as role_code FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?',
      [decoded.id]
    );
    
    if (admins.length === 0) {
      return res.status(401).json({ code: 401, data: null, msg: '管理员不存在' });
    }
    
    const admin = admins[0];
    
    if (admin.status !== 1) {
      return res.status(401).json({ code: 401, data: null, msg: '管理员账户已被禁用' });
    }
    
    // 如果是超级管理员，设置所有信息
    if (admin.role_code === 'super_admin') {
      req.user = decoded;
      req.admin = admin;
      // 超级管理员拥有所有权限
      req.permissions = ['article_manage', 'category_manage', 'user_manage', 'system_config', 'search_manage', 'feedback_manage', 'system_monitor', 'admin_manage', 'log_view'];
      return next();
    }
    
    // 对于非超级管理员，获取其权限列表
    const [permissions] = await pool.execute(
      'SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [admin.role_id]
    );
    
    const permissionNames = permissions.map(p => p.name);
    admin.permissions = permissionNames;
    
    // 将管理员信息和权限放入请求对象
    req.user = decoded;
    req.admin = admin;
    req.permissions = permissionNames;
    
    // 继续处理请求
    next();
    
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '认证失败，请稍后重试' });
  }
};

// 权限验证中间件 - 检查是否有特定权限
const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // 确保已通过认证中间件
      if (!req.user) {
        return res.status(401).json({ code: 401, data: null, msg: '请先登录' });
      }
      
      // 如果是超级管理员，拥有所有权限
      if (req.admin && req.admin.role_code === 'super_admin') {
        return next();
      }
      
      // 检查是否有指定权限
      if (!req.permissions || !req.permissions.includes(requiredPermission)) {
        return res.status(403).json({ code: 403, data: null, msg: '没有权限执行此操作' });
      }
      
      // 有权限，继续处理请求
      next();
      
    } catch (error) {
      console.error('权限验证失败:', error);
      return res.status(500).json({ code: 500, data: null, msg: '权限验证失败，请稍后重试' });
    }
  };
};

// 批量权限验证中间件 - 检查是否有任意一个指定权限
const anyPermissionMiddleware = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // 确保已通过认证中间件
      if (!req.user) {
        return res.status(401).json({ code: 401, data: null, msg: '请先登录' });
      }
      
      // 如果是超级管理员，拥有所有权限
      if (req.admin && req.admin.role_code === 'super_admin') {
        return next();
      }
      
      // 检查是否有任意一个指定权限
      const hasAnyPermission = req.permissions && req.permissions.some(permission => 
        requiredPermissions.includes(permission)
      );
      
      if (!hasAnyPermission) {
        return res.status(403).json({ code: 403, data: null, msg: '没有权限执行此操作' });
      }
      
      // 有权限，继续处理请求
      next();
      
    } catch (error) {
      console.error('权限验证失败:', error);
      return res.status(500).json({ code: 500, data: null, msg: '权限验证失败，请稍后重试' });
    }
  };
};

// 记录前台用户操作日志中间件
const userActivityLogger = async (req, res, next) => {
  try {
    // 记录某些特定的前台操作
    const loggablePaths = [
      '/api/user/notes/',  // 笔记详情页
      '/api/user/search',  // 搜索操作
      '/api/user/categories/' // 分类浏览
    ];
    
    // 检查当前请求路径是否需要记录
    const shouldLog = loggablePaths.some(path => 
      req.path.startsWith(path) || req.path === path.slice(0, -1)
    );
    
    if (shouldLog) {
      // 获取客户端IP
      const ip = req.ip || req.connection.remoteAddress;
      
      // 获取用户代理
      const userAgent = req.headers['user-agent'] || '';
      
      // 确定操作类型
      let actionType = '浏览';
      if (req.path.includes('/search')) {
        actionType = '搜索';
      }
      
      // 构建操作描述
      let description = `${actionType}: ${req.path}`;
      if (req.query.keyword) {
        description = `${actionType}: ${req.query.keyword}`;
      }
      
      // 记录用户操作日志
      await pool.execute(
        'INSERT INTO user_activity_logs (ip, user_agent, action_type, description, created_at) VALUES (?, ?, ?, ?, NOW())',
        [ip, userAgent, actionType, description]
      );
    }
    
    // 继续处理请求
    next();
    
  } catch (error) {
    console.error('记录用户操作日志失败:', error);
    // 即使记录日志失败，也继续处理请求
    next();
  }
};

// 缓存控制中间件
const cacheControl = (seconds = 3600) => {
  return (req, res, next) => {
    // 设置缓存控制头
    res.setHeader('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
};

// 防爬虫中间件
const antiCrawler = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // 常见的爬虫User-Agent关键词
  const crawlerKeywords = [
    'bot', 'spider', 'crawler', 'slurp', 'curl', 'wget',
    'python-requests', 'scrapy', 'node-fetch', 'axios'
  ];
  
  // 检查是否是爬虫
  const isCrawler = crawlerKeywords.some(keyword => 
    userAgent.toLowerCase().includes(keyword)
  );
  
  if (isCrawler) {
    // 对于爬虫，可以返回403或者返回正常数据但减少频率
    // 这里简单返回403
    return res.status(403).json({ code: 403, data: null, msg: '爬虫访问被禁止' });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  permissionMiddleware,
  anyPermissionMiddleware,
  userActivityLogger,
  cacheControl,
  antiCrawler
};