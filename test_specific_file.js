const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置 - 使用实际配置
const dbConfig = {
  host: 'yyk0402.top',
  port: 13306,
  user: 'root',
  password: 'mysql_D22HhF',
  database: 'personal_notes'
};

// 要检查的文件ID
const targetFileId = 'b0e138ff-5065-4e85-85bc-75329abc7df7';

async function checkFileStatus() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 查询文件元数据
    const [rows] = await connection.execute(
      'SELECT file_id, file_name, file_type, storage_path, file_size, business_type FROM files WHERE file_id = ?',
      [targetFileId]
    );

    if (rows.length === 0) {
      console.log(`文件ID ${targetFileId} 在数据库中不存在`);
      return;
    }

    const fileInfo = rows[0];
    console.log('数据库中的文件信息:');
    console.log(`- file_id: ${fileInfo.file_id}`);
    console.log(`- file_name: ${fileInfo.file_name}`);
    console.log(`- file_type: ${fileInfo.file_type}`);
    console.log(`- file_size: ${fileInfo.file_size} 字节`);
    console.log(`- business_type: ${fileInfo.business_type}`);
    console.log(`- storage_path: ${fileInfo.storage_path}`);

    // 检查文件是否存在于文件系统
    const absolutePath = path.resolve(fileInfo.storage_path);
    console.log(`检查文件是否存在: ${absolutePath}`);
    
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      console.log(`文件存在，大小: ${stats.size} 字节`);
    } else {
      console.log('文件在文件系统中不存在');
      // 检查目录是否存在
      const dirPath = path.dirname(absolutePath);
      if (fs.existsSync(dirPath)) {
        console.log(`目录存在: ${dirPath}`);
        // 列出目录中的文件
        const files = fs.readdirSync(dirPath);
        console.log(`目录中的文件列表: ${files.join(', ')}`);
      } else {
        console.log(`目录不存在: ${dirPath}`);
      }
    }

  } catch (error) {
    console.error('操作失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行检查
checkFileStatus();