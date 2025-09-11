const fs = require('fs');
const path = require('path');

// dbConfig.js文件路径
const dbConfigPath = path.join(__dirname, 'backend', 'src', 'database', 'dbConfig.js');

// 读取当前dbConfig.js内容
let dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');

console.log('\n=====================================');
console.log('       修复dbConfig.js查询函数返回格式');
console.log('=====================================');

// 分析文件内容
console.log('1. 正在分析当前查询函数实现...');

// 检查是否存在返回格式问题
const queryFunctionRegex = /async function query\(sql, params = \[\]\) \{([\s\S]*?)\}/;
const match = dbConfigContent.match(queryFunctionRegex);

if (match) {
  const queryFunctionBody = match[1];
  console.log('✅ 找到查询函数');
  
  // 检查是否返回的是[results]格式
  if (queryFunctionBody.includes('return results;') && !queryFunctionBody.includes('return [results];')) {
    console.log('✅ 发现返回格式问题：函数返回的是results而不是[results]');
    console.log('2. 正在修复查询函数返回格式...');
    
    // 备份原始文件
    const backupPath = dbConfigPath + '.bak';
    fs.writeFileSync(backupPath, dbConfigContent);
    console.log('3. 已备份原始文件到:', backupPath);
    
    // 修改查询函数返回格式
    const newContent = dbConfigContent.replace(/return results;/g, 'return [results];');
    
    // 写入修复后的内容
    fs.writeFileSync(dbConfigPath, newContent);
    console.log('4. 查询函数返回格式已修复完成！');
    console.log('   - 现在query函数返回[results]格式');
    console.log('   - 这将与pool.execute()函数保持一致的返回格式');
  } else {
    console.log('✅ 查询函数返回格式已经正确：函数返回的是[results]格式');
    console.log('   不需要修复');
  }
} else {
  console.error('❌ 无法找到query函数，请手动检查dbConfig.js文件');
}

console.log('\n=====================================');
console.log('       修复完成');
console.log('=====================================');
console.log('\n请重启后端服务以应用修复！');