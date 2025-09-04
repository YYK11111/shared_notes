const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '14.103.155.246',
  port: 13306,
  user: 'personal_notes',
  password: 'PREzE7YBpmyKfQhP',
  database: 'personal_notes'
};

// 测试函数：为笔记添加分类关联
async function testAddNoteCategory(noteId, categoryId) {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 开始事务
    await connection.beginTransaction();
    
    try {
      // 检查笔记是否存在
      const [noteResult] = await connection.execute(
        'SELECT id, title FROM notes WHERE id = ?',
        [noteId]
      );
      
      if (noteResult.length === 0) {
        console.log(`笔记ID ${noteId} 不存在`);
        await connection.rollback();
        return;
      }
      
      // 检查分类是否存在
      const [categoryResult] = await connection.execute(
        'SELECT id, name FROM categories WHERE id = ?',
        [categoryId]
      );
      
      if (categoryResult.length === 0) {
        console.log(`分类ID ${categoryId} 不存在`);
        await connection.rollback();
        return;
      }
      
      // 检查笔记和分类是否已关联
      const [relationResult] = await connection.execute(
        'SELECT * FROM note_categories WHERE note_id = ? AND category_id = ?',
        [noteId, categoryId]
      );
      
      if (relationResult.length > 0) {
        console.log(`笔记ID ${noteId} 与分类ID ${categoryId} 已经关联`);
        await connection.rollback();
        return;
      }
      
      // 添加笔记分类关联
      await connection.execute(
        'INSERT INTO note_categories (note_id, category_id) VALUES (?, ?)',
        [noteId, categoryId]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`成功为笔记「${noteResult[0].title}」添加分类「${categoryResult[0].name}」`);
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      console.error('添加分类关联失败:', error);
    }
    
  } catch (error) {
    console.error('数据库连接或操作失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 测试函数：获取所有笔记及其分类
async function getNotesWithCategories() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 查询所有笔记及其分类
    const [results] = await connection.execute(
      `SELECT n.id, n.title, GROUP_CONCAT(c.name) as categories 
       FROM notes n 
       LEFT JOIN note_categories nc ON n.id = nc.note_id 
       LEFT JOIN categories c ON nc.category_id = c.id 
       GROUP BY n.id 
       ORDER BY n.created_at DESC 
       LIMIT 20`
    );
    
    console.log('\n最近20条笔记及其分类信息:');
    results.forEach(note => {
      console.log(`- 笔记ID: ${note.id}, 标题: ${note.title}, 分类: ${note.categories || '无'}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 主函数
async function main() {
  console.log('=== 笔记分类测试工具 ===');
  console.log('1. 这个工具可以帮助你手动为笔记添加分类');
  console.log('2. 还可以查看最近20条笔记的分类情况');
  console.log('3. 注意：前端已修复，新创建的笔记应该能正确保存分类了');
  
  // 示例：为笔记ID 60 添加分类ID 11
  await testAddNoteCategory(60, 11);
  
  // 查看最近20条笔记及其分类
  await getNotesWithCategories();
  
  console.log('\n=== 测试完成 ===');
  console.log('请在前端创建新笔记并选择分类，验证修复效果');
}

// 执行主函数
main();