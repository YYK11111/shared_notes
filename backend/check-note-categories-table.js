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
async function checkNoteCategoriesTable() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 检查note_categories表是否存在
    const [tableExists] = await connection.execute(
      "SHOW TABLES LIKE 'note_categories'"
    );
    
    if (tableExists.length === 0) {
      console.log('note_categories表不存在');
      return;
    }
    
    console.log('note_categories表存在');
    
    // 查询note_categories表的数据量
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM note_categories'
    );
    
    console.log(`note_categories表当前数据量: ${countResult[0].total}`);
    
    // 如果有数据，显示前10条记录
    if (countResult[0].total > 0) {
      const [sampleData] = await connection.execute(
        'SELECT * FROM note_categories LIMIT 10'
      );
      console.log('note_categories表前10条记录:');
      sampleData.forEach(row => {
        console.log(`- note_id: ${row.note_id}, category_id: ${row.category_id}`);
      });
    }
    
    // 查询是否有笔记关联了分类（通过JOIN查询）
    const [notesWithCategories] = await connection.execute(
      'SELECT n.id, n.title, GROUP_CONCAT(c.name) as categories FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE nc.category_id IS NOT NULL GROUP BY n.id LIMIT 10'
    );
    
    console.log(`\n有关联分类的笔记数量: ${notesWithCategories.length}`);
    if (notesWithCategories.length > 0) {
      console.log('有关联分类的笔记（前10条）:');
      notesWithCategories.forEach(note => {
        console.log(`- 笔记ID: ${note.id}, 标题: ${note.title}, 分类: ${note.categories}`);
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
checkNoteCategoriesTable();