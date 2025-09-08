// 直接测试笔记列表的SQL查询
const mysql = require('mysql2/promise');

async function testSQLQuery() {
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

    // 模拟前端传递的参数
    const keyword = '111';
    const pageSize = 10;
    const offset = 0; // page=1
    
    // 构建SQL查询 - 与noteRoutes.js中的查询保持一致
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
    
    // 不使用参数化的LIMIT和OFFSET
    query += ` GROUP BY n.id ORDER BY n.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    
    console.log('执行查询:', query);
    console.log('参数:', params);
    
    // 执行查询
    const [notes] = await connection.execute(query, params);
    console.log('查询成功，返回行数:', notes.length);
    
    // 显示结果
    if (notes.length > 0) {
      console.log('查询结果示例:', notes[0]);
    }
    
    // 测试计数查询
    let countQuery = 'SELECT COUNT(DISTINCT n.id) as total FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id';
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await connection.execute(countQuery, params);
    console.log('总条数:', countResult[0].total);
    
    await connection.end();
    
  } catch (error) {
    console.error('SQL查询失败:', error.sqlMessage || error.message);
  }
}

testSQLQuery();