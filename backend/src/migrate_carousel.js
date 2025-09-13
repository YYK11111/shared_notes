const { createCarouselTable, addCarouselPermission } = require('./database/carouselMigration');

async function runCarouselMigration() {
  try {
    console.log('开始执行轮播图相关数据库迁移...');
    
    // 创建轮播图表
    await createCarouselTable();
    
    // 添加轮播图管理权限
    await addCarouselPermission();
    
    console.log('轮播图相关数据库迁移执行完成!');
    process.exit(0);
  } catch (error) {
    console.error('轮播图数据库迁移执行失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runCarouselMigration();