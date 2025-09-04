// 安全工具

const crypto = require('crypto');
const xss = require('xss');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const { config } = require('dotenv');
const { errorResponse, unauthorizedResponse, forbiddenResponse } = require('./responseFormatter');

config();

// 临时存储验证码（生产环境应该使用Redis等更可靠的存储方式）
const captchaStore = new Map();

// 验证码有效期（秒）
const CAPTCHA_EXPIRATION = 300;

// 敏感词列表
const sensitiveWords = process.env.SENSITIVE_WORDS ? process.env.SENSITIVE_WORDS.split(',') : [];

// 加密配置
const encryptionConfig = {
  algorithm: 'aes-256-cbc',
  key: crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_encryption_key', 'salt', 32),
  iv: crypto.scryptSync(process.env.ENCRYPTION_IV || 'default_encryption_iv', 'salt', 16)
};

// JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// 安全设置
const securitySettings = {
  // 密码强度要求
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
  },
  // 登录尝试限制
  loginAttempts: {
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockTime: parseInt(process.env.LOCK_TIME_MINUTES || '15')
  },
  // IP访问限制
  ipLimits: {
    maxRequests: parseInt(process.env.MAX_IP_REQUESTS || '100'),
    timeWindow: parseInt(process.env.IP_TIME_WINDOW || '60') // 秒
  }
};

// 生成密码哈希
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  return { salt, hash };
};

// 验证密码
const verifyPassword = (password, storedHash, storedSalt) => {
  const hash = crypto.pbkdf2Sync(password, storedSalt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
};

// 生成JWT令牌
const generateToken = (payload, options = {}) => {
  const { expiresIn = jwtConfig.expiresIn, secret = jwtConfig.secret } = options;
  
  return jwt.sign(payload, secret, { expiresIn });
};

// 验证JWT令牌
const verifyToken = (token, options = {}) => {
  const { secret = jwtConfig.secret } = options;
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
};

// 生成刷新令牌
const generateRefreshToken = (payload) => {
  return generateToken(payload, {
    expiresIn: jwtConfig.refreshExpiresIn,
    secret: jwtConfig.refreshSecret
  });
};

// 验证刷新令牌
const verifyRefreshToken = (token) => {
  return verifyToken(token, {
    secret: jwtConfig.refreshSecret
  });
};

// 加密数据
const encryptData = (data) => {
  const cipher = crypto.createCipheriv(encryptionConfig.algorithm, encryptionConfig.key, encryptionConfig.iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
};

// 解密数据
const decryptData = (encryptedData) => {
  const decipher = crypto.createDecipheriv(encryptionConfig.algorithm, encryptionConfig.key, encryptionConfig.iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// 生成随机字符串
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// 生成验证码
const generateVerificationCode = (length = 6) => {
  // 生成指定长度的纯数字验证码
  let code = '';
  const min = 10 ** (length - 1); // 最小值，如length=4时为1000
  const max = (10 ** length) - 1; // 最大值，如length=4时为9999
  code = Math.floor(min + Math.random() * (max - min + 1)).toString();
  return code;
};

// 生成验证码图片
const generateCaptchaImage = (text) => {
  console.log('生成验证码图片，文本:', text);
  
  // 创建验证码配置
  const captchaOptions = {
    size: text.length,
    ignoreChars: '', // 不忽略任何字符
    noise: 3, // 干扰线条数
    width: 120, // 宽度
    height: 40, // 高度
    fontSize: 32, // 字体大小
    color: true, // 彩色文本
    background: '#f0f0f0', // 背景色
    charPreset: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // 所有可能的字符
  };
  
  try {
    // 直接使用text作为验证码文本，不使用svg-captcha的随机生成
    // 创建一个自定义的SVG
    let svgData = `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg" style="background-color: #f0f0f0;">
`;
    
    // 添加干扰线
    for (let i = 0; i < 3; i++) {
      const x1 = Math.random() * 120;
      const y1 = Math.random() * 40;
      const x2 = Math.random() * 120;
      const y2 = Math.random() * 40;
      const opacity = 0.5 + Math.random() * 0.5;
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      
      svgData += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgb(${r},${g},${b})" stroke-width="1" opacity="${opacity}"/>
`;
    }
    
    // 添加干扰点
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 120;
      const y = Math.random() * 40;
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const opacity = 0.3 + Math.random() * 0.7;
      
      svgData += `  <circle cx="${x}" cy="${y}" r="1" fill="rgb(${r},${g},${b})" opacity="${opacity}"/>
`;
    }
    
    // 添加验证码文本
    const chars = text.split('');
    chars.forEach((char, index) => {
      const x = 20 + index * 25;
      const y = 25 + (Math.random() * 10 - 5); // 轻微的垂直偏移
      const rotation = (Math.random() * 20 - 10); // -10到10度的旋转
      const r = Math.floor(Math.random() * 128);
      const g = Math.floor(Math.random() * 128);
      const b = Math.floor(Math.random() * 128);
      
      svgData += `  <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="rgb(${r},${g},${b})" transform="rotate(${rotation} ${x} ${y})">${char}</text>
`;
    });
    
    svgData += `</svg>`;
    
    console.log('成功生成自定义SVG验证码');
    return svgData;
  } catch (error) {
    console.error('生成验证码图片失败:', error);
    throw error;
  }
};

// 存储验证码
const storeCaptcha = (code) => {
  const captchaId = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + CAPTCHA_EXPIRATION * 1000;
  
  captchaStore.set(captchaId, { code, expiresAt });
  
  // 清理过期的验证码
  cleanExpiredCaptchas();
  
  return captchaId;
};

// 验证验证码
const validateCaptcha = (captchaId, userInput) => {
  console.log('验证验证码:', { captchaId, userInput });
  
  if (!captchaId || !userInput) {
    console.log('验证码ID或用户输入为空');
    return false;
  }
  
  const captcha = captchaStore.get(captchaId);
  if (!captcha) {
    console.log('未找到对应的验证码，captchaId:', captchaId);
    console.log('当前存储的验证码数量:', captchaStore.size);
    return false;
  }
  
  // 检查是否过期
  if (Date.now() > captcha.expiresAt) {
    console.log('验证码已过期，captchaId:', captchaId);
    captchaStore.delete(captchaId);
    return false;
  }
  
  // 验证并删除已使用的验证码
  console.log('存储的验证码:', captcha.code, '用户输入的验证码:', userInput);
  const isValid = captcha.code.toLowerCase() === userInput.toLowerCase();
  if (isValid) {
    console.log('验证码验证成功:', captchaId);
    captchaStore.delete(captchaId);
  } else {
    console.log('验证码验证失败:', captchaId);
  }
  
  return isValid;
};

// 清理过期的验证码
const cleanExpiredCaptchas = () => {
  const now = Date.now();
  for (const [captchaId, { expiresAt }] of captchaStore.entries()) {
    if (now > expiresAt) {
      captchaStore.delete(captchaId);
    }
  }
};

// 验证密码强度
const validatePasswordStrength = (password) => {
  const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecialChar } = securitySettings.passwordRequirements;
  
  const errors = [];
  
  if (!password || password.length < minLength) {
    errors.push(`密码长度至少为${minLength}个字符`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (requireNumber && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  if (requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 过滤敏感词
const filterSensitiveWords = (text, replacement = '*') => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let filteredText = text;
  
  sensitiveWords.forEach(word => {
    if (word && word.trim()) {
      const regex = new RegExp(word.trim(), 'gi');
      const replaceChars = replacement.repeat(word.length);
      filteredText = filteredText.replace(regex, replaceChars);
    }
  });
  
  return filteredText;
};

// 检查是否包含敏感词
const containsSensitiveWords = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return sensitiveWords.some(word => {
    if (word && word.trim()) {
      const regex = new RegExp(word.trim(), 'gi');
      return regex.test(text);
    }
    return false;
  });
};

// 清理XSS
const sanitizeXSS = (input) => {
  if (typeof input === 'string') {
    return xss(input);
  } else if (typeof input === 'object' && input !== null) {
    // 递归处理对象或数组
    if (Array.isArray(input)) {
      return input.map(item => sanitizeXSS(item));
    } else {
      const sanitizedObj = {};
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          sanitizedObj[key] = sanitizeXSS(input[key]);
        }
      }
      return sanitizedObj;
    }
  }
  
  return input;
};

// 验证邮箱
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证手机号（中国）
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

// 验证URL
const validateUrl = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return urlRegex.test(url);
};

// 验证IP地址
const validateIpAddress = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// 安全的URL重定向
const safeRedirect = (url, defaultUrl = '/') => {
  if (!url || typeof url !== 'string') {
    return defaultUrl;
  }
  
  // 防止开放式重定向攻击
  const urlObj = new URL(url, 'http://localhost');
  if (urlObj.hostname !== 'localhost' && !url.startsWith('/')) {
    return defaultUrl;
  }
  
  return url;
};

// 生成安全的文件路径
const generateSafeFilePath = (directory, filename) => {
  // 移除路径遍历字符
  const safeFilename = filename.replace(/\.\.\//g, '').replace(/\.\./g, '');
  // 移除特殊字符
  const sanitizedFilename = safeFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  return `${directory}/${sanitizedFilename}`;
};

// 检查文件类型安全
const isSafeFileType = (mimeType, allowedTypes) => {
  return allowedTypes.includes(mimeType);
};

// 计算数据签名
const calculateSignature = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

// 验证数据签名
const verifySignature = (data, signature) => {
  return calculateSignature(data) === signature;
};

// 安全的JSON解析
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
};

// 限制并发请求
const rateLimit = (maxRequests, timeWindow) => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - (timeWindow * 1000);
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }
    
    // 过滤出时间窗口内的请求
    const requests = requestCounts.get(ip).filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json(errorResponse('请求过于频繁，请稍后再试', 429));
    }
    
    // 添加当前请求时间戳
    requests.push(now);
    requestCounts.set(ip, requests);
    
    next();
  };
};

// 防爬虫中间件
const antiCrawler = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // 检测常见爬虫特征
  const botPatterns = [
    'bot', 'crawler', 'spider', 'slurp', 'bingbot', 'googlebot',
    'yandexbot', 'baiduspider', 'rogerbot', 'pinterestbot'
  ];
  
  const isBot = botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  );
  
  if (isBot) {
    // 可以选择记录日志、返回403或正常处理
    console.log(`Blocked crawler request from ${req.ip}: ${userAgent}`);
    // res.status(403).json(forbiddenResponse('爬虫访问被禁止'));
  }
  
  next();
};

// 安全响应头设置
const setSecurityHeaders = (req, res, next) => {
  // 设置内容安全策略
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  
  // 防止XSS攻击
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 禁止在iframe中显示（防止点击劫持）
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 禁止浏览器嗅探MIME类型
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 严格传输安全
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 特性策略
  res.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");
  
  next();
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  encryptData,
  decryptData,
  generateRandomString,
  generateVerificationCode,
  generateCaptchaImage,
  storeCaptcha,
  validateCaptcha,
  validatePasswordStrength,
  filterSensitiveWords,
  containsSensitiveWords,
  sanitizeXSS,
  validateEmail,
  validatePhoneNumber,
  validateUrl,
  validateIpAddress,
  safeRedirect,
  generateSafeFilePath,
  isSafeFileType,
  calculateSignature,
  verifySignature,
  safeJsonParse,
  rateLimit,
  antiCrawler,
  setSecurityHeaders,
  securitySettings
};