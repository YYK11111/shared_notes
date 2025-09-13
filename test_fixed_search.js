const http = require('http');

console.log('正在测试修复后的搜索接口...');

// 构建请求选项
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/public/search?keyword=test',
  method: 'GET',
  timeout: 10000
};

// 记录请求开始时间
const startTime = Date.now();

// 发送请求
const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const endTime = Date.now();
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应数据: ${data}`);
    console.log(`请求耗时: ${endTime - startTime} ms`);
  });
});

// 处理错误
req.on('error', (error) => {
  const endTime = Date.now();
  console.error('请求失败:');
  console.error(error);
  console.log(`请求耗时: ${endTime - startTime} ms`);
});

// 处理超时
req.on('timeout', () => {
  const endTime = Date.now();
  console.error('请求超时');
  console.log(`请求耗时: ${endTime - startTime} ms`);
  req.abort();
});

// 结束请求
req.end();