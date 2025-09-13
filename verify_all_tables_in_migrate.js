const fs = require('fs');
const path = require('path');

// 预期在数据库中存在的表
const expectedTables = [
  'admins', 'carousels', 'categories', 'exposure_logs', 'feedback', 
  'file_resource_mapping', 'files', 'login_logs', 'note_categories', 
  'note_views', 'notes', 'permissions', 'role_permissions', 'roles', 
  'search_blocked_notes', 'search_index', 'search_logs', 
  'sensitive_words', 'system_configs', 'system_logs'
];

// 测试表（不需要包含在migrate.js中）
const testTables = ['test_table'];

// 读取migrate.js文件内容
function readMigrateFile() {
  const migrateFilePath = path.join(__dirname, 'backend', 'src', 'database', 'migrate.js');
  try {
    return fs.readFileSync(migrateFilePath, 'utf8');
  } catch (error) {
    console.error('读取migrate.js文件失败:', error.message);
    process.exit(1);
  }
}

// 检查表是否在migrate.js中定义
function checkTablesInMigrate(migrateContent) {
  console.log('开始检查数据库表是否都在migrate.js中定义...\n');
  
  // 创建一个更宽松的正则表达式，考虑可能的空格、换行和引号
  const getTableRegex = (tableName) => {
    // 匹配 CREATE TABLE IF NOT EXISTS 表名 或 CREATE TABLE 表名 的各种可能格式
    return new RegExp('CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?([\\`\\"]?)' + tableName + '\\2', 'i');
  };
  
  let missingTables = [];
  let foundTables = [];
  
  for (const table of expectedTables) {
    const tableRegex = getTableRegex(table);
    if (tableRegex.test(migrateContent)) {
      foundTables.push(table);
      console.log(`✓ 表 ${table} 在migrate.js中已定义`);
    } else {
      missingTables.push(table);
      console.log(`✗ 表 ${table} 在migrate.js中未定义`);
    }
  }
  
  console.log('\n测试表状态:');
  for (const table of testTables) {
    const tableRegex = getTableRegex(table);
    if (tableRegex.test(migrateContent)) {
      console.log(`⚠️ 注意: 测试表 ${table} 被包含在migrate.js中，建议移除`);
    } else {
      console.log(`✓ 测试表 ${table} 未包含在migrate.js中（正确）`);
    }
  }
  
  console.log('\n检查结果汇总:');
  console.log(`- 已在migrate.js中定义的表数量: ${foundTables.length}`);
  console.log(`- 未在migrate.js中定义的表数量: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n未定义的表列表:', missingTables.join(', '));
    console.log('建议: 将这些表添加到migrate.js的createTables函数中以保持一致性');
  } else {
    console.log('\n所有功能表都已在migrate.js中定义！');
  }
  
  console.log('\n注意: 测试表建议从生产环境数据库中移除');
  
  // 显示一些migrate.js文件中的实际内容，以便调试
  console.log('\n调试信息: migrate.js文件中找到的表定义片段（前1000字符）:');
  const tableDefinitionSection = migrateContent.match(/CREATE\\s+TABLE[\\s\\S]{0,1000}/i);
  if (tableDefinitionSection) {
    console.log(tableDefinitionSection[0].substring(0, 500) + '...');
  }
}

// 执行检查
function runCheck() {
  const migrateContent = readMigrateFile();
  checkTablesInMigrate(migrateContent);
}

runCheck();