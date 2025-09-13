const { pool } = require('./backend/src/database/db');

// 查询指定表的结构
async function checkTableStructure(tableName) {
  try {
    const connection = await pool.getConnection();
    
    console.log(`\n查询表 ${tableName} 的结构:`);
    const [columns] = await connection.execute(
      `SHOW CREATE TABLE ${tableName}`
    );
    
    if (columns && columns.length > 0 && columns[0]['Create Table']) {
      console.log(columns[0]['Create Table']);
    } else {
      console.log(`表 ${tableName} 的结构信息获取失败`);
    }
    
    connection.release();
  } catch (error) {
    console.error(`查询表 ${tableName} 的结构失败:`, error.message);
  }
}

// 检查所有额外的表
async function checkAllExtraTables() {
  const extraTables = ['exposure_logs', 'note_views', 'search_blocked_notes', 'search_index', 'test_table'];
  
  try {
    for (const table of extraTables) {
      await checkTableStructure(table);
    }
    
    console.log('\n所有额外表的结构查询完成');
  } catch (error) {
    console.error('查询表结构过程中出错:', error);
  } finally {
    process.exit(0);
  }
}

checkAllExtraTables();