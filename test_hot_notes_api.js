const axios = require('axios');

// 测试获取热门笔记接口
async function testHotNotesAPI() {
  try {
    console.log('开始测试 /user/hot-notes 接口...');
    
    // 测试不传参数的情况（默认返回5条）
    const defaultResponse = await axios.get('http://localhost:3000/api/user/hot-notes');
    console.log('默认参数测试成功:');
    console.log(`- 状态码: ${defaultResponse.status}`);
    console.log(`- 返回笔记数量: ${defaultResponse.data.data.length}`);
    console.log('-----------------------------');
    
    // 测试传自定义limit参数的情况
    const customLimitResponse = await axios.get('http://localhost:3000/api/user/hot-notes?limit=3');
    console.log('自定义limit参数测试成功:');
    console.log(`- 状态码: ${customLimitResponse.status}`);
    console.log(`- 返回笔记数量: ${customLimitResponse.data.data.length}`);
    console.log('-----------------------------');
    
    // 打印第一条笔记的信息
    if (defaultResponse.data.data && defaultResponse.data.data.length > 0) {
      const firstNote = defaultResponse.data.data[0];
      console.log('第一条笔记信息:');
      console.log(`- ID: ${firstNote.id}`);
      console.log(`- 标题: ${firstNote.title}`);
      console.log(`- 浏览量: ${firstNote.view_count}`);
      console.log(`- 分类: ${firstNote.category_name || '未分类'}`);
    }
    
    console.log('\n测试完成! /user/hot-notes 接口正常工作。');
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error(`- 状态码: ${error.response.status}`);
      console.error(`- 错误信息: ${error.response.data.message || error.response.data.msg}`);
    }
  } finally {
    process.exit(0);
  }
}

testHotNotesAPI();