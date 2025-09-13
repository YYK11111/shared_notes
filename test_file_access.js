const axios = require('axios');

// 要测试访问的文件ID
const fileId = 'b0e138ff-5065-4e85-85bc-75329abc7df7';
const fileUrl = `http://localhost:3000/api/file/get/${fileId}`;

console.log(`正在测试访问文件: ${fileUrl}`);

// 发送GET请求测试文件访问
availableCheckFileAccess();

async function availableCheckFileAccess() {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'stream'
    });
    
    console.log(`文件访问成功！状态码: ${response.status}`);
    console.log(`响应头 - Content-Type: ${response.headers['content-type']}`);
    console.log(`响应头 - Content-Disposition: ${response.headers['content-disposition']}`);
    console.log('文件现在应该可以正常加载了。');
    
  } catch (error) {
    if (error.response) {
      console.error(`文件访问失败: 状态码 ${error.response.status}`);
      console.error(`错误详情: ${error.message}`);
      if (error.response.data) {
        try {
          const errorData = JSON.parse(error.response.data.toString());
          console.error(`错误响应:`, errorData);
        } catch (e) {
          console.error(`无法解析错误响应: ${error.response.data.toString()}`);
        }
      }
    } else if (error.request) {
      console.error(`无响应: 服务器没有返回响应`);
    } else {
      console.error(`请求配置错误: ${error.message}`);
    }
  }
}