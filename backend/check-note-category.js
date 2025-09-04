const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '14.103.155.246',
  port: 13306,
  user: 'personal_notes',
  password: 'PREzE7YBpmyKfQhP',
  database: 'personal_notes'
};

// 要查询的笔记ID
const noteId = 60;

// 查询函数
async function checkNoteCategories() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 查询笔记基本信息
    const [noteInfo] = await connection.execute(
      'SELECT id, title, status, created_at FROM notes WHERE id = ?',
      [noteId]
    );
    
    if (noteInfo.length === 0) {
      console.log(`ID为${noteId}的笔记不存在`);
      return;
    }
    
    console.log(`笔记ID: ${noteId}`);
    console.log(`笔记标题: ${noteInfo[0].title}`);
    console.log(`笔记状态: ${noteInfo[0].status === 1 ? '已发布' : '草稿'}`);
    
    // 查询笔记关联的分类
    const [categoryRelations] = await connection.execute(
      'SELECT nc.category_id, c.name FROM note_categories nc LEFT JOIN categories c ON nc.category_id = c.id WHERE nc.note_id = ?',
      [noteId]
    );
    
    if (categoryRelations.length === 0) {
      console.log(`ID为${noteId}的笔记没有关联任何分类`);
    } else {
      console.log(`ID为${noteId}的笔记关联的分类:`);
      categoryRelations.forEach(cat => {
        console.log(`- 分类ID: ${cat.category_id}, 分类名称: ${cat.name}`);
      });
    }
    
    // 查询前端实际接收到的数据（模拟前端获取笔记列表的查询）
    console.log('\n模拟前端获取笔记列表时的查询结果:');
    const [frontendNoteData] = await connection.execute(
      'SELECT n.*, GROUP_CONCAT(c.name) as categories FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.id = ? GROUP BY n.id',
      [noteId]
    );
    
    console.log('笔记数据:', frontendNoteData[0]);
    console.log('categories字段值:', frontendNoteData[0].categories);
    console.log('categories字段类型:', typeof frontendNoteData[0].categories);
    
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
checkNoteCategories();