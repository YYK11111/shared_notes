// 测试API连接的脚本
import axios from 'axios';

// 测试后端直接连接
testBackendDirect();

// 测试带代理的前端请求
testFrontendProxy();

async function testBackendDirect() {
  console.log('\n=== 测试后端直接连接 ===');
  try {
    const response = await axios.get('http://localhost:3000/api/health');
    console.log('✅ 后端健康检查成功:', response.data);
  } catch (error) {
    console.error('❌ 后端健康检查失败:', error.message);
  }
}

async function testFrontendProxy() {
  console.log('\n=== 测试前端代理请求 ===');
  try {
    // 模拟前端的API请求配置
    const VITE_API_BASE_URL = 'http://localhost:3000';
    
    // 测试用户相关接口
    const userApis = ['/user/recommend-notes', '/user/notes', '/user/categories', '/user/hot-notes'];
    
    for (const apiPath of userApis) {
      try {
        console.log(`\n测试接口: ${apiPath}`);
        // 模拟前端请求，包含授权头
        const response = await axios.get(`${VITE_API_BASE_URL}/api${apiPath}`, {
          headers: {
            'Authorization': 'Bearer test-token' // 使用测试token
          },
          timeout: 5000
        });
        console.log(`✅ ${apiPath} 请求成功`);
      } catch (error) {
        console.error(`❌ ${apiPath} 请求失败:`, error.message);
        if (error.response) {
          console.log('  响应状态码:', error.response.status);
          console.log('  响应数据:', error.response.data);
        }
      }
    }
  } catch (error) {
    console.error('❌ 前端代理测试异常:', error.message);
  }
}