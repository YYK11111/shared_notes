const axios = require('axios');

// 测试轮播图接口
async function testCarouselsAPI() {
  try {
    console.log('开始测试 /api/carousels 接口...');
    
    // 测试获取所有轮播图
    const allCarouselsResponse = await axios.get('http://localhost:3000/api/public/carousels');
    console.log('获取所有轮播图测试成功:');
    console.log(`- 状态码: ${allCarouselsResponse.status}`);
    console.log(`- 返回轮播图数量: ${allCarouselsResponse.data.data.length}`);
    console.log('-----------------------------');
    
    // 打印轮播图详情
    if (allCarouselsResponse.data.data && allCarouselsResponse.data.data.length > 0) {
      console.log('轮播图详情:');
      allCarouselsResponse.data.data.forEach((carousel, index) => {
        console.log(`轮播图 ${index + 1}:`);
        console.log(`- ID: ${carousel.id}`);
        console.log(`- 名称: ${carousel.name}`);
        console.log(`- 标题: ${carousel.title || '无标题'}`);
        console.log(`- 状态: ${carousel.status}`);
        console.log(`- 开始时间: ${carousel.start_time}`);
        console.log(`- 结束时间: ${carousel.end_time}`);
        console.log(`- 排序: ${carousel.sort}`);
        console.log(`- 链接: ${carousel.link_url || '无链接'}`);
        console.log(`- 位置: ${carousel.position || '默认位置'}`);
        console.log('-----------------------------');
      });
    }
    
    // 测试一个不存在的位置
    const specificPositionResponse = await axios.get('http://localhost:3000/api/public/carousels?position=homepage');
    console.log('按位置筛选测试:');
    console.log(`- 状态码: ${specificPositionResponse.status}`);
    console.log(`- 位置为 homepage 的轮播图数量: ${specificPositionResponse.data.data.length}`);
    
    console.log('\n测试完成! /carousels 接口正常工作。');
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

testCarouselsAPI();