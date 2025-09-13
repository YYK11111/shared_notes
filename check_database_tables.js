const { pool } = require('./backend/src/database/db');

// 查询数据库中的所有表
async function getDatabaseTables() {
  try {
    const connection = await pool.getConnection();
    
    console.log('查询数据库中的所有表...');
    const [tables] = await connection.execute(
      "SHOW TABLES"
    );
    
    // 提取表名
    const tableNames = [];
    const column = Object.keys(tables[0])[0];
    for (const table of tables) {
      tableNames.push(table[column]);
    }
    
    console.log('数据库中的表:');
    tableNames.forEach(table => console.log(`- ${table}`));
    
    // 从migrate.js中提取定义的表
    const migrateTables = [
      'files', 'admins', 'roles', 'permissions', 'role_permissions', 
      'categories', 'notes', 'note_categories', 'feedback', 'login_logs', 
      'system_logs', 'system_configs', 'search_logs', 'sensitive_words', 
      'carousels', 'file_resource_mapping'
    ];
    
    console.log('\nmigrate.js中定义的表:');
    migrateTables.forEach(table => console.log(`- ${table}`));
    
    // 找出数据库中有但migrate.js中没有的表
    const extraTables = tableNames.filter(table => !migrateTables.includes(table));
    if (extraTables.length > 0) {
      console.log('\n数据库中有但migrate.js中没有定义的表:');
      extraTables.forEach(table => console.log(`- ${table}`));
    }
    
    // 找出migrate.js中有但数据库中没有的表
    const missingTables = migrateTables.filter(table => !tableNames.includes(table));
    if (missingTables.length > 0) {
      console.log('\nmigrate.js中有但数据库中没有的表:');
      missingTables.forEach(table => console.log(`- ${table}`));
    }
    
    connection.release();
  } catch (error) {
    console.error('查询数据库表失败:', error.message);
  } finally {
    process.exit(0);
  }
}

getDatabaseTables();