// 简单测试服务器，用于验证修改后的代码是否正确
const express = require('express');
const { successResponse, errorResponse } = require('./backend/src/utils/responseFormatter');
const app = express();
const PORT = 3001; // 使用不同端口

// 模拟轮播图数据
const mockCarousels = [
  { file_id: '1.jpg' },
  { file_id: '2.jpg' },
  { file_id: '3.jpg' }
];

// 模拟轮播图接口
app.get('/api/carousels', async (req, res) => {
  try {
    // 这里使用模拟数据代替实际数据库查询
    console.log('轮播图接口被调用，返回模拟数据');
    return res.json(successResponse(mockCarousels, '获取轮播图成功'));
  } catch (error) {
    console.error('获取轮播图失败:', error);
    return res.json(errorResponse('系统暂时无法访问，请稍后重试'));
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '测试服务器运行中' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`测试服务器启动在 http://localhost:${PORT}`);
  console.log('请访问 http://localhost:3001/api/carousels 测试轮播图接口');
});