// 全面测试笔记搜索功能
const mysql = require('mysql2/promise');

async function testNotesSearch() {
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

    // 测试场景1：模拟有匹配结果的搜索（如果有真实数据的话）
    console.log('\n=== 测试场景1：模拟有匹配结果的搜索 ===');
    await testSearchScenario(connection, '测试');
    
    // 测试场景2：模拟没有匹配结果的搜索
    console.log('\n=== 测试场景2：模拟没有匹配结果的搜索 ===');
    await testSearchScenario(connection, '这是一个不存在的关键词123456789');
    
    // 测试场景3：边界情况 - 空关键词
    console.log('\n=== 测试场景3：边界情况 - 空关键词 ===');
    await testSearchScenario(connection, '');
    
    // 测试场景4：边界情况 - 特殊字符
    console.log('\n=== 测试场景4：边界情况 - 特殊字符 ===');
    await testSearchScenario(connection, '%@#$^*()');

    await connection.end();
  } catch (error) {
    console.error('数据库操作失败:', error);
  }
}

async function testSearchScenario(connection, keyword) {
  try {
    console.log(`搜索关键词: "${keyword}"`);
    
    // 构建与noteRoutes.js中相同的查询
    let query = 'SELECT n.id, n.title, n.cover_image, n.status, n.is_top, n.top_expire_time, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.view_count, n.created_at, n.updated_at, GROUP_CONCAT(c.name) as categories FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id';
    const whereClause = [];
    const params = [];
    
    if (keyword) {
      whereClause.push('(n.title LIKE ? OR n.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 添加排序和限制
    query += ' GROUP BY n.id ORDER BY n.updated_at DESC LIMIT 10 OFFSET 0';
    
    console.log('执行查询:', query);
    console.log('参数:', params);
    
    // 执行查询
    const [notes] = await connection.execute(query, params);
    console.log('查询结果数量:', notes.length);
    
    // 如果有结果，显示第一条
    if (notes.length > 0) {
      console.log('第一条结果标题:', notes[0].title);
    } else {
      console.log('没有找到匹配的笔记 - 这是正常情况，不应导致500错误');
    }
    
    // 测试计数查询
    let countQuery = 'SELECT COUNT(DISTINCT n.id) as total FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id';
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await connection.execute(countQuery, params);
    console.log('总条数:', countResult[0].total);
    
  } catch (error) {
    console.error('搜索测试失败:', error.sqlMessage || error.message);
  }
}

testNotesSearch();