const { query, transaction, executeInTransaction } = require('./database/dbConfig');
const { clearConfigCache } = require('./src/services/configService');

/**
 * 修复文件上传配置
 * - 确保file.max_size和file.max_size_bytes字段正确设置
 * - 提供合理的默认值并保持一致性
 */
async function fixFileUploadConfigs() {
  try {
    console.log('开始修复文件上传配置...');
    
    // 定义正确的配置值
    const correctConfigs = {
      'file.max_size': 12, // 12MB
      'file.max_size_bytes': 12 * 1024 * 1024, // 12582912字节
      'file.allowed_types': JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
      'file.max_count': 5,
      'file.enable': 1,
      'file.storage_path': 'uploads'
    };
    
    // 使用事务更新配置
    await transaction(async (connection) => {
      console.log('开始事务处理...');
      
      for (const [key, value] of Object.entries(correctConfigs)) {
        // 检查配置项是否存在
        const [existingConfigs] = await executeInTransaction(
          connection, 
          'SELECT * FROM system_configs WHERE config_key = ?', 
          [key]
        );
        
        if (existingConfigs.length === 0) {
          // 创建新的配置项
          await executeInTransaction(
            connection, 
            'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)', 
            [key, value, getConfigDescription(key)]
          );
          console.log(`创建配置项: ${key} = ${value}`);
        } else {
          // 更新配置项
          await executeInTransaction(
            connection, 
            'UPDATE system_configs SET config_value = ? WHERE config_key = ?', 
            [value, key]
          );
          console.log(`更新配置项: ${key} = ${value}`);
        }
      }
      
      console.log('配置更新完成');
    });
    
    // 清理配置缓存
    await clearConfigCache('file.max_size');
    await clearConfigCache('file.max_size_bytes');
    await clearConfigCache('file.allowed_types');
    await clearConfigCache('file.max_count');
    console.log('配置缓存清理完成');
    
    // 验证更新结果
    await verifyConfigUpdates();
    
    console.log('文件上传配置修复成功!');
  } catch (error) {
    console.error('修复文件上传配置失败:', error);
    // 尝试另一种方法：直接使用query函数
    try {
      console.log('尝试使用备用方法更新配置...');
      
      // 定义正确的配置值
      const correctConfigs = {
        'file.max_size': 12,
        'file.max_size_bytes': 12 * 1024 * 1024,
        'file.allowed_types': JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
        'file.max_count': 5,
        'file.enable': 1,
        'file.storage_path': 'uploads'
      };
      
      for (const [key, value] of Object.entries(correctConfigs)) {
        // 先尝试更新，如果没有记录则插入
        let result = await query(
          'UPDATE system_configs SET config_value = ? WHERE config_key = ?',
          [value, key]
        );
        
        if (result.affectedRows === 0) {
          // 没有找到记录，执行插入
          await query(
            'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
            [key, value, getConfigDescription(key)]
          );
          console.log(`备用方法 - 创建配置项: ${key} = ${value}`);
        } else {
          console.log(`备用方法 - 更新配置项: ${key} = ${value}`);
        }
      }
      
      console.log('备用方法配置更新完成');
    } catch (backupError) {
      console.error('备用方法也失败:', backupError);
      throw new Error('无法更新文件上传配置，请检查数据库连接和权限');
    }
  }
}

/**
 * 获取配置项的描述
 */
function getConfigDescription(key) {
  const descriptions = {
    'file.max_size': '文件最大大小(MB)',
    'file.max_size_bytes': '文件最大大小(字节)',
    'file.allowed_types': '允许的文件类型',
    'file.max_count': '最大文件数量',
    'file.enable': '是否启用文件上传',
    'file.storage_path': '文件存储路径'
  };
  
  return descriptions[key] || '文件上传相关配置';
}

/**
 * 验证配置更新结果
 */
async function verifyConfigUpdates() {
  try {
    const result = await query(
      'SELECT config_key, config_value FROM system_configs WHERE config_key LIKE ?',
      ['file.%']
    );
    
    console.log('\n当前文件配置状态:');
    result.forEach(config => {
      console.log(`${config.config_key}: ${config.config_value}`);
    });
  } catch (error) {
    console.error('验证配置更新结果失败:', error);
  }
}

// 执行修复
fixFileUploadConfigs()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });