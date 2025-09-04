// 日志管理工具
const fs = require('fs');
const path = require('path');
const dateTime = require('./dateTime');
const db = require('../database/db');
const responseFormatter = require('./responseFormatter');
const emailService = require('./emailService');

// 日志配置
const logConfig = {
  // 日志存储类型：file, db, both
  storageType: process.env.LOG_STORAGE_TYPE || 'both',
  // 日志级别：debug, info, warn, error
  level: process.env.LOG_LEVEL || 'info',
  // 是否启用数据库日志
  dbLoggingEnabled: process.env.DB_LOGGING_ENABLED === 'true' || true,
  // 是否启用文件日志
  fileLoggingEnabled: process.env.FILE_LOGGING_ENABLED === 'true' || true,
  // 日志文件目录
  baseDir: path.join(__dirname, '../../logs'),
  // 日志文件扩展名
  extension: '.log',
  // 日志格式：text, json
  format: process.env.LOG_FORMAT || 'text',
  // 日志保留天数
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
  // 日志类型配置
  types: {
    system: 'system',
    error: 'errors',
    user: 'users',
    admin: 'admin_actions',
    login: 'login'
  }
};

// 确保日志目录存在
const ensureLogDirectory = (logType) => {
  const dir = path.join(logConfig.baseDir, logType);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// 格式化错误信息
const formatError = (error) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }
  return String(error);
};

// 格式化日志条目
const formatLogEntry = (level, message, metadata = {}) => {
  const timestamp = dateTime.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
  const logEntry = {
    timestamp,
    level,
    message,
    ...metadata
  };

  if (logConfig.format === 'json') {
    return JSON.stringify(logEntry) + '\n';
  } else {
    const metadataStr = Object.keys(metadata).length > 0 ? ` - ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metadataStr}\n`;
  }
};

// 写入日志到文件
const writeToLogFile = (logType, level, message, metadata = {}) => {
  try {
    if (!logConfig.fileLoggingEnabled) return;

    const dir = ensureLogDirectory(logConfig.types[logType] || logType);
    const filename = `${dateTime.formatDate(new Date(), 'YYYY-MM-DD')}_${logType}${logConfig.extension}`;
    const filePath = path.join(dir, filename);
    const logEntry = formatLogEntry(level, message, metadata);

    fs.appendFileSync(filePath, logEntry, 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// 写入日志到数据库
const writeToDatabase = async (logType, level, message, metadata = {}) => {
  try {
    if (!logConfig.dbLoggingEnabled) return;

    const connectionPool = db.connectionPool;
    
    // 不同类型的日志使用不同的表和字段结构
    switch (logType) {
      case 'login':
        // 使用login_logs表
        // 确保admin_id是数字或null，防止'unknown'值导致数据库错误
        const adminId = (metadata.userId === 'unknown' || typeof metadata.userId === 'string') ? null : (metadata.userId || null);
        
        // 添加调试日志
        console.log('写入登录日志到数据库:', {
          adminId,
          username: metadata.username,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          success: metadata.success,
          message
        });
        
        await connectionPool.execute(
          'INSERT INTO login_logs (admin_id, username, login_ip, login_device, login_status, error_message) VALUES (?, ?, ?, ?, ?, ?)',
          [adminId, metadata.username || null, metadata.ip || null, metadata.userAgent || null, metadata.success ? '成功' : '失败', message]
        );
        break;
      case 'admin':
      case 'system':
      case 'error':
        // 使用system_logs表存储管理员操作和系统日志
        await connectionPool.execute(
          'INSERT INTO system_logs (admin_id, action, description, action_ip) VALUES (?, ?, ?, ?)',
          [metadata.adminId || null, message, JSON.stringify(metadata), metadata.ip || null]
        );
        break;
      case 'search':
        // 搜索日志已有专门的处理逻辑
        break;
      default:
        // 对于其他类型的日志，使用文件日志而不是数据库日志
        console.log(`Skipping database logging for unsupported log type: ${logType}`);
    }
  } catch (error) {
    console.error('Failed to write to database log:', error);
  }
};

// 系统日志
const logSystem = async (message, metadata = {}) => {
  writeToLogFile('system', 'info', message, metadata);
  if (logConfig.storageType === 'db' || logConfig.storageType === 'both') {
    await writeToDatabase('system', 'info', message, metadata);
  }
};

// 错误日志
const logError = async (message, error = null, metadata = {}) => {
  const errorData = error ? formatError(error) : {};
  const logMetadata = { ...metadata, error: errorData };
  
  writeToLogFile('error', 'error', message, logMetadata);
  
  if (logConfig.storageType === 'db' || logConfig.storageType === 'both') {
    await writeToDatabase('error', 'error', message, logMetadata);
  }

  // 如果是严重错误，可以发送邮件通知
  if (metadata.isCritical && process.env.ERROR_EMAIL_NOTIFICATIONS === 'true') {
    emailService.sendErrorNotification(message, errorData);
  }
};

// 用户操作日志
const logUser = async (userId, action, metadata = {}) => {
  const message = `User ${userId} ${action}`;
  const logMetadata = { ...metadata, userId };
  
  writeToLogFile('user', 'info', message, logMetadata);
  
  if (logConfig.storageType === 'db' || logConfig.storageType === 'both') {
    await writeToDatabase('user', 'info', message, logMetadata);
  }
};

// 管理员操作日志
const logAdminAction = async (adminId, action, metadata = {}) => {
  const message = `Admin ${adminId} ${action}`;
  const logMetadata = { ...metadata, adminId };
  
  writeToLogFile('admin', 'info', message, logMetadata);
  
  if (logConfig.storageType === 'db' || logConfig.storageType === 'both') {
    await writeToDatabase('admin', 'info', message, logMetadata);
  }
};

// 登录日志
const logLogin = async (userId, success, metadata = {}) => {
  const message = `User ${userId} login ${success ? 'successful' : 'failed'}`;
  const logMetadata = { ...metadata, userId, success };
  
  writeToLogFile('login', success ? 'info' : 'warn', message, logMetadata);
  
  if (logConfig.storageType === 'db' || logConfig.storageType === 'both') {
    await writeToDatabase('login', success ? 'info' : 'warn', message, logMetadata);
  }
};

// 查询日志
const queryLogs = async (filters = {}) => {
  try {
    const connectionPool = db.connectionPool;
    let query = 'SELECT * FROM logs WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.level) {
      query += ' AND level = ?';
      params.push(filters.level);
    }
    
    if (filters.startDate) {
      query += ' AND timestamp >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND timestamp <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.keyword) {
      query += ' AND message LIKE ?';
      params.push(`%${filters.keyword}%`);
    }

    query += ' ORDER BY timestamp DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await connectionPool.execute(query, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Failed to query logs:', error);
    return { success: false, message: '查询日志失败', error: formatError(error) };
  }
};

// 查询登录日志
const queryLoginLogs = async (filters = {}) => {
  try {
    const connectionPool = db.connectionPool;
    let query = 'SELECT * FROM login_logs WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND admin_id = ?';
      params.push(filters.userId);
    }
    
    if (filters.success !== undefined) {
      query += ' AND login_status = ?';
      params.push(filters.success ? '成功' : '失败');
    }
    
    if (filters.ipAddress) {
      query += ' AND login_ip = ?';
      params.push(filters.ipAddress);
    }
    
    if (filters.startDate) {
      query += ' AND login_time >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND login_time <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY login_time DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await connectionPool.execute(query, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Failed to query login logs:', error);
    return { success: false, message: '查询登录日志失败', error: formatError(error) };
  }
};

// 删除过期日志
const deleteExpiredLogs = async () => {
  try {
    const connectionPool = db.connectionPool;
    const retentionDate = dateTime.formatDate(dateTime.addDays(new Date(), -logConfig.retentionDays), 'YYYY-MM-DD');
    
    // 删除数据库中的过期日志
    if (logConfig.dbLoggingEnabled) {
      await connectionPool.execute('DELETE FROM logs WHERE timestamp < ?', [retentionDate]);
      await connectionPool.execute('DELETE FROM login_logs WHERE login_time < ?', [retentionDate]);
    }
    
    // 删除文件中的过期日志
    if (logConfig.fileLoggingEnabled) {
      Object.values(logConfig.types).forEach(logType => {
        const dir = ensureLogDirectory(logType);
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          if (file.endsWith(logConfig.extension)) {
            const fileDateStr = file.split('_')[0];
            if (fileDateStr && fileDateStr < retentionDate) {
              fs.unlinkSync(path.join(dir, file));
            }
          }
        });
      });
    }
    
    return { success: true, message: '已删除过期日志' };
  } catch (error) {
    console.error('Failed to delete expired logs:', error);
    return { success: false, message: '删除过期日志失败', error: formatError(error) };
  }
};

// 删除指定日期范围的日志
const deleteLogsByDate = async (startDate, endDate) => {
  try {
    const connectionPool = db.connectionPool;
    
    // 删除数据库中的指定日期范围日志
    if (logConfig.dbLoggingEnabled) {
      await connectionPool.execute('DELETE FROM logs WHERE timestamp BETWEEN ? AND ?', [startDate, endDate]);
      await connectionPool.execute('DELETE FROM login_logs WHERE timestamp BETWEEN ? AND ?', [startDate, endDate]);
    }
    
    // 删除文件中的指定日期范围日志
    if (logConfig.fileLoggingEnabled) {
      Object.values(logConfig.types).forEach(logType => {
        const dir = ensureLogDirectory(logType);
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          if (file.endsWith(logConfig.extension)) {
            const fileDateStr = file.split('_')[0];
            if (fileDateStr && fileDateStr >= startDate.split(' ')[0] && fileDateStr <= endDate.split(' ')[0]) {
              fs.unlinkSync(path.join(dir, file));
            }
          }
        });
      });
    }
    
    return { success: true, message: '已删除指定日期范围的日志' };
  } catch (error) {
    console.error('Failed to delete logs by date:', error);
    return { success: false, message: '删除指定日期范围的日志失败', error: formatError(error) };
  }
};

// 获取日志文件列表
const getLogFilesList = () => {
  try {
    const filesList = {};
    
    Object.entries(logConfig.types).forEach(([typeKey, typeValue]) => {
      const dir = ensureLogDirectory(typeValue);
      const files = fs.readdirSync(dir)
        .filter(file => file.endsWith(logConfig.extension))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          size: fs.statSync(path.join(dir, file)).size,
          mtime: fs.statSync(path.join(dir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      filesList[typeKey] = files;
    });
    
    return { success: true, data: filesList };
  } catch (error) {
    console.error('Failed to get log files list:', error);
    return { success: false, message: '获取日志文件列表失败', error: formatError(error) };
  }
};

// 读取日志文件内容
const readLogFile = (logType, filename) => {
  try {
    const dir = ensureLogDirectory(logConfig.types[logType]);
    const filePath = path.join(dir, filename);

    if (!fs.existsSync(filePath)) {
      return { success: false, message: '日志文件不存在' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    console.error('Failed to read log file:', error);
    return { success: false, message: '读取日志文件失败', error: formatError(error) };
  }
};

// 清空所有日志
const clearAllLogs = async () => {
  try {
    // 清空数据库中的日志
    if (logConfig.dbLoggingEnabled) {
      await db.connectionPool.execute('TRUNCATE TABLE logs');
      await db.connectionPool.execute('TRUNCATE TABLE login_logs');
    }

    // 清空文件中的日志
    if (logConfig.fileLoggingEnabled) {
      Object.values(logConfig.types).forEach(logType => {
        const dir = ensureLogDirectory(logType);
        const files = fs.readdirSync(dir);

        files.forEach(file => {
          if (file.endsWith(logConfig.extension)) {
            fs.unlinkSync(path.join(dir, file));
          }
        });
      });
    }

    return { success: true, message: '已清空所有日志' };
  } catch (error) {
    console.error('Failed to clear all logs:', error);
    return { success: false, message: '清空日志失败', error: formatError(error) };
  }
};

// 导出日志管理函数
module.exports = {
  logSystem,
  logError,
  logUser,
  logAdminAction,
  logLogin,
  queryLogs,
  queryLoginLogs,
  deleteExpiredLogs,
  deleteLogsByDate,
  getLogFilesList,
  readLogFile,
  clearAllLogs,
  logConfig,
  // 添加标准日志函数别名，保持向后兼容
  error: logError,
  info: logSystem,
  warn: logSystem,
  log: logSystem
};