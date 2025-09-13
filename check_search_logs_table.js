const { query } = require('./backend/src/database/dbConfig');

async function checkTable() {
  try {
    const [result] = await query('SHOW TABLES LIKE "search_logs"');
    console.log('search_logs表存在:', result.length > 0);
    if (result.length > 0) {
      const [columns] = await query('DESCRIBE search_logs');
      console.log('表结构:', columns.map(col => col.Field));
    }
  } catch (error) {
    console.error('检查表失败:', error);
  }
}

checkTable();