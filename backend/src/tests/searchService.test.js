// 搜索服务测试文件
const searchService = require('../routes/searchService');
const { pool } = require('../database/db');

// 简单的测试函数
testSearchService();

async function testSearchService() {
  console.log('开始测试搜索服务...');
  
  try {
    // 1. 测试获取搜索配置
    console.log('\n1. 测试获取搜索配置:');
    const searchConfig = await searchService.getSearchConfig();
    console.log('搜索配置:', searchConfig);
    
    // 2. 测试获取索引状态
    console.log('\n2. 测试获取索引状态:');
    const indexStatus = await searchService.getIndexStatus();
    console.log('索引状态:', indexStatus);
    
    // 3. 测试生成搜索缓存键
    console.log('\n3. 测试生成搜索缓存键:');
    const cacheKey = searchService.generateSearchCacheKey('test', 1, 10, 'relevance', '1,2', '30days');
    console.log('缓存键:', cacheKey);
    
    // 4. 测试搜索功能（使用示例关键词）
    console.log('\n4. 测试搜索功能:');
    const searchResult = await searchService.search({
      keyword: '测试',
      page: 1,
      pageSize: 5,
      sortBy: 'relevance',
      useIndex: indexStatus.index_exists
    });
    console.log('搜索结果数量:', searchResult.total);
    console.log('返回的笔记数量:', searchResult.list.length);
    
    // 5. 测试获取推荐笔记
    console.log('\n5. 测试获取推荐笔记:');
    const recommendedNotes = await searchService.getRecommendedNotes(3);
    console.log('推荐笔记数量:', recommendedNotes.length);
    
    console.log('\n搜索服务测试完成！');
    
  } catch (error) {
    console.error('搜索服务测试失败:', error);
  } finally {
    // 关闭数据库连接
    if (pool) {
      pool.end();
    }
  }
}