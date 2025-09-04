const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logLogin, logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');
const { generateVerificationCode, generateCaptchaImage, storeCaptcha, validateCaptcha } = require('../utils/security');

// 获取验证码接口
router.get('/captcha', async (req, res) => {
  try {
    // 生成验证码文本
    const code = generateVerificationCode(4);
    
    // 生成验证码图片
    const imageBuffer = generateCaptchaImage(code);
    
    // 存储验证码
    const captchaId = storeCaptcha(code);
    
    // 设置响应头
    res.set('Content-Type', 'image/svg+xml');
    res.set('X-Captcha-Id', captchaId);
    
    // 发送SVG
    return res.send(imageBuffer);
  } catch (error) {
    console.error('生成验证码失败:', error);
    return res.status(500).json(formatError('获取验证码失败，请稍后重试', 500));
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { username, password, captcha, captchaId } = req.body;
    
    // 检查参数
  if (!username || !password || !captcha || !captchaId) {
    return res.status(400).json(formatError('用户名、密码和验证码不能为空', 400));
  }
  
  // 验证验证码
  const isCaptchaValid = validateCaptcha(captchaId, captcha);
  if (!isCaptchaValid) {
    return res.status(400).json(formatError('验证码错误或已过期，请刷新后重试', 400));
  }
    
    // 查询管理员信息
    const [admins] = await pool.execute(
      'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.username = ?',
      [username]
    );
    
    if (admins.length === 0) {
      // 记录失败日志 - 使用null而不是'unknown'，因为admin_id是整数类型
      await logLogin(null, false, { username, ip: req.ip, userAgent: req.headers['user-agent'] });
      return res.json(formatError('用户名或密码错误', 401));
    }
    
    const admin = admins[0];
    
    // 检查账户状态
    if (admin.status === 0) {
      await logLogin(admin.id, false, { username, ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.json(formatError('账户已禁用，请联系超级管理员', 401));
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      // 记录失败日志
      await logLogin(admin.id, false, { username, ip: req.ip, userAgent: req.headers['user-agent'] });
      
      return res.json(formatError('用户名或密码错误', 401));
    }
    
    // 记录登录成功日志
      await logLogin(admin.id, true, { username, ip: req.ip, userAgent: req.headers['user-agent'] });
    
    // 查询权限
    const [permissions] = await pool.execute(
      `SELECT p.name FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = ?`,
      [admin.role_id]
    );
    
    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role_name,
        permissions: permissions.map(p => p.name)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    // 生成刷新令牌
    const refreshToken = jwt.sign(
      {
        id: admin.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      }
    );
    
    return res.json(formatSuccess({
      token,
      refreshToken,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role_name,
        permissions: permissions.map(p => p.name)
      }
    }, '登录成功'));
    
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json(formatError('登录失败，请稍后重试', 500));
  }
});

// 登出接口
router.post('/logout', async (req, res) => {
  try {
    // 实际项目中可能需要在服务器端存储token黑名单
    return res.json(formatSuccess(null, '登出成功'));
  } catch (error) {
    console.error('登出失败:', error);
    return res.status(500).json(formatError('登出失败，请稍后重试', 500));
  }
});

// 修改密码接口
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    // 验证token
    if (!token) {
      return res.status(401).json(formatError('未授权，请先登录', 401));
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json(formatError('登录已过期，请重新登录', 401));
    }
    
    // 检查参数
    if (!currentPassword || !newPassword) {
      return res.status(400).json(formatError('当前密码和新密码不能为空', 400));
    }
    
    // 检查新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json(formatError('新密码长度不能少于6位', 400));
    }
    
    // 查询管理员信息
    const [admins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [decoded.id]);
    
    if (admins.length === 0) {
      return res.status(404).json(formatError('管理员不存在', 404));
    }
    
    const admin = admins[0];
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isPasswordValid) {
      return res.status(400).json(formatError('当前密码错误', 400));
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
    
    // 记录操作日志
    await logAdminAction(decoded.id, decoded.username, '修改密码', '管理员', decoded.id, {});
    
    return res.json(formatSuccess(null, '密码修改成功，请重新登录'));
    
  } catch (error) {
    console.error('修改密码失败:', error);
    return res.status(500).json(formatError('修改密码失败，请稍后重试', 500));
  }
});

// 重置密码接口（超级管理员使用）
router.post('/reset-password', async (req, res) => {
  try {
    const { adminId, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    // 验证token
    if (!token) {
      return res.status(401).json(formatError('未授权，请先登录', 401));
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json(formatError('登录已过期，请重新登录', 401));
    }
    
    // 检查是否是超级管理员
    const [currentAdmin] = await pool.execute(
      'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?',
      [decoded.id]
    );
    
    if (currentAdmin.length === 0 || currentAdmin[0].role_name !== '超级管理员') {
      return res.status(403).json(formatError('只有超级管理员可以重置密码', 403));
    }
    
    // 检查参数
    if (!adminId || !newPassword) {
      return res.status(400).json(formatError('管理员ID和新密码不能为空', 400));
    }
    
    // 检查新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json(formatError('新密码长度不能少于6位', 400));
    }
    
    // 查询目标管理员信息
    const [targetAdmins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    
    if (targetAdmins.length === 0) {
      return res.status(404).json(formatError('目标管理员不存在', 404));
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, adminId]);
    
    // 记录操作日志
      await logAdminAction(decoded.id, decoded.username, '重置密码', '管理员', adminId, { adminId });

      return res.json(formatSuccess(null, '密码重置成功'));
    
  } catch (error) {
    console.error('重置密码失败:', error);
    return res.status(500).json(formatError('重置密码失败，请稍后重试', 500));
  }
});

// 刷新令牌接口
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // 验证token
    if (!token) {
      return res.status(401).json(formatError('未提供令牌', 401));
    }
    
    let decoded;
    try {
      // 验证现有令牌，但允许过期令牌（仅用于刷新）
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(401).json(formatError('无效的令牌', 401));
    }
    
    // 查询管理员信息，确保用户仍然存在且有效
    const [admins] = await pool.execute(
      'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?',
      [decoded.id]
    );
    
    if (admins.length === 0 || admins[0].status === 0) {
      return res.status(401).json(formatError('用户不存在或已禁用', 401));
    }
    
    const admin = admins[0];
    
    // 查询权限
    const [permissions] = await pool.execute(
      `SELECT p.name FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = ?`,
      [admin.role_id]
    );
    
    // 生成新的JWT令牌
    const newToken = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role_name,
        permissions: permissions.map(p => p.name)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    // 生成新的刷新令牌
    const newRefreshToken = jwt.sign(
      {
        id: admin.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      }
    );
    
    return res.json(formatSuccess({ token: newToken, refreshToken: newRefreshToken }, '令牌刷新成功'));
    
  } catch (error) {
    console.error('刷新令牌失败:', error);
    return res.status(500).json(formatError('刷新令牌失败，请稍后重试', 500));
  }
});

module.exports = router;