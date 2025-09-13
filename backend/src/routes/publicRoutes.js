const express = require('express');
const router = express.Router();
const { query } = require('../database/dbConfig');
const { logUser } = require('../utils/logger');
const { formatDateTime, getRelativeTime } = require('../utils/dateTime');
const { sanitizeXSS } = require('../utils/security');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const searchService = require('../services/searchService');

// 以下接口已在userRoutes.js中实现，此处保留路由定义以确保兼容性
// 1. GET /home - 获取首页数据
// 2. GET /categories - 获取分类列表
// 3. GET /categories/:categoryId/notes - 获取分类下的笔记列表
// 4. GET /notes/:id - 获取笔记详情

// 搜索笔记接口
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10, sortBy = 'relevance', categoryIds, timeRange } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.json(errorResponse('搜索关键词不能为空', 400));
    }

    const cleanKeyword = sanitizeXSS(keyword.trim());

    // 使用搜索服务执行搜索
    const searchResult = await searchService.search({
      keyword: cleanKeyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy,
      categoryIds,
      timeRange,
      useIndex: true // 使用搜索索引
    });

    // 记录用户活动
    await logUser(null, `search_notes_${cleanKeyword}`, { ip: req.ip, userAgent: req.headers['user-agent'] });

    return res.json(successResponse(searchResult));
  } catch (error) {
    console.error('搜索笔记失败:', error);
    return res.json(errorResponse('系统暂时无法访问，请稍后重试'));
  }
});

// 获取热门搜索词
router.get('/search/hot', async (req, res) => {
  try {
    const { timeRange = '7d', limit = 20 } = req.query;
    
    // 根据时间范围计算开始日期
    let startDate = new Date();
    const days = parseInt(timeRange);
    startDate.setDate(startDate.getDate() - days);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    // 获取热门搜索词
    const [trendingKeywords] = await query(
      `
        SELECT 
          keyword, 
          COUNT(*) as search_count, 
          MAX(last_search_time) as last_searched 
        FROM search_logs 
        WHERE last_search_time >= ? 
        GROUP BY keyword 
        ORDER BY search_count DESC 
        LIMIT ?
      `,
      [formattedStartDate, parseInt(limit)]
    );
    
    return res.json(successResponse(trendingKeywords, '获取热门搜索词成功'));
    
  } catch (error) {
    console.error('获取热门搜索词失败:', error);
    return res.status(500).json(errorResponse('获取热门搜索词失败，请稍后重试', 500));
  }
});

// 提交用户反馈
router.post('/feedback', async (req, res) => {
  try {
    const { type, content, contact } = req.body;

    if (!type || !content) {
      return res.json(errorResponse('反馈类型和内容不能为空', 400));
    }

    const cleanContent = cleanXSS(content.trim());
    const cleanContact = contact ? cleanXSS(contact.trim()) : null;

    // 插入反馈记录
    const [result] = await query(
      'INSERT INTO feedback (type, content, contact, status) VALUES (?, ?, ?, ?)',
      [type, cleanContent, cleanContact, '待处理']
    );

    // 记录用户活动
    await logUser(null, 'submit_feedback', { type, feedbackId: result.insertId, ip: req.ip, userAgent: req.headers['user-agent'] });

    return res.json(successResponse({ id: result.insertId }, '反馈提交成功，感谢您的建议！'));
  } catch (error) {
    console.error('提交反馈失败:', error);
    return res.json(errorResponse('提交反馈失败'));
  }
});

// 获取轮播图列表
router.get('/carousels', async (req, res) => {
  try {
    const { position } = req.query;
    
    // 构建查询条件
    let querySql = 'SELECT file_id FROM carousels WHERE status = 1 AND NOW() BETWEEN start_time AND end_time';
    const queryParams = [];
    
    // 如果指定了位置，添加位置筛选条件
    if (position) {
      querySql += ' AND position = ?';
      queryParams.push(position);
    }
    
    // 添加排序条件
    querySql += ' ORDER BY sort ASC';
    
    // 执行查询
    const [carousels] = await query(querySql, queryParams);
    
    return res.json(successResponse(carousels, '获取轮播图成功'));
  } catch (error) {
    console.error('获取轮播图失败:', error);
    return res.json(errorResponse('系统暂时无法访问，请稍后重试'));
  }
});

// 获取系统配置
router.get('/config', async (req, res) => {
  try {
    const [configs] = await query('SELECT config_key, config_value FROM system_configs');
    
    const configMap = {};
    configs.forEach(config => {
      configMap[config.config_key] = config.config_value;
    });
    
    return res.json(successResponse(configMap));
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return res.json(errorResponse('获取系统配置失败'));
  }
});

module.exports = router;