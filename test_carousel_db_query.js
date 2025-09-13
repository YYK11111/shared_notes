// 测试轮播图数据库查询
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// 加载.env文件
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function testCarouselQuery() {
  try {
    console.log('开始测试轮播图数据库查询...');
    
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'note_sharing_platform'
    });
    
    console.log('数据库连接成功!');
    
    // 检查carousels表是否存在
    console.log('\n检查carousels表是否存在...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'carousels'"
    );
    
    if (tables.length === 0) {
      console.error('错误: carousels表不存在!');
      await connection.end();
      return;
    }
    
    console.log('✓ carousels表存在');
    
    // 检查表结构
    console.log('\n检查carousels表结构...');
    const [columns] = await connection.query(
      "DESCRIBE carousels"
    );
    console.log('表结构:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });
    
    // 执行轮播图查询
    console.log('\n执行轮播图查询...');
    const querySql = 'SELECT file_id FROM carousels WHERE status = 1 AND NOW() BETWEEN start_time AND end_time ORDER BY sort ASC';
    
    const startTime = Date.now();
    const [results] = await connection.query(querySql);
    const endTime = Date.now();
    
    console.log(`查询执行成功! 耗时: ${endTime - startTime}ms`);
    console.log(`查询结果数量: ${results.length}`);
    
    if (results.length > 0) {
      console.log('查询结果样例:');
      console.log(results.slice(0, 3)); // 只显示前3条记录
    }
    
    // 关闭连接
    await connection.end();
    console.log('\n测试完成! 数据库连接已关闭。');
    
  } catch (error) {
    console.error('测试失败:', error);
    if (error.code) console.error(`错误码: ${error.code}`);
    if (error.sqlMessage) console.error(`SQL错误: ${error.sqlMessage}`);
  }
}

testCarouselQuery();