const { pool } = require('./src/database/db');

async function testConnection() {
  try {
    console.log('尝试连接数据库...');
    const connection = await pool.getConnection();
    console.log('数据库连接成功!');
    
    // 尝试执行简单查询
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('查询结果:', rows);
    
    connection.release();
    
    // 尝试创建一个简单的测试表
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50)
        )
      `);
      console.log('测试表创建成功');
    } catch (error) {
      console.error('创建测试表失败:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();