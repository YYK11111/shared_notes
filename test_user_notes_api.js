const axios = require('axios');

// 测试用户笔记列表接口
async function testUserNotesApi() {
  try {
    console.log('测试 /api/user/notes 接口...');
    
    // 发送GET请求到用户笔记列表接口
    const response = await axios.get('http://localhost:3000/api/user/notes', {
      params: {
        page: 1,
        pageSize: 10,
        sort: 'created_at',
        order: 'desc'
      }
    });
    
    // 打印响应状态码和数据
    console.log('接口调用成功，状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查响应格式是否符合预期
    if (response.data.code === 200 && response.data.data && response.data.data.list) {
      console.log('\n✅ 测试通过：接口返回了正确格式的数据');
      console.log(`找到 ${response.data.data.total} 条笔记`);
      console.log(`当前是第 ${response.data.data.page} 页，共 ${response.data.data.totalPages} 页`);
    } else {
      console.error('❌ 测试失败：接口返回的数据格式不符合预期');
    }
    
  } catch (error) {
    console.error('❌ 接口测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 执行测试
console.log('开始测试用户笔记列表接口...');
testUserNotesApi().then(() => {
  console.log('\n测试完成');
});