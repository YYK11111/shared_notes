const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '14.103.155.246',
  port: 13306,
  user: 'personal_notes',
  password: 'PREzE7YBpmyKfQhP',
  database: 'personal_notes'
};

// 查询函数
async function checkCategoriesTable() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 检查categories表是否存在
    const [tableExists] = await connection.execute(
      "SHOW TABLES LIKE 'categories'"
    );
    
    if (tableExists.length === 0) {
      console.log('categories表不存在');
      return;
    }
    
    console.log('categories表存在');
    
    // 查询categories表的数据量
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM categories'
    );
    
    console.log(`categories表当前数据量: ${countResult[0].total}`);
    
    // 显示所有分类数据
    const [categoriesData] = await connection.execute(
      'SELECT * FROM categories'
    );
    
    if (categoriesData.length > 0) {
      console.log('所有分类数据:');
      categoriesData.forEach(cat => {
        console.log(`- 分类ID: ${cat.id}, 分类名称: ${cat.name}, 排序: ${cat.sort_order}, 创建时间: ${cat.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行查询
checkCategoriesTable();