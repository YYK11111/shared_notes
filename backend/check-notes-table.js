// 检查notes表结构和测试查询
const mysql = require('mysql2/promise');

async function checkNotesTable() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: '14.103.155.246',
      port: 13306,
      user: 'personal_notes',
      password: 'PREzE7YBpmyKfQhP',
      database: 'personal_notes'
    });

    console.log('数据库连接成功');

    // 专门检查view_count字段
    const [viewCountField] = await connection.execute(
      'SHOW COLUMNS FROM notes WHERE Field = "view_count"'
    );
    
    console.log('view_count字段详情:');
    if (viewCountField.length > 0) {
      console.log(viewCountField[0]);
    } else {
      console.log('notes表中不存在view_count字段');
    }

    // 测试简单的查询语句
    try {
      console.log('\n测试查询语句...');
      const [result] = await connection.execute(
        'SELECT n.id, n.title, n.status, n.view_count, GROUP_CONCAT(c.name) as categories FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id GROUP BY n.id LIMIT 5'
      );
      console.log('测试查询成功，返回行数:', result.length);
      if (result.length > 0) {
        console.log('查询结果示例:', result[0]);
      }
    } catch (queryError) {
      console.error('测试查询失败:', queryError.sqlMessage || queryError.message);
    }

    await connection.end();
  } catch (error) {
    console.error('数据库操作失败:', error);
  }
}

checkNotesTable();