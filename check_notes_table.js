const { query } = require('./backend/src/database/dbConfig');

async function checkNotesTable() {
  try {
    console.log('正在检查notes表结构...');
    const [result] = await query('DESCRIBE notes');
    console.log('notes表结构:');
    result.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? '可空' : '非空'})`);
    });
  } catch (error) {
    console.error('检查notes表结构失败:', error);
  }
}

checkNotesTable();