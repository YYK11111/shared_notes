const { query } = require('./backend/src/database/dbConfig');

async function checkTableIndex() {
  try {
    console.log('检查search_logs表的索引情况...');
    const [indexes] = await query('SHOW INDEX FROM search_logs');
    console.log('索引信息:', indexes);
    
    console.log('\n检查表中的数据量...');
    const [countResult] = await query('SELECT COUNT(*) as count FROM search_logs');
    console.log('表中数据量:', countResult[0].count);
    
    console.log('\n测试查询性能...');
    const startTime = Date.now();
    const [testResult] = await query('SELECT keyword, search_count FROM search_logs ORDER BY search_count DESC LIMIT 10');
    const endTime = Date.now();
    console.log('查询耗时:', endTime - startTime, 'ms');
    console.log('查询结果示例:', testResult.slice(0, 3));
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkTableIndex();