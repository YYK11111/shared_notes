const axios = require('axios');

// 测试文件ID (从错误信息中获取)
const fileId = 'b0e138ff-5065-4e85-85bc-75329abc7df7';

// 测试1：直接调用API检查文件是否存在
async function testFileAPI() {
    try {
        console.log(`测试文件API - 文件ID: ${fileId}`);
        const response = await axios.get(`http://localhost:3000/api/file/get/${fileId}`, {
            responseType: 'blob'
        });
        console.log('文件API请求成功!');
        console.log('响应状态:', response.status);
        console.log('响应头:', response.headers);
    } catch (error) {
        console.error('文件API请求失败:');
        console.error('错误信息:', error.message);
        console.error('状态码:', error.response?.status);
        console.error('错误详情:', error.response?.data ? JSON.stringify(error.response.data) : '无');
    }
}

// 测试2：检查文件元数据是否存在于数据库
async function testFileExistence() {
    try {
        console.log('\n测试文件是否存在于数据库...');
        // 这里可以添加数据库查询逻辑
        console.log('注意: 此测试需要数据库连接代码才能执行实际查询');
    } catch (error) {
        console.error('数据库查询失败:', error.message);
    }
}

// 运行测试
async function runTests() {
    await testFileAPI();
    await testFileExistence();
}

runTests();