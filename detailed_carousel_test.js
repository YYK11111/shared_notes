// 详细的轮播图接口测试脚本 - 使用Node.js内置http模块
const http = require('http');

console.log('开始详细测试轮播图接口...');
console.log('请求URL: http://localhost:3000/api/public/carousels');

const startTime = Date.now();

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/public/carousels',
  method: 'GET',
  timeout: 10000 // 10秒超时
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log('响应头:');
  console.log(res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const endTime = Date.now();
    console.log(`请求完成! 耗时: ${endTime - startTime}ms`);
    console.log('响应体:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
      
      if (res.statusCode === 200 && parsedData.data) {
        console.log(`\n✓ 轮播图接口正常工作，返回了 ${parsedData.data.length} 条数据`);
      }
    } catch (error) {
      console.error('解析响应数据失败:', error);
      console.log('原始响应数据:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
  console.error(`错误码: ${error.code}`);
  console.error(`错误地址: ${error.address}:${error.port}`);
  console.error(`错误原因: ${error.message}`);
});

req.on('timeout', () => {
  console.error('请求超时: 超过10秒没有响应');
  req.destroy();
});

// 结束请求
req.end();

// 全局超时处理
setTimeout(() => {
  console.error('全局超时: 超过15秒没有完成测试');
  process.exit(1);
}, 15000);