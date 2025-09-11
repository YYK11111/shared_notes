const { query } = require('./backend/database/dbConfig');

async function checkFileConfigs() {
  try {
    console.log('正在连接数据库并查询文件上传配置...');
    const results = await query('SELECT * FROM system_configs WHERE config_key LIKE ?', ['file.%']);
    console.log('文件上传配置数量:', results.length);
    console.log('配置项:', results.map(r => r.config_key));
    
    if (results.length === 0) {
      console.log('警告：数据库中没有找到任何文件上传相关的配置项！');
    } else {
      console.log('找到以下配置项的值：');
      results.forEach(config => {
        console.log(`${config.config_key}: ${config.config_value}`);
      });
    }
  } catch (e) {
    console.error('查询失败:', e);
  }
}

checkFileConfigs().then(() => {
  console.log('检查完成');
  process.exit();
});