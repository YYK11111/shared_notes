const axios = require('axios');

async function testApi() {
  try {
    console.log('正在测试热门搜索词API...');
    const response = await axios.get('http://localhost:3000/api/public/search/hot', {
      timeout: 5000
    });
    console.log('请求成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求错误:', error.message);
    }
  }
}

testApi();