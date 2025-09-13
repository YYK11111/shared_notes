const { query } = require('./database/db');

async function runCarouselFileIdMigration() {
  try {
    console.log('开始执行轮播图表结构更新...');
    
    // 检查是否已经有file_id字段
    let hasFileIdColumn = false;
    try {
      const [result] = await query('SHOW COLUMNS FROM carousels LIKE "file_id"');
      hasFileIdColumn = result.length > 0;
    } catch (error) {
      console.log('检查file_id字段失败，假设不存在:', error.message);
    }
    
    if (!hasFileIdColumn) {
      // 添加file_id字段
      await query('ALTER TABLE carousels ADD COLUMN file_id VARCHAR(50) NULL AFTER image_url');
      console.log('成功添加file_id字段');
    } else {
      console.log('file_id字段已存在，跳过添加');
    }
    
    // 由于现有数据可能依赖image_url，暂时保留该字段
    // 如果未来确认可以删除，再执行：ALTER TABLE carousels DROP COLUMN image_url;
    
    console.log('轮播图表结构更新完成!');
    process.exit(0);
  } catch (error) {
    console.error('轮播图表结构更新失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runCarouselFileIdMigration();