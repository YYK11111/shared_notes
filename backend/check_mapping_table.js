const { pool } = require('./src/database/db');

async function checkMappingTable() {
  try {
    console.log('开始连接数据库...');
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功!');
    
    // 检查当前使用的数据库
    const [dbResult] = await connection.execute("SELECT DATABASE() as db_name");
    console.log(`当前使用的数据库: ${dbResult[0].db_name}`);
    
    // 检查表是否存在
    console.log('\n检查file_resource_mapping表是否存在...');
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'file_resource_mapping'"
    );
    
    if (tables.length === 0) {
      console.log('❌ file_resource_mapping表不存在!');
      
      // 列出所有表
      console.log('\n当前数据库中的所有表:');
      const [allTables] = await connection.execute("SHOW TABLES");
      console.log(allTables.map(table => Object.values(table)[0]));
    } else {
      console.log('✅ file_resource_mapping表存在!');
      
      // 查看表结构
      console.log('\n查看表结构:');
      const [columns] = await connection.execute(
        "DESCRIBE file_resource_mapping"
      );
      
      console.table(columns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key,
        Default: col.Default,
        Extra: col.Extra
      })));
      
      // 查看索引
      console.log('\n查看索引:');
      const [indexes] = await connection.execute(
        "SHOW INDEX FROM file_resource_mapping"
      );
      
      if (indexes.length > 0) {
        console.table(indexes.map(idx => ({
          Key_name: idx.Key_name,
          Column_name: idx.Column_name,
          Non_unique: idx.Non_unique
        })));
      } else {
        console.log('没有找到索引');
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('发生错误:');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误详情:', error);
  }
}

checkMappingTable().then(() => {
  process.exit(0);
});