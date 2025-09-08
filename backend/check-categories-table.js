// 引入mysql模块
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '14.103.155.246',
  port: 13306,
  user: 'personal_notes',
  password: 'PREzE7YBpmyKfQhP',
  database: 'personal_notes'
};

// 查询函数
async function checkCategoriesTable() {
  let connection;
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 检查categories表是否存在
    const [tableExists] = await connection.execute(
      "SHOW TABLES LIKE 'categories'"
    );
    
    if (tableExists.length === 0) {
      console.log('categories表不存在');
      return;
    }
    
    console.log('categories表存在');
    
    // 查询categories表的数据量
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM categories'
    );
    
    console.log(`categories表当前数据量: ${countResult[0].total}`);
    
    // 显示所有分类数据
    const [categoriesData] = await connection.execute(
      'SELECT * FROM categories'
    );
    
    if (categoriesData.length > 0) {
      console.log('所有分类数据:');
      categoriesData.forEach(cat => {
        console.log(`- 分类ID: ${cat.id}, 分类名称: ${cat.name}, 排序: ${cat.sort_order || '无'}, 创建时间: ${cat.created_at}`);
      });
    }
    
    // 检查ID为12的分类是否存在
    const targetCategoryId = 12;
    const [specificCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [targetCategoryId]
    );
    
    if (specificCategory.length === 0) {
      console.log(`\n错误：ID为${targetCategoryId}的分类不存在`);
    } else {
      console.log(`\nID为${targetCategoryId}的分类详情:`);
      console.log(`- ID: ${specificCategory[0].id}`);
      console.log(`- 名称: ${specificCategory[0].name}`);
      console.log(`- 父分类ID: ${specificCategory[0].parent_id}`);
      console.log(`- 状态: ${specificCategory[0].status === 1 ? '启用' : '禁用'}`);
      console.log(`- 创建时间: ${specificCategory[0].created_at}`);
      
      // 检查该分类是否有子分类
      const [subCategories] = await connection.execute(
        'SELECT * FROM categories WHERE parent_id = ?',
        [targetCategoryId]
      );
      
      console.log(`\nID为${targetCategoryId}的分类的子分类数量: ${subCategories.length}`);
      if (subCategories.length > 0) {
        console.log('子分类列表:');
        subCategories.forEach(subCat => {
          console.log(`- ID: ${subCat.id}, 名称: ${subCat.name}, 状态: ${subCat.status === 1 ? '启用' : '禁用'}`);
        });
      } else {
        console.log('该分类没有子分类');
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行检查
checkCategoriesTable();