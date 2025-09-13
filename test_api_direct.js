const http = require('http');

console.log('正在直接测试API...');
const startTime = Date.now();

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/public/search/hot',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const endTime = Date.now();
    console.log(`响应数据: ${data}`);
    console.log(`请求耗时: ${endTime - startTime} ms`);
  });
});

req.on('error', (e) => {
  const endTime = Date.now();
  console.error(`请求错误: ${e.message}`);
  console.error(`请求耗时: ${endTime - startTime} ms`);
});

req.on('timeout', () => {
  const endTime = Date.now();
  console.error('请求超时');
  console.error(`请求耗时: ${endTime - startTime} ms`);
  req.abort();
});

req.setTimeout(5000);
req.end();