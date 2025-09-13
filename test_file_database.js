const mysql = require('mysql2/promise');

// 测试文件ID (从错误信息中获取)
const fileId = 'b0e138ff-5065-4e85-85bc-75329abc7df7';

// 数据库连接配置 - 从.env文件中获取的实际配置
const dbConfig = {
    host: 'yyk0402.top',
    port: 13306,
    user: 'root',
    password: 'mysql_D22HhF',
    database: 'personal_notes'
};

// 测试文件是否存在于数据库
async function checkFileInDatabase() {
    let connection;
    try {
        console.log(`检查文件ID ${fileId} 是否存在于数据库中...`);
        
        // 创建数据库连接
        connection = await mysql.createConnection(dbConfig);
        console.log('数据库连接成功');
        
        // 查询文件信息
        const [rows] = await connection.execute(
            'SELECT file_id, file_name, file_type, storage_path, created_at FROM files WHERE file_id = ?',
            [fileId]
        );
        
        if (rows.length > 0) {
            console.log('找到文件记录:');
            console.log(rows[0]);
            
            // 检查存储路径是否存在
            const fs = require('fs');
            const filePath = rows[0].storage_path;
            if (fs.existsSync(filePath)) {
                console.log(`文件实际存在于存储路径: ${filePath}`);
                console.log(`文件大小: ${fs.statSync(filePath).size} 字节`);
            } else {
                console.error(`文件记录存在于数据库，但实际文件不存在于: ${filePath}`);
            }
        } else {
            console.error(`未在数据库中找到文件ID为 ${fileId} 的记录`);
            
            // 查询最近添加的文件记录，确认数据库连接正常
            const [recentRows] = await connection.execute(
                'SELECT file_id, file_name, created_at FROM files ORDER BY created_at DESC LIMIT 5'
            );
            
            if (recentRows.length > 0) {
                console.log('\n数据库中最近的5条文件记录:');
                recentRows.forEach((row, index) => {
                    console.log(`${index + 1}. ${row.file_id} - ${row.file_name} (${row.created_at})`);
                });
            } else {
                console.log('数据库中没有文件记录');
            }
        }
        
    } catch (error) {
        console.error('数据库操作失败:', error.message);
        console.log('请检查数据库连接配置是否正确');
    } finally {
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

// 运行测试
checkFileInDatabase().catch(console.error);