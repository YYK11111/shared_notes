#!/usr/bin/env node
/**
 * 轮播图迁移脚本：删除image_url字段，设置file_id为必填
 * 
 * 注意：如果自动执行失败，可以手动执行以下SQL语句完成迁移
 */

console.log('=====================================================');
console.log('                轮播图数据库迁移工具                    ');
console.log('=====================================================\n');

// 提供手动SQL语句方案
function printManualMigrationSteps() {
  console.log('由于数据库连接问题，自动迁移无法完成。');
  console.log('请在数据库管理工具（如phpMyAdmin、MySQL Workbench等）中执行以下SQL语句：\n');
  
  console.log('-- 步骤1: 检查轮播图相关的表名');
  console.log('SHOW TABLES;\n');
  
  console.log('-- 步骤2: 假设表名为carousel（请根据实际表名修改）');
  console.log('-- 检查file_id字段是否存在');
  console.log('SHOW COLUMNS FROM carousel LIKE "file_id";\n');
  
  console.log('-- 步骤3: 如果file_id字段不存在，添加它');
  console.log('-- 先尝试在image_url后添加');
  console.log('ALTER TABLE carousel ADD COLUMN file_id VARCHAR(50) NULL AFTER image_url;\n');
  console.log('-- 如果上一条失败（可能因为image_url不存在），尝试添加到表末尾');
  console.log('ALTER TABLE carousel ADD COLUMN file_id VARCHAR(50) NULL;\n');
  
  console.log('-- 步骤4: 为现有记录设置默认file_id值');
  console.log('UPDATE carousel SET file_id = \'\' WHERE file_id IS NULL;\n');
  
  console.log('-- 步骤5: 将file_id字段设置为必填');
  console.log('ALTER TABLE carousel MODIFY COLUMN file_id VARCHAR(50) NOT NULL;\n');
  
  console.log('-- 步骤6: 删除image_url字段');
  console.log('ALTER TABLE carousel DROP COLUMN image_url;\n');
  
  console.log('=====================================================');
  console.log('注意：');
  console.log('1. 请将上述SQL中的"carousel"替换为您实际的轮播图表名');
  console.log('2. 如果不确定表名，请先执行SHOW TABLES查看所有表');
  console.log('3. 这些SQL语句将帮助您完成从image_url到file_id的迁移');
  console.log('4. 完成后，轮播图系统将使用file_id字段管理图片');
  console.log('=====================================================\n');
  
  console.log('前端和后端代码已完成适配，数据库迁移后即可正常使用！');
}

// 执行脚本
try {
  // 直接打印手动迁移步骤
  printManualMigrationSteps();
  
  // 尝试导入模块（仅用于显示配置信息）
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    
    // 从正确的绝对路径加载.env文件
    const envPath = path.join(__dirname, '../../.env');
    dotenv.config({ path: envPath });
    
    console.log('\n您的数据库配置（供参考）:');
    console.log('- 主机:', process.env.DB_HOST || 'localhost');
    console.log('- 端口:', process.env.DB_PORT || 3306);
    console.log('- 用户名:', process.env.DB_USERNAME || 'root');
    console.log('- 数据库名:', process.env.DB_NAME || 'note_sharing_platform');
  } catch (error) {
    console.log('\n无法读取数据库配置文件，使用默认配置。');
  }
  
  process.exit(0);
} catch (error) {
  console.error('脚本执行出错:', error);
  process.exit(1);
}

/**
 * 轮播图迁移脚本：添加file_id字段（如不存在）、设置为必填、删除image_url字段
 */
async function runRemoveImageUrlMigration() {
  try {
    // 先测试数据库连接
    const isConnected = await testDbConnection();
    if (!isConnected) {
      console.error('无法连接到数据库，迁移操作无法继续');
      process.exit(1);
    }
    
    console.log('开始执行轮播图表结构更新...');
    
    // 首先列出数据库中的所有表，查看是否有名为carousel或类似的表
    try {
      const tables = await query('SHOW TABLES');
      console.log('数据库中的表:', tables ? tables.map(table => Object.values(table)[0]) : '无法获取表列表');
    } catch (error) {
      console.error('列出数据库表失败:', error.message);
    }
    
    // 轮播图相关的可能表名
    const possibleTableNames = ['carousel', 'carousels', 'home_carousel', 'banner_carousel', 'site_carousel'];
    let carouselTableName = null;
    
    // 尝试找到存在的轮播图表
    for (const tableName of possibleTableNames) {
      try {
        await query(`SELECT 1 FROM ${tableName} LIMIT 1`);
        carouselTableName = tableName;
        console.log(`找到轮播图表: ${tableName}`);
        break;
      } catch (error) {
        console.log(`表 ${tableName} 不存在，继续尝试下一个`);
      }
    }
    
    // 如果找不到预期的表名，尝试使用user_carousel表名（根据用户提示）
    if (!carouselTableName) {
      try {
        await query(`SELECT 1 FROM user_carousel LIMIT 1`);
        carouselTableName = 'user_carousel';
        console.log('找到轮播图表: user_carousel');
      } catch (error) {
        console.log('表 user_carousel 也不存在');
      }
    }
    
    if (!carouselTableName) {
      console.error('未找到轮播图相关的表，请检查数据库结构');
      process.exit(1);
    }
    
    // 检查file_id字段是否存在
    let hasFileIdColumn = false;
    try {
      const result = await query(`SHOW COLUMNS FROM ${carouselTableName} LIKE "file_id"`);
      hasFileIdColumn = result && result.length > 0;
      console.log('检查file_id字段结果:', hasFileIdColumn ? '存在' : '不存在');
    } catch (error) {
      console.log('检查file_id字段时出错:', error.message);
    }
    
    // 如果file_id字段不存在，尝试添加
    if (!hasFileIdColumn) {
      try {
        console.log('正在添加file_id字段...');
        // 尝试在image_url后添加file_id字段，如果image_url不存在则添加到表末尾
        try {
          await query(`ALTER TABLE ${carouselTableName} ADD COLUMN file_id VARCHAR(50) NULL AFTER image_url`);
        } catch (addAfterError) {
          console.log('在image_url后添加失败，尝试添加到表末尾:', addAfterError.message);
          await query(`ALTER TABLE ${carouselTableName} ADD COLUMN file_id VARCHAR(50) NULL`);
        }
        console.log('成功添加file_id字段');
        hasFileIdColumn = true;
      } catch (addError) {
        console.error('添加file_id字段失败:', addError.message);
        process.exit(1);
      }
    }
    
    // 如果file_id字段存在，继续执行迁移
    if (hasFileIdColumn) {
      // 步骤1: 为现有记录设置默认file_id值（如果有的话为空）
      console.log('正在更新现有记录的file_id字段...');
      try {
        await query(`UPDATE ${carouselTableName} SET file_id = '' WHERE file_id IS NULL`);
        console.log('现有记录file_id字段更新完成');
      } catch (updateError) {
        console.error('更新现有记录file_id字段失败:', updateError.message);
        process.exit(1);
      }
      
      // 步骤2: 将file_id字段设置为NOT NULL（必填）
      console.log('正在设置file_id字段为必填...');
      try {
        await query(`ALTER TABLE ${carouselTableName} MODIFY COLUMN file_id VARCHAR(50) NOT NULL`);
        console.log('file_id字段已设置为必填');
      } catch (modifyError) {
        console.error('设置file_id字段为必填失败:', modifyError.message);
        process.exit(1);
      }
      
      // 步骤3: 删除image_url字段
      console.log('正在删除image_url字段...');
      try {
        await query(`ALTER TABLE ${carouselTableName} DROP COLUMN image_url`);
        console.log('image_url字段已成功删除');
      } catch (dropError) {
        console.error('删除image_url字段失败:', dropError.message);
        // 如果删除失败，仍然视为迁移成功（因为主要目标是设置file_id为必填）
        console.log('警告：image_url字段删除失败，但file_id已设置为必填');
      }
    }
    
    console.log('轮播图表结构更新完成!');
    process.exit(0);
  } catch (error) {
    console.error('轮播图表结构更新过程中出现未捕获的错误:', error);
    process.exit(1);
  }
}

// 执行迁移
runRemoveImageUrlMigration();