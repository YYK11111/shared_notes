const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const { query, transaction, executeInTransaction } = require('../../database/dbConfig');
const { authMiddleware } = require('../middleware/authMiddleware');
const { successResponse, errorResponse, notFoundResponse, serverErrorResponse } = require('../utils/responseFormatter');
const { getFileUploadConfig } = require('../services/configService');

// 确保上传目录存在 - 修复路径解析问题
// 计算正确的上传目录路径：相对于backend目录
const uploadDir = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`创建上传目录: ${uploadDir}`);
} else {
  console.log(`上传目录已存在: ${uploadDir}`);
}

// 计算文件的哈希值（用于检测文件重复）
const calculateFileHash = (fileBuffer) => {
  const hash = crypto.createHash('md5');
  hash.update(fileBuffer);
  return hash.digest('hex');
};

// 图片压缩函数
const compressImage = async (filePath) => {
  try {
    // 读取文件信息获取原始大小
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    
    // 设置压缩参数
    const compressionOptions = {
      quality: 80, // 图片质量（0-100）
      progressive: true,
      force: false // 只有在压缩后文件更小的情况下才保存
    };
    
    // 根据文件类型进行不同的压缩处理
    const fileType = filePath.split('.').pop().toLowerCase();
    
    // 临时文件路径
    const tempPath = `${filePath}.temp`;
    
    if (fileType === 'jpg' || fileType === 'jpeg') {
      await sharp(filePath)
        .jpeg(compressionOptions)
        .toFile(tempPath);
    } else if (fileType === 'png') {
      await sharp(filePath)
        .png({ quality: 80, adaptiveFiltering: true })
        .toFile(tempPath);
    } else if (fileType === 'webp') {
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(tempPath);
    }
    
    // 检查压缩后文件是否存在且确实变小了
    if (fs.existsSync(tempPath)) {
      const compressedStats = fs.statSync(tempPath);
      const compressedSize = compressedStats.size;
      
      // 只有当压缩后文件小于原始文件的90%时，才替换原始文件
      if (compressedSize < originalSize * 0.9) {
        // 删除原始文件
        fs.unlinkSync(filePath);
        // 将临时文件重命名为原始文件
        fs.renameSync(tempPath, filePath);
        console.log(`图片压缩成功: ${filePath}, 原始大小: ${originalSize} 字节, 压缩后: ${compressedSize} 字节`);
      } else {
        // 压缩效果不明显，删除临时文件
        fs.unlinkSync(tempPath);
      }
    }
  } catch (error) {
    console.error('图片压缩失败:', error);
    // 忽略压缩错误，继续使用原始图片
  }
};

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
    let fileId = req.fileId; // 使用let而不是const，以便后续可以更新
    const businessType = req.query.businessType || 'other';
    // 获取资源ID和类型参数
    const resourceId = req.query.resourceId || null;
    const resourceType = req.query.resourceType || null;

    // 检查数据库是否支持file_hash字段
    let useFileHash = false;
    let existingFile = null;
    let fileHash = null;
    
    try {
      // 尝试查询file_hash字段，验证数据库是否支持
      await query('SELECT file_hash FROM files LIMIT 1');
      useFileHash = true;
      
      // 读取文件内容计算哈希值，用于检测文件重复
      const fileBuffer = fs.readFileSync(file.path);
      fileHash = calculateFileHash(fileBuffer);
      
      // 检查是否已存在相同哈希值的文件
      const fileResult = await query(
        'SELECT file_id FROM files WHERE file_hash = ?',
        [fileHash]
      );
      
      if (fileResult && fileResult.length > 0) {
        existingFile = fileResult;
      }
    } catch (error) {
      console.warn('数据库可能不支持file_hash字段，跳过文件重复检测:', error.message);
    }

    if (useFileHash && existingFile && existingFile.length > 0) {
      // 文件已存在，返回已存在的file_id，并删除刚上传的重复文件
      fs.unlinkSync(file.path);
      
      // 更新req.fileId和fileId变量为已存在的文件ID，确保后续处理使用正确的ID
      const existingFileId = existingFile[0].file_id;
      req.fileId = existingFileId;
      fileId = existingFileId; // 关键修复：更新fileId变量
      
      console.log(`检测到重复文件: 原始生成的ID=${req.fileId}，替换为已存在的ID=${existingFileId}`);
      
      // 如果提供了资源ID和类型，建立关联
      if (resourceId && resourceType) {
        try {
          await query(
            `INSERT INTO file_resource_mapping (file_id, resource_id, resource_type) 
             VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id`,
            [existingFileId, resourceId, resourceType]
          );
        } catch (error) {
          console.warn('建立文件与资源关联失败:', error.message);
        }
      }
      
      return res.json(successResponse({ fileId: existingFileId }, '文件已存在，无需重复上传'));
    }

    // 如果是图片文件，进行压缩处理
    if (file.mimetype.startsWith('image/')) {
      await compressImage(file.path);
      // 重新获取压缩后的文件大小
      const stats = fs.statSync(file.path);
      file.size = stats.size;
    }

    // 文件不重复，使用事务处理文件上传和关联操作
    await transaction(async (connection) => {
      // 连接MySQL，插入文件元数据
      if (useFileHash) {
        await executeInTransaction(connection, 
          `INSERT INTO files (file_id, file_name, file_type, file_size, storage_path, business_type, file_hash) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            fileId,
            file.originalname,
            file.mimetype,
            file.size,
            file.path, // multer返回的本地存储路径
            businessType,
            fileHash
          ]
        );
      } else {
        // 不包含file_hash字段的兼容模式
        await executeInTransaction(connection, 
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
      }

      // 如果提供了资源ID和类型，建立关联
      if (resourceId && resourceType) {
        await executeInTransaction(connection, 
          `INSERT INTO file_resource_mapping (file_id, resource_id, resource_type) 
           VALUES (?, ?, ?)`,
          [fileId, resourceId, resourceType]
        );
      }
    });

    // 返回file_id给前端
    res.json(successResponse({ fileId }, '上传成功'));
  } catch (err) {
    console.error('文件上传失败:', err);
    // 如果出错，尝试删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json(serverErrorResponse('上传失败，请稍后重试'));
  }
});

// 4. 下载/预览文件接口
router.get('/get/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查文件元数据
    const rows = await query(
      'SELECT file_name, file_type, storage_path, business_type FROM files WHERE file_id = ?',
      [fileId]
    );

    if (rows.length === 0) {
      console.log(`文件ID ${fileId} 在数据库中不存在`);
      return res.status(404).json(notFoundResponse('文件不存在'));
    }

    const file = rows[0];
    
    // 构建正确的绝对文件路径 - 修复路径解析问题
    // 注意：数据库中存储的storage_path可能是绝对路径或相对路径
    let absoluteFilePath;
    
    // 检查数据库中的storage_path是否已经是绝对路径
    if (path.isAbsolute(file.storage_path)) {
      absoluteFilePath = file.storage_path;
    } else {
      // 如果是相对路径，则相对于正确的上传目录解析
      // 注意：这里要考虑到原来存储路径的结构
      const relativePath = file.storage_path.replace(/^uploads\\?/, ''); // 移除可能的uploads前缀
      absoluteFilePath = path.join(uploadDir, relativePath);
    }
    
    console.log(`尝试访问文件: ${absoluteFilePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(absoluteFilePath)) {
      console.log(`文件不存在: ${absoluteFilePath}`);
      return res.status(404).json(notFoundResponse('文件不存在'));
    }
    
    // 设置响应头：支持预览（图片）和下载（其他文件）
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
    
    // 读取本地文件并返回
    const fileStream = fs.createReadStream(absoluteFilePath);
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

// 7. 建立文件与资源的关联
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const { fileId, resourceId, resourceType } = req.body;
    
    // 参数验证
    if (!fileId || !resourceId || !resourceType) {
      return res.status(400).json(errorResponse('fileId、resourceId和resourceType为必填参数'));
    }
    
    // 检查文件是否存在
    const fileCheck = await query('SELECT file_id FROM files WHERE file_id = ?', [fileId]);
    if (fileCheck.length === 0) {
      return res.status(404).json(notFoundResponse('文件不存在'));
    }
    
    // 建立关联
    await query(
      `INSERT INTO file_resource_mapping (file_id, resource_id, resource_type) 
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id`,
      [fileId, resourceId, resourceType]
    );
    
    res.json(successResponse(null, '文件与资源关联成功'));
  } catch (err) {
    console.error('文件与资源关联失败:', err);
    res.status(500).json(serverErrorResponse('关联失败，请稍后重试'));
  }
});

// 8. 解除文件与资源的关联
router.delete('/unlink', authMiddleware, async (req, res) => {
  try {
    const { fileId, resourceId, resourceType } = req.query;
    
    // 参数验证
    if (!fileId || !resourceId || !resourceType) {
      return res.status(400).json(errorResponse('fileId、resourceId和resourceType为必填参数'));
    }
    
    // 解除关联
    const result = await query(
      'DELETE FROM file_resource_mapping WHERE file_id = ? AND resource_id = ? AND resource_type = ?',
      [fileId, resourceId, resourceType]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json(notFoundResponse('关联关系不存在'));
    }
    
    res.json(successResponse(null, '文件与资源解除关联成功'));
  } catch (err) {
    console.error('文件与资源解除关联失败:', err);
    res.status(500).json(serverErrorResponse('解除关联失败，请稍后重试'));
  }
});

// 9. 获取与资源关联的文件列表
router.get('/list-by-resource', authMiddleware, async (req, res) => {
  try {
    const { resourceId, resourceType } = req.query;
    
    // 参数验证
    if (!resourceId || !resourceType) {
      return res.status(400).json(errorResponse('resourceId和resourceType为必填参数'));
    }
    
    // 查询关联的文件
    const files = await query(
      `SELECT f.file_id, f.file_name, f.file_type, f.file_size, f.business_type, f.created_at 
       FROM files f 
       JOIN file_resource_mapping frm ON f.file_id = frm.file_id 
       WHERE frm.resource_id = ? AND frm.resource_type = ?`,
      [resourceId, resourceType]
    );
    
    res.json(successResponse(files, '获取资源关联文件列表成功'));
  } catch (err) {
    console.error('获取资源关联文件列表失败:', err);
    res.status(500).json(serverErrorResponse('获取失败，请稍后重试'));
  }
});

// 10. 获取与文件关联的资源列表
router.get('/list-by-file/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 检查文件是否存在
    const fileCheck = await query('SELECT file_id FROM files WHERE file_id = ?', [fileId]);
    if (fileCheck.length === 0) {
      return res.status(404).json(notFoundResponse('文件不存在'));
    }
    
    // 查询关联的资源
    const resources = await query(
      `SELECT resource_id, resource_type, created_at 
       FROM file_resource_mapping 
       WHERE file_id = ?`,
      [fileId]
    );
    
    res.json(successResponse(resources, '获取文件关联资源列表成功'));
  } catch (err) {
    console.error('获取文件关联资源列表失败:', err);
    res.status(500).json(serverErrorResponse('获取失败，请稍后重试'));
  }
});

// 6. 获取文件信息接口
router.get('/info/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查文件元数据
    const rows = await query(
      'SELECT file_id, file_name, file_type, file_size, business_type, created_at, storage_path FROM files WHERE file_id = ?',
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