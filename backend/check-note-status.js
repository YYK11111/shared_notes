// 检查笔记状态值
const mysql = require('mysql2/promise');

async function checkNoteStatus() {
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

    // 查询笔记状态分布
    const [statusDistribution] = await connection.execute(
      'SELECT status, COUNT(*) as count FROM notes GROUP BY status'
    );
    
    console.log('笔记状态分布:');
    console.log(statusDistribution);

    // 查询前10条笔记的详细状态
    const [notes] = await connection.execute(
      'SELECT id, title, status, created_at FROM notes ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log('\n前10条笔记的状态:');
    notes.forEach(note => {
      console.log(`ID: ${note.id}, 标题: ${note.title}, 状态: ${note.status}, 创建时间: ${note.created_at}`);
    });

    // 检查notes表的结构，确认status字段的定义
    const [tableStructure] = await connection.execute(
      'SHOW COLUMNS FROM notes WHERE Field = "status"'
    );
    
    console.log('\nnotes表中status字段的定义:');
    console.log(tableStructure);

    await connection.end();
  } catch (error) {
    console.error('数据库操作失败:', error);
  }
}

checkNoteStatus();