// 导入更完整的数据库配置
const dbConfig = require('./dbConfig');

// 导出必要的数据库连接池和函数
module.exports = {
  pool: dbConfig.pool,
  connectionPool: dbConfig.pool, // 保持向后兼容，让旧代码仍能使用connectionPool
  testConnection: dbConfig.testConnection,
  query: dbConfig.query,
  transaction: dbConfig.transaction,
  executeInTransaction: dbConfig.executeInTransaction,
  getDatabaseInfo: dbConfig.getDatabaseInfo,
  tableExists: dbConfig.tableExists,
  closePool: dbConfig.closePool
};