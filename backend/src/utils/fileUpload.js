const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
require('dotenv').config();

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型创建子目录
    const fileType = getFileType(file.mimetype);
    const typeDir = path.join(uploadDir, fileType);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    
    // 限制文件名长度
    const safeBaseName = baseName.length > 50 ? baseName.substring(0, 50) : baseName;
    
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  }
});

// 根据MIME类型获取文件类型
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 'images';
  } else if (mimetype.startsWith('video/')) {
    return 'videos';
  } else if (mimetype.startsWith('audio/')) {
    return 'audios';
  } else if (mimetype.includes('pdf')) {
    return 'pdfs';
  } else if (mimetype.includes('word') || mimetype.includes('document')) {
    return 'documents';
  } else {
    return 'others';
  }
};

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    // 接受文件
    cb(null, true);
  } else {
    // 拒绝文件
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建文件上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    // 文件大小限制（默认为10MB）
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    // 最多上传文件数
    files: 5
  }
});

// 上传单个文件
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// 上传多个文件
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

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
    
    return res.status(400).json({ code: 400, data: null, msg: message });
  } else if (err) {
    // 其他错误
    return res.status(400).json({ code: 400, data: null, msg: err.message });
  }
  
  // 没有错误，继续处理请求
  next();
};

// 获取文件的URL
const getFileUrl = (filePath) => {
  // 移除上传目录前缀
  const relativePath = filePath.replace(uploadDir, '');
  // 构建URL
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/uploads${relativePath.replace(/\\/g, '/')}`;
};

// 删除文件
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('删除文件失败:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// 检查文件是否存在
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// 调整图片尺寸
const resizeImage = async (filePath, options = {}) => {
  const { width, height, quality = 80 } = options;
  
  try {
    console.log(`调整图片尺寸: ${filePath}, 宽度: ${width}, 高度: ${height}, 质量: ${quality}`);
    
    // 创建调整后的文件路径
    const resizedFilePath = `${filePath}_resized`;
    
    // 使用 sharp 调整图片尺寸
    await sharp(filePath)
      .resize(width, height, {
        fit: 'cover',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFile(resizedFilePath);
    
    return resizedFilePath;
  } catch (error) {
    console.error('调整图片尺寸失败:', error);
    throw error;
  }
};

// 生成缩略图
const generateThumbnail = async (filePath, thumbnailPath, options = {}) => {
  const { width = 200, height = 150, quality = 70 } = options;
  
  try {
    console.log(`生成缩略图: ${filePath} -> ${thumbnailPath}, 宽度: ${width}, 高度: ${height}`);
    
    // 使用 sharp 生成缩略图
    await sharp(filePath)
      .resize(width, height, {
        fit: 'cover'
      })
      .jpeg({ quality })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    throw error;
  }
};

// 验证图片尺寸
const validateImageDimensions = async (filePath, minWidth = 800, minHeight = 450) => {
  try {
    console.log(`验证图片尺寸: ${filePath}, 最小宽度: ${minWidth}, 最小高度: ${minHeight}`);
    
    // 使用 sharp 获取图片尺寸
    const metadata = await sharp(filePath).metadata();
    
    // 检查尺寸是否满足要求
    const isValid = metadata.width >= minWidth && metadata.height >= minHeight;
    
    if (!isValid) {
      console.warn(`图片尺寸不满足要求: ${metadata.width}x${metadata.height}, 需要至少 ${minWidth}x${minHeight}`);
    }
    
    return isValid;
  } catch (error) {
    console.error('验证图片尺寸失败:', error);
    // 出错时默认返回 true，避免因尺寸验证失败而阻止文件上传
    return true;
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  getFileUrl,
  deleteFile,
  fileExists,
  resizeImage,
  generateThumbnail,
  validateImageDimensions
};