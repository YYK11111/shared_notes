const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { query, transaction, executeInTransaction } = require('../../database/dbConfig');
const { authMiddleware } = require('../middleware/authMiddleware');
const { successResponse, errorResponse, notFoundResponse, serverErrorResponse } = require('../utils/responseFormatter');
const { getFileUploadConfig } = require('../services/configService');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. 初始化存储目录（按日期+业务类型自动创建）
const getStoragePath = (businessType) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const finalPath = path.join(uploadDir, year.toString(), month, businessType);
  // 若目录不存在则创建
  if (!fs.existsSync(finalPath)) fs.mkdirSync(finalPath, { recursive: true });
  return finalPath;
};

// 2. 上传文件接口（核心）
const multer = require('multer');

// 配置multer：动态指定存储路径和文件名
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 从请求参数获取业务类型（如?businessType=avatar）
    const businessType = req.query.businessType || 'other';
    const path = getStoragePath(businessType);
    cb(null, path);
  },
  filename: (req, file, cb) => {
    // 生成唯一file_id，保留原始后缀
    const fileId = uuidv4();
    const ext = path.extname(file.originalname); // 获取后缀（如.jpg）
    const finalFileName = `${fileId}${ext}`;
    // 将file_id存入req，后续存数据库用
    req.fileId = fileId;
    cb(null, finalFileName);
  }
});

// 创建动态multer实例的函数
let currentConfig = null;
let lastConfigCheck = 0;
const CONFIG_CACHE_DURATION = 60000; // 配置缓存1分钟

const getDynamicUpload = async () => {
  // 检查配置是否已过期或未初始化
  const now = Date.now();
  if (!currentConfig || now - lastConfigCheck > CONFIG_CACHE_DURATION) {
    try {
      currentConfig = await getFileUploadConfig();
      lastConfigCheck = now;
    } catch (error) {
      console.error('获取文件上传配置失败，使用默认配置:', error);
      // 使用默认配置作为后备
      currentConfig = {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxCount: 5
      };
    }
  }
  
  return multer({
    storage,
    limits: { fileSize: currentConfig.maxSize },
    fileFilter: (req, file, cb) => {
      if (currentConfig.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型，仅支持: ${currentConfig.allowedTypes.join(', ')}`), false);
      }
    }
  });
}

// 处理文件上传错误
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    let message = '文件上传失败';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超过限制';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '文件数量超过限制';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '上传了未预期的文件';
        break;
    }
    
    return res.status(400).json(errorResponse(message));
  } else if (err) {
    // 其他错误
    return res.status(400).json(errorResponse(err.message));
  }
  
  // 没有错误，继续处理请求
  next();
};

// 3. 上传接口：单文件上传
router.post('/upload', authMiddleware, async (req, res, next) => {
  try {
    const dynamicUpload = await getDynamicUpload();
    dynamicUpload.single('file')(req, res, next);
  } catch (error) {
    console.error('创建动态上传实例失败:', error);
    res.status(500).json(serverErrorResponse('上传配置加载失败，请稍后重试'));
  }
}, handleUploadError, async (req, res) => {
  try {
    const file = req.file;
    const fileId = req.fileId;
    const businessType = req.query.businessType || 'other';

    // 连接MySQL，插入文件元数据
    const result = await query(
      `INSERT INTO files (file_id, file_name, file_type, file_size, storage_path, business_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        file.originalname,
        file.mimetype,
        file.size,
        file.path, // multer返回的本地存储路径
        businessType
      ]
    );

    // 返回file_id给前端，前端存到业务表（如用户表的avatar_id）
    res.json(successResponse({ fileId }, '上传成功'));
  } catch (err) {
    console.error('文件上传失败:', err);
    res.status(500).json(serverErrorResponse('上传失败，请稍后重试'));
  }
});

// 4. 下载/预览文件接口
router.get('/get/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查文件元数据
    const rows = await query(
      'SELECT file_name, file_type, storage_path FROM files WHERE file_id = ?',
      [fileId]
    );

    if (rows.length === 0) return res.status(404).json(notFoundResponse('文件不存在'));

    const file = rows[0];
    // 检查文件是否存在
    if (!fs.existsSync(file.storage_path)) {
      return res.status(404).json(notFoundResponse('文件不存在'));
    }
    
    // 设置响应头：支持预览（图片）和下载（其他文件）
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
    // 读取本地文件并返回
    const fileStream = fs.createReadStream(file.storage_path);
    fileStream.pipe(res);
  } catch (err) {
    console.error('获取文件失败:', err);
    res.status(500).json(serverErrorResponse('获取文件失败，请稍后重试'));
  }
});

// 5. 删除文件接口
router.delete('/delete/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查文件元数据
    const rows = await query(
      'SELECT storage_path FROM files WHERE file_id = ?',
      [fileId]
    );

    if (rows.length === 0) return res.status(404).json(notFoundResponse('文件不存在'));

    const file = rows[0];
    
    // 使用事务处理删除操作
    await transaction(async (connection) => {
      // 删除数据库记录
      await executeInTransaction(connection, 'DELETE FROM files WHERE file_id = ?', [fileId]);
      
      // 删除本地文件
      if (fs.existsSync(file.storage_path)) {
        fs.unlinkSync(file.storage_path);
      }
      
      res.json(successResponse(null, '文件删除成功'));
    }).catch((err) => {
      // 事务已在内部自动回滚
      throw err;
    });
  } catch (err) {
    console.error('删除文件失败:', err);
    res.status(500).json(serverErrorResponse('删除文件失败，请稍后重试'));
  }
});

// 6. 获取文件信息接口
router.get('/info/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查文件元数据
    const rows = await query(
      'SELECT file_id, file_name, file_type, file_size, business_type, created_at FROM files WHERE file_id = ?',
      [fileId]
    );

    if (rows.length === 0) return res.status(404).json(notFoundResponse('文件不存在'));

    res.json(successResponse(rows[0], '获取文件信息成功'));
  } catch (err) {
    console.error('获取文件信息失败:', err);
    res.status(500).json(serverErrorResponse('获取文件信息失败，请稍后重试'));
  }
});

module.exports = router;