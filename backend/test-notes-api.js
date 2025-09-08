// 测试笔记列表API
const axios = require('axios');

// 配置axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试笔记列表API
async function testNotesAPI() {
  try {
    console.log('开始测试笔记列表API...');
    console.log('请求参数: {"page": 1, "pageSize": 10, "keyword": "111"}');
    
    // 模拟前端请求参数
    const params = {
      page: 1,
      pageSize: 10,
      keyword: '111'
    };
    
    // 发送请求
    const response = await api.get('/notes', {
      params: params,
      headers: {
        'Cookie': 'token=test_token' // 模拟登录状态
      }
    });
    
    console.log('请求成功!');
    console.log('状态码:', response.status);
    console.log('返回数据:', {
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.pageSize,
      totalPages: response.data.data.totalPages,
      listLength: response.data.data.list.length
    });
    
    // 如果有返回数据，显示第一条记录
    if (response.data.data.list.length > 0) {
      console.log('第一条记录示例:', response.data.data.list[0]);
    }
    
  } catch (error) {
    console.error('请求失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求错误:', error.message);
    }
  }
}

// 执行测试
(async () => {
  await testNotesAPI();
})();