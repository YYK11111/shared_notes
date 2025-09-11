const { getFileUploadConfig } = require('./src/services/configService');

/**
 * 测试文件上传配置服务
 * - 验证优化后的getFileUploadConfig函数是否正常工作
 * - 检查返回的配置对象是否包含所有预期字段
 */
async function testFileConfigService() {
  try {
    console.log('开始测试文件上传配置服务...');
    
    // 调用优化后的配置获取函数
    const config = await getFileUploadConfig();
    
    console.log('\n获取到的文件上传配置:');
    console.log('----------------------------------');
    console.log(`最大文件大小 (字节): ${config.maxSize}`);
    console.log(`最大文件大小 (MB): ${config.maxSizeMB}`);
    console.log(`允许的文件类型: ${JSON.stringify(config.allowedTypes)}`);
    console.log(`最大文件数量: ${config.maxCount}`);
    console.log(`是否启用文件上传: ${config.enable ? '是' : '否'}`);
    console.log(`文件存储路径: ${config.storagePath}`);
    console.log('----------------------------------');
    
    // 验证配置的一致性
    console.log('\n配置一致性检查:');
    const expectedBytes = config.maxSizeMB * 1024 * 1024;
    if (config.maxSize === expectedBytes) {
      console.log('✓ maxSize和maxSizeMB计算一致');
    } else {
      console.log(`✗ maxSize和maxSizeMB计算不一致!`);
      console.log(`  预期: ${expectedBytes} 字节`);
      console.log(`  实际: ${config.maxSize} 字节`);
    }
    
    // 验证必要字段是否存在
    console.log('\n字段完整性检查:');
    const requiredFields = ['maxSize', 'maxSizeMB', 'allowedTypes', 'maxCount', 'enable', 'storagePath'];
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (config[field] === undefined) {
        console.log(`✗ 缺少字段: ${field}`);
        allFieldsPresent = false;
      } else {
        console.log(`✓ 字段存在: ${field}`);
      }
    }
    
    console.log('\n测试完成!');
    if (allFieldsPresent && config.maxSize === expectedBytes) {
      console.log('✓ 配置服务工作正常');
    } else {
      console.log('✗ 配置服务存在问题，请检查');
    }
  } catch (error) {
    console.error('测试文件配置服务失败:', error);
  }
}

// 执行测试
console.log('注意：测试可能需要数据库连接正常');
testFileConfigService()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });