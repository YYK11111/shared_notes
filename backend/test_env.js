// 简单测试环境变量是否被正确加载
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 获取当前脚本所在目录
const scriptDir = path.dirname(process.argv[1]);
console.log('脚本所在目录:', scriptDir);

// 明确指定.env文件的绝对路径
const envPath = path.join(scriptDir, '.env');
console.log('尝试加载.env文件路径:', envPath);

// 检查.env文件是否存在
if (fs.existsSync(envPath)) {
  console.log('✅ .env文件存在');
  
  // 从正确的路径加载.env文件
dotenv.config({ path: envPath });
  
  console.log('\n环境变量测试:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置(隐藏)' : '未设置');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('当前工作目录:', process.cwd());
} else {
  console.error('❌ .env文件不存在:', envPath);
}