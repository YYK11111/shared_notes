// 数据库备份和恢复工具

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { config } = require('dotenv');
const { formatDateTime, getCurrentDate } = require('./dateTime');
const { connectionPool } = require('../database/db');
const { formatError } = require('./responseFormatter');
const { logSystem, logError } = require('./logger');

config();
const execAsync = promisify(exec);

// 备份配置
const backupConfig = {
  // 备份文件存储目录
  backupDir: path.join(__dirname, '../../backups'),
  // 备份文件扩展名
  extension: '.sql',
  // 备份保留数量
  maxBackups: parseInt(process.env.DB_BACKUP_MAX_COUNT || '10'),
  // MySQL命令路径
  mysqlBinPath: process.env.MYSQL_BIN_PATH || 'mysql',
  // MySQLDump命令路径
  mysqldumpBinPath: process.env.MYSQLDUMP_BIN_PATH || 'mysqldump'
};

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'notes_platform'
};

// 确保备份目录存在
const ensureBackupDirectory = () => {
  if (!fs.existsSync(backupConfig.backupDir)) {
    fs.mkdirSync(backupConfig.backupDir, { recursive: true });
  }
  return backupConfig.backupDir;
};

// 生成备份文件名
const generateBackupFileName = () => {
  const timestamp = formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss');
  return `${dbConfig.database}_backup_${timestamp}${backupConfig.extension}`;
};

// 获取备份文件路径
const getBackupFilePath = (filename = null) => {
  const dir = ensureBackupDirectory();
  return filename ? path.join(dir, filename) : path.join(dir, generateBackupFileName());
};

// 执行数据库备份（使用mysqldump命令）
const backupDatabase = async () => {
  try {
    const backupFilePath = getBackupFilePath();
    const dir = path.dirname(backupFilePath);
    
    // 确保备份目录存在
    ensureBackupDirectory();
    
    // 构建mysqldump命令
    const cmd = `${backupConfig.mysqldumpBinPath} --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password=${dbConfig.password} --databases ${dbConfig.database} --single-transaction --quick --lock-tables=false > "${backupFilePath}"`;
    
    console.log(`开始备份数据库到: ${backupFilePath}`);
    await execAsync(cmd);
    
    // 获取备份文件大小
    const stats = fs.statSync(backupFilePath);
    const fileSize = stats.size;
    
    // 记录备份日志
    await logSystem('backup', `数据库备份成功，文件：${path.basename(backupFilePath)}，大小：${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    
    // 清理旧备份
    await cleanupOldBackups();
    
    return {
      success: true,
      message: '数据库备份成功',
      backupFile: path.basename(backupFilePath),
      backupPath: backupFilePath,
      size: fileSize
    };
  } catch (error) {
    console.error('数据库备份失败:', error);
    await logError(error, { action: 'backup', database: dbConfig.database });
    
    return {
      success: false,
      message: '数据库备份失败',
      error: formatError(error)
    };
  }
};

// 执行数据库恢复（使用mysql命令）
const restoreDatabase = async (backupFileName) => {
  try {
    const backupFilePath = getBackupFilePath(backupFileName);
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      return {
        success: false,
        message: '备份文件不存在'
      };
    }
    
    // 构建mysql命令
    const cmd = `${backupConfig.mysqlBinPath} --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password=${dbConfig.password} ${dbConfig.database} < "${backupFilePath}"`;
    
    console.log(`开始从备份文件恢复数据库: ${backupFileName}`);
    await execAsync(cmd);
    
    // 记录恢复日志
    await logSystem('restore', `数据库恢复成功，文件：${backupFileName}`);
    
    return {
      success: true,
      message: '数据库恢复成功',
      backupFile: backupFileName
    };
  } catch (error) {
    console.error('数据库恢复失败:', error);
    await logError(error, { action: 'restore', database: dbConfig.database, backupFile: backupFileName });
    
    return {
      success: false,
      message: '数据库恢复失败',
      error: formatError(error)
    };
  }
};

// 清理旧备份
const cleanupOldBackups = async () => {
  try {
    const dir = ensureBackupDirectory();
    
    // 读取备份目录中的所有文件
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith(backupConfig.extension) && file.includes('_backup_'))
      .map(file => ({
        name: file,
        path: path.join(dir, file),
        mtime: fs.statSync(path.join(dir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排序
    
    // 如果备份文件数量超过最大限制，删除旧的备份
    if (files.length > backupConfig.maxBackups) {
      const filesToDelete = files.slice(backupConfig.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`已删除旧备份: ${file.name}`);
        await logSystem('backup_cleanup', `已删除旧备份: ${file.name}`);
      }
    }
    
    return { success: true, message: '清理旧备份成功' };
  } catch (error) {
    console.error('清理旧备份失败:', error);
    await logError(error, { action: 'backup_cleanup' });
    
    return {
      success: false,
      message: '清理旧备份失败',
      error: formatError(error)
    };
  }
};

// 获取备份文件列表
const getBackupFilesList = () => {
  try {
    const dir = ensureBackupDirectory();
    
    // 读取备份目录中的所有文件
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith(backupConfig.extension) && file.includes('_backup_'))
      .map(file => {
        const stats = fs.statSync(path.join(dir, file));
        return {
          name: file,
          path: path.join(dir, file),
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          modifiedTime: new Date(stats.mtime),
          modifiedTimeFormatted: formatDateTime(new Date(stats.mtime), 'YYYY-MM-DD HH:mm:ss')
        };
      })
      .sort((a, b) => b.modifiedTime - a.modifiedTime); // 按修改时间降序排序
    
    return {
      success: true,
      data: files
    };
  } catch (error) {
    console.error('获取备份文件列表失败:', error);
    
    return {
      success: false,
      message: '获取备份文件列表失败',
      error: formatError(error)
    };
  }
};

// 删除指定的备份文件
const deleteBackupFile = async (backupFileName) => {
  try {
    const backupFilePath = getBackupFilePath(backupFileName);
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      return {
        success: false,
        message: '备份文件不存在'
      };
    }
    
    // 删除备份文件
    fs.unlinkSync(backupFilePath);
    
    // 记录删除日志
    await logSystem('backup_delete', `已删除备份文件: ${backupFileName}`);
    
    return {
      success: true,
      message: '备份文件删除成功'
    };
  } catch (error) {
    console.error('删除备份文件失败:', error);
    await logError(error, { action: 'backup_delete', backupFile: backupFileName });
    
    return {
      success: false,
      message: '备份文件删除失败',
      error: formatError(error)
    };
  }
};

// 清空所有备份文件
const clearAllBackups = async () => {
  try {
    const dir = ensureBackupDirectory();
    
    // 读取备份目录中的所有文件
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith(backupConfig.extension) && file.includes('_backup_'));
    
    // 删除所有备份文件
    for (const file of files) {
      fs.unlinkSync(path.join(dir, file));
    }
    
    // 记录清空日志
    await logSystem('backup_clear_all', `已清空所有备份文件，共删除 ${files.length} 个文件`);
    
    return {
      success: true,
      message: `已清空所有备份文件，共删除 ${files.length} 个文件`
    };
  } catch (error) {
    console.error('清空备份文件失败:', error);
    await logError(error, { action: 'backup_clear_all' });
    
    return {
      success: false,
      message: '清空备份文件失败',
      error: formatError(error)
    };
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 验证备份文件是否有效
const validateBackupFile = (backupFileName) => {
  try {
    const backupFilePath = getBackupFilePath(backupFileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      return { valid: false, reason: '文件不存在' };
    }
    
    // 检查文件大小是否为0
    const stats = fs.statSync(backupFilePath);
    if (stats.size === 0) {
      return { valid: false, reason: '文件为空' };
    }
    
    // 检查文件扩展名
    if (!backupFileName.endsWith(backupConfig.extension)) {
      return { valid: false, reason: '文件扩展名不正确' };
    }
    
    // 检查文件是否包含_backup_标识
    if (!backupFileName.includes('_backup_')) {
      return { valid: false, reason: '文件名称格式不正确' };
    }
    
    // 检查文件内容是否包含CREATE TABLE等关键字
    const fileContent = fs.readFileSync(backupFilePath, 'utf8', { encoding: 'utf8' });
    if (!fileContent.includes('CREATE TABLE') && !fileContent.includes('INSERT INTO')) {
      return { valid: false, reason: '文件内容可能不是有效的SQL备份' };
    }
    
    return { valid: true, reason: '备份文件有效' };
  } catch (error) {
    console.error('验证备份文件失败:', error);
    return { valid: false, reason: `验证失败: ${formatError(error)}` };
  }
};

// 创建备份配置文件
const createBackupConfig = () => {
  try {
    const configData = {
      backupConfig,
      dbConfig,
      lastUpdated: new Date().toISOString()
    };
    
    const configPath = path.join(ensureBackupDirectory(), 'backup_config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    
    return { success: true, message: '备份配置文件创建成功' };
  } catch (error) {
    console.error('创建备份配置文件失败:', error);
    
    return {
      success: false,
      message: '创建备份配置文件失败',
      error: formatError(error)
    };
  }
};

// 获取数据库大小
const getDatabaseSize = async () => {
  try {
    const [rows] = await connectionPool.execute(
      'SELECT table_schema AS `database`, SUM(data_length + index_length) / 1024 / 1024 AS `size` FROM information_schema.TABLES WHERE table_schema = ? GROUP BY table_schema',
      [dbConfig.database]
    );
    
    if (rows && rows.length > 0) {
      return {
        success: true,
        data: {
          size: rows[0].size,
          sizeFormatted: formatFileSize(rows[0].size * 1024 * 1024)
        }
      };
    } else {
      return {
        success: true,
        data: {
          size: 0,
          sizeFormatted: '0 Bytes'
        }
      };
    }
  } catch (error) {
    console.error('获取数据库大小失败:', error);
    
    return {
      success: false,
      message: '获取数据库大小失败',
      error: formatError(error)
    };
  }
};

// 导出数据库表结构
const exportDatabaseSchema = async () => {
  try {
    const schemaFilePath = getBackupFilePath(`${dbConfig.database}_schema_${formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss')}${backupConfig.extension}`);
    
    // 构建只导出表结构的命令
    const cmd = `${backupConfig.mysqldumpBinPath} --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password=${dbConfig.password} --no-data ${dbConfig.database} > "${schemaFilePath}"`;
    
    await execAsync(cmd);
    
    // 记录导出日志
    await logSystem('schema_export', `数据库表结构导出成功，文件：${path.basename(schemaFilePath)}`);
    
    return {
      success: true,
      message: '数据库表结构导出成功',
      schemaFile: path.basename(schemaFilePath),
      schemaPath: schemaFilePath
    };
  } catch (error) {
    console.error('导出数据库表结构失败:', error);
    await logError(error, { action: 'schema_export', database: dbConfig.database });
    
    return {
      success: false,
      message: '导出数据库表结构失败',
      error: formatError(error)
    };
  }
};

// 导出数据库备份和恢复工具函数
module.exports = {
  backupDatabase,
  restoreDatabase,
  cleanupOldBackups,
  getBackupFilesList,
  deleteBackupFile,
  clearAllBackups,
  validateBackupFile,
  createBackupConfig,
  getDatabaseSize,
  exportDatabaseSchema,
  backupConfig,
  dbConfig
};