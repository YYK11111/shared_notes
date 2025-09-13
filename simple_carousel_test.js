const axios = require('axios');

// 简单测试轮播图接口
async function simpleTest() {
  try {
    console.log('开始简单测试轮播图接口...');
    console.log('请求URL: http://localhost:3000/api/public/carousels');
    
    const startTime = Date.now();
    const response = await axios.get('http://localhost:3000/api/public/carousels', { timeout: 5000 });
    const endTime = Date.now();
    
    console.log(`请求成功! 耗时: ${endTime - startTime}ms`);
    console.log(`状态码: ${response.status}`);
    console.log(`返回数据:`, response.data);
    
    // 检查返回数据结构
    if (response.data && response.data.code === 200 && response.data.data) {
      console.log(`\n✓ 轮播图接口正常工作，返回了 ${response.data.data.length} 条数据`);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error(`- 状态码: ${error.response.status}`);
      console.error(`- 响应数据:`, error.response.data);
    }
  } finally {
    process.exit(0);
  }
}

simpleTest();