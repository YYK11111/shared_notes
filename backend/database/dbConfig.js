
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
// 移除对logger的依赖，打破循环引用
// const logger = require('../utils/logger');

dotenv.config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'note_sharing_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 执行SQL查询
async function query(sql, params = []) {
  try {
    const connection = await pool.getConnection();
    try {
      // 检查是否是事务相关命令，这些命令不支持prepared statement协议
      const isTransactionCommand = 
        sql.trim().toUpperCase().startsWith('START TRANSACTION') ||
        sql.trim().toUpperCase().startsWith('COMMIT') ||
        sql.trim().toUpperCase().startsWith('ROLLBACK');
        
      // 对于事务命令使用query方法，其他也统一使用query方法来避免参数问题
      const [results] = isTransactionCommand 
        ? await connection.query(sql)
        : await connection.query(sql, params);
        
      return results;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('SQL查询执行失败:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

// 事务处理
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('事务执行失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行事务中的SQL
async function executeInTransaction(connection, sql, params = []) {
  const [results] = await connection.execute(sql, params);
  return results;
}

// 获取数据库信息
async function getDatabaseInfo() {
  try {
    const result = await query('SELECT VERSION() as version');
    return result[0].version;
  } catch (error) {
    console.error('获取数据库版本失败:', error);
    return null;
  }
}

// 检查数据库表是否存在
async function tableExists(tableName) {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [process.env.DB_NAME, tableName]
    );
    return result[0].count > 0;
  } catch (error) {
    console.error('检查表是否存在失败:', error);
    return false;
  }
}

// 关闭数据库连接池
async function closePool() {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭数据库连接池失败:', error);
  }
}

module.exports = {
  pool,
  testConnection,
  query,
  transaction,
  executeInTransaction,
  getDatabaseInfo,
  tableExists,
  closePool
};