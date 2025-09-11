const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logUser } = require('../utils/logger');
const { formatDateTime, getRelativeTime } = require('../utils/dateTime');
const { cleanXSS } = require('../utils/security');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const searchService = require('../services/searchService');

// 获取首页数据
router.get('/home', async (req, res) => {
  try {
    const [recommendNotes] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 AND n.is_home_recommend = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.created_at DESC 
      LIMIT 10
    `);

    const [weeklySelection] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 AND n.is_week_selection = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.created_at DESC 
      LIMIT 8
    `);

    const [latestNotes] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.created_at DESC 
      LIMIT 10
    `);

    const [hotNotes] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.view_count DESC 
      LIMIT 10
    `);

    const [monthRecommend] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 AND n.is_month_recommend = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.created_at DESC 
      LIMIT 12
    `);

    // 记录用户活动
    await logUser(null, 'view_home', { ip: req.ip, userAgent: req.headers['user-agent'] });

    return successResponse(res, {
      recommendedNotes,
      weeklySelection,
      latestNotes,
      hotNotes,
      monthRecommend
    });
  } catch (error) {
    console.error('获取首页数据失败:', error);
    return errorResponse(res, '获取首页数据失败');
  }
});

// 获取分类列表（前台显示）
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT * FROM categories WHERE status = 1 ORDER BY priority ASC, id ASC
    `);

    // 构建分类树
    const buildCategoryTree = (categories, parentId = 0) => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildCategoryTree(categories, cat.id)
        }));
    };

    const categoryTree = buildCategoryTree(categories);
    
    // 记录用户活动
    await logUser(null, 'view_categories', { ip: req.ip, userAgent: req.headers['user-agent'] });

    return successResponse(res, categoryTree);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return errorResponse(res, '获取分类列表失败');
  }
});

// 获取分类下的笔记列表
router.get('/categories/:categoryId/notes', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // 验证分类ID
    const [category] = await pool.execute('SELECT * FROM categories WHERE id = ? AND status = 1', [categoryId]);
    if (category.length === 0) {
      return errorResponse(res, '分类不存在或已禁用', 404);
    }

    const [notes] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 AND nc.category_id = ? 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at 
      ORDER BY n.is_top DESC, n.created_at DESC 
      LIMIT ?, ?
    `, [categoryId, offset, pageSize]);

    const [[countResult]] = await pool.execute(`
      SELECT COUNT(*) as total FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      WHERE n.status = 1 AND nc.category_id = ?
    `, [categoryId]);

    // 记录用户活动
    await logUser(null, `view_category_notes_${categoryId}`, { ip: req.ip, userAgent: req.headers['user-agent'] });

    return successResponse(res, {
      list: notes,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取分类笔记失败:', error);
    return errorResponse(res, '获取分类笔记失败');
  }
});

// 获取笔记详情
router.get('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 查询笔记详情
    const [notes] = await pool.execute(`
      SELECT n.*, GROUP_CONCAT(c.name) as categories 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.id = ? AND n.status = 1 
      GROUP BY n.id, n.title, n.content, n.status, n.view_count, n.like_count, n.comment_count, n.is_top, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.cover_image, n.created_at, n.updated_at
    `, [id]);

    if (notes.length === 0) {
      return errorResponse(res, '笔记不存在或已禁用', 404);
    }

    const note = notes[0];

    // 更新浏览量
    await pool.execute('UPDATE notes SET view_count = view_count + 1 WHERE id = ?', [id]);

    // 获取相关笔记
    const [relatedNotes] = await pool.execute(`
      SELECT n.* 
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      WHERE n.id != ? AND n.status = 1 
      AND nc.category_id IN (SELECT category_id FROM note_categories WHERE note_id = ?) 
      ORDER BY n.view_count DESC 
      LIMIT 5
    `, [id, id]);

    // 记录用户活动
    await logUser(null, `view_note_${id}`, { ip: req.ip, userAgent: req.headers['user-agent'] });

    return successResponse(res, {
      ...note,
      relatedNotes
    });
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    return errorResponse(res, '获取笔记详情失败');
  }
});

// 搜索笔记接口
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10, sortBy = 'relevance', categoryIds, timeRange } = req.query;

    if (!keyword || keyword.trim() === '') {
      return errorResponse(res, '搜索关键词不能为空', 400);
    }

    const cleanKeyword = cleanXSS(keyword.trim());

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

    return successResponse(res, searchResult);
  } catch (error) {
    console.error('搜索笔记失败:', error);
    return errorResponse(res, '系统暂时无法访问，请稍后重试');
  }
});

// 获取热门搜索词
router.get('/search/hot', async (req, res) => {
  try {
    const [hotKeywords] = await pool.execute(
      'SELECT keyword, search_count FROM search_logs ORDER BY search_count DESC LIMIT 10'
    );

    return successResponse(res, hotKeywords);
  } catch (error) {
    console.error('获取热门搜索词失败:', error);
    return errorResponse(res, '获取热门搜索词失败');
  }
});

// 提交用户反馈
router.post('/feedback', async (req, res) => {
  try {
    const { type, content, contact } = req.body;

    if (!type || !content) {
      return errorResponse(res, '反馈类型和内容不能为空', 400);
    }

    const cleanContent = cleanXSS(content.trim());
    const cleanContact = contact ? cleanXSS(contact.trim()) : null;

    // 插入反馈记录
    const [result] = await pool.execute(
      'INSERT INTO feedback (type, content, contact, status) VALUES (?, ?, ?, ?)',
      [type, cleanContent, cleanContact, '待处理']
    );

    // 记录用户活动
    await logUser(null, 'submit_feedback', { type, feedbackId: result.insertId, ip: req.ip, userAgent: req.headers['user-agent'] });

    return successResponse(res, { id: result.insertId }, '反馈提交成功，感谢您的建议！');
  } catch (error) {
    console.error('提交反馈失败:', error);
    return errorResponse(res, '提交反馈失败');
  }
});

// 获取系统配置
router.get('/config', async (req, res) => {
  try {
    const [configs] = await pool.execute('SELECT config_key, config_value FROM system_configs');
    
    const configMap = {};
    configs.forEach(config => {
      configMap[config.config_key] = config.config_value;
    });
    
    return successResponse(res, configMap);
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return errorResponse(res, '获取系统配置失败');
  }
});

module.exports = router;