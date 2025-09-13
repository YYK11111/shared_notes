const { query, testConnection } = require('./backend/src/database/dbConfig');

async function runTest() {
  try {
    console.log('测试数据库连接...');
    const connected = await testConnection();
    console.log('数据库连接状态:', connected ? '成功' : '失败');
    
    if (connected) {
      console.log('执行测试查询...');
      const [result] = await query('SELECT 1 + 1 AS result');
      console.log('查询结果:', result);
      
      // 尝试执行一个简单的userRoutes相关查询
      console.log('执行userRoutes相关查询...');
      const [systemConfigs] = await query('SELECT * FROM system_configs LIMIT 1');
      console.log('系统配置查询结果:', systemConfigs);
    }
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

runTest();