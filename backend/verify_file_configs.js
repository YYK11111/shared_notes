const { query } = require('./database/dbConfig');

/**
 * 验证文件上传配置是否正确设置
 */
async function verifyFileConfigs() {
  try {
    console.log('开始验证文件上传配置...');
    
    // 查询所有file相关配置
    const results = await query(
      'SELECT config_key, config_value FROM system_configs WHERE config_key LIKE ?',
      ['file.%']
    );
    
    console.log('\n数据库中当前文件上传配置:');
    
    if (results.length === 0) {
      console.log('未找到任何文件上传配置！');
    } else {
      // 打印所有配置
      results.forEach(config => {
        console.log(`${config.config_key}: ${config.config_value}`);
      });
      
      // 特别验证关键配置
      const maxSizeConfig = results.find(c => c.config_key === 'file.max_size');
      const maxSizeBytesConfig = results.find(c => c.config_key === 'file.max_size_bytes');
      
      console.log('\n配置验证结果:');
      if (maxSizeConfig && maxSizeConfig.config_value === '12') {
        console.log('✓ file.max_size 已正确设置为 12MB');
      } else {
        console.log('✗ file.max_size 设置错误或不存在:', maxSizeConfig?.config_value || '不存在');
      }
      
      if (maxSizeBytesConfig && maxSizeBytesConfig.config_value === '12582912') {
        console.log('✓ file.max_size_bytes 已正确设置为 12582912 字节');
      } else {
        console.log('✗ file.max_size_bytes 设置错误或不存在:', maxSizeBytesConfig?.config_value || '不存在');
      }
      
      // 验证MB与字节值的一致性
      if (maxSizeConfig && maxSizeBytesConfig) {
        const expectedBytes = parseInt(maxSizeConfig.config_value) * 1024 * 1024;
        const actualBytes = parseInt(maxSizeBytesConfig.config_value);
        
        if (expectedBytes === actualBytes) {
          console.log('✓ file.max_size 和 file.max_size_bytes 配置一致');
        } else {
          console.log(`✗ file.max_size 和 file.max_size_bytes 配置不一致！`);
          console.log(`  预期字节值: ${expectedBytes}`);
          console.log(`  实际字节值: ${actualBytes}`);
        }
      }
    }
    
    console.log('\n验证完成');
  } catch (error) {
    console.error('验证文件配置失败:', error);
  }
}

// 执行验证
verifyFileConfigs()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });