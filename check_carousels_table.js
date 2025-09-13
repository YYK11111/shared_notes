const { query } = require('./backend/src/database/dbConfig');

// 查询carousels表的结构
async function checkCarouselsTableStructure() {
  try {
    console.log('查询carousels表结构...');
    
    // 查询表结构
    const [columns] = await query('DESCRIBE carousels');
    
    console.log('carousels表结构:');
    columns.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}, ${column.Null === 'YES' ? '可空' : '非空'})`);
    });
    
    // 查询一些数据示例
    console.log('\n查询轮播图数据示例:');
    const [carouselData] = await query('SELECT * FROM carousels LIMIT 3');
    console.log(`找到 ${carouselData.length} 条轮播图数据`);
    if (carouselData.length > 0) {
      console.log('轮播图数据示例:');
      carouselData.forEach((carousel, index) => {
        console.log(`轮播图 ${index + 1}:`);
        console.log(`- ID: ${carousel.id}`);
        console.log(`- 标题: ${carousel.title || '无标题'}`);
        console.log(`- 状态: ${carousel.status}`);
        console.log(`- 开始时间: ${carousel.start_time || '无'}`);
        console.log(`- 结束时间: ${carousel.end_time || '无'}`);
        console.log(`- 排序: ${carousel.sort || '默认'}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkCarouselsTableStructure();