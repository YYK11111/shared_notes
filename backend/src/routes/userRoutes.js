const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');

// 获取首页数据
router.get('/home', async (req, res) => {
  try {
    const [systemConfigs] = await pool.execute('SELECT * FROM system_configs');
    const configMap = {};
    systemConfigs.forEach(config => {
      configMap[config.key] = config.value;
    });

    // 获取热门笔记
    const [hotNotes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1 AND n.is_hot = 1 ORDER BY n.views DESC LIMIT 10'
    );

    // 获取本周精选
    const [weeklyNotes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1 AND n.is_weekly_pick = 1 ORDER BY n.updated_at DESC LIMIT 15'
    );

    // 获取月度推荐
    const [monthlyNotes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1 AND n.is_monthly_recommend = 1 ORDER BY n.updated_at DESC LIMIT 15'
    );

    // 获取高优先级分类（前8个）
    const [topCategories] = await pool.execute(
      'SELECT c.*, COUNT(n.id) as note_count FROM categories c LEFT JOIN notes n ON c.id = n.category_id AND n.status = 1 WHERE c.status = 1 GROUP BY c.id ORDER BY c.priority ASC LIMIT 8'
    );

    return res.json(formatSuccess({
      systemConfigs: configMap,
      hotNotes,
      weeklyNotes,
      monthlyNotes,
      topCategories
    }, '获取首页数据成功'));

  } catch (error) {
    console.error('获取首页数据失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取分类列表（前台使用）
router.get('/categories', async (req, res) => {
  try {
    // 获取所有启用的分类
    const [categories] = await pool.execute(
      'SELECT c.*, COUNT(n.id) as note_count FROM categories c LEFT JOIN notes n ON c.id = n.category_id AND n.status = 1 WHERE c.status = 1 GROUP BY c.id ORDER BY c.sort_order ASC'
    );

    // 构建树形结构
    const categoryMap = {};
    const tree = [];

    // 先创建一个id到分类的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // 构建树
    categories.forEach(category => {
      if (category.parent_id === 0) {
        tree.push(categoryMap[category.id]);
      } else if (categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(categoryMap[category.id]);
      }
    });

    return res.json(formatSuccess(tree, '获取分类列表成功'));

  } catch (error) {
    console.error('获取分类列表失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取分类下的笔记列表
router.get('/categories/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, sortBy = 'newest' } = req.query;
    const offset = (page - 1) * pageSize;

    // 检查分类是否存在且已启用
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ? AND status = 1', [id]);

    if (categories.length === 0) {
      return res.status(404).json(formatError('该分类不存在或已被禁用', 404));
    }

    // 确定排序方式
    let orderBy = 'n.created_at DESC';
    if (sortBy === 'mostViewed') {
      orderBy = 'n.views DESC';
    }

    // 获取分类下的笔记
    const [notes] = await pool.execute(
      `SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1 AND n.category_id = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [id, parseInt(pageSize), parseInt(offset)]
    );

    // 获取总条数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notes WHERE status = 1 AND category_id = ?',
      [id]
    );
    const total = countResult[0].total;

    return res.json(formatSuccess({
      list: notes,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize),
      category: categories[0]
    }, '获取分类下的笔记列表成功'));

  } catch (error) {
    console.error('获取分类下的笔记列表失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取笔记详情
router.get('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取笔记详情
    const [notes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.id = ?',
      [id]
    );

    if (notes.length === 0) {
      return res.status(404).json(formatError('该笔记不存在', 404));
    }

    const note = notes[0];

    // 检查笔记状态
    if (note.status !== 1) {
      return res.status(404).json(formatError('该笔记已下架，无法查看', 404));
    }

    // 检查置顶状态（如果有过期时间）
    if (note.is_top && note.top_expire_time && new Date(note.top_expire_time) < new Date()) {
      note.is_top = 0;
    }

    // 更新阅读量
    await pool.execute('UPDATE notes SET views = views + 1 WHERE id = ?', [id]);
    note.views += 1;

    // 获取上一篇和下一篇
    const [prevNext] = await pool.execute(
      'SELECT id, title FROM notes WHERE status = 1 AND category_id = ? AND id < ? ORDER BY id DESC LIMIT 1',
      [note.category_id, id]
    );
    note.prevNote = prevNext.length > 0 ? prevNext[0] : null;

    const [nextPrev] = await pool.execute(
      'SELECT id, title FROM notes WHERE status = 1 AND category_id = ? AND id > ? ORDER BY id ASC LIMIT 1',
      [note.category_id, id]
    );
    note.nextNote = nextPrev.length > 0 ? nextPrev[0] : null;

    return res.json(formatSuccess(note, '获取笔记详情成功'));

  } catch (error) {
    console.error('获取笔记详情失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 搜索笔记
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10, sortBy = 'relevance', categoryIds, timeRange } = req.query;
    const offset = (page - 1) * pageSize;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json(formatError('搜索关键词不能为空', 400));
    }

    // 检查敏感词
    const [sensitiveWords] = await pool.execute(
      'SELECT value FROM system_configs WHERE key = ?',
      ['sensitive_words']
    );

    if (sensitiveWords.length > 0 && sensitiveWords[0].value) {
      const sensitiveArray = sensitiveWords[0].value.split(',');
      const hasSensitiveWord = sensitiveArray.some(word => 
        keyword.toLowerCase().includes(word.toLowerCase())
      );

      if (hasSensitiveWord) {
        return res.json(formatSuccess({
          list: [],
          total: 0,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: 0
        }, '未找到相关内容'));
      }
    }

    // 记录搜索日志
    try {
      await pool.execute(
        'INSERT INTO search_logs (keyword, search_time) VALUES (?, NOW())',
        [keyword]
      );
    } catch (logError) {
      console.error('记录搜索日志失败:', logError);
    }

    // 构建搜索查询
    let query = 'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1';
    const whereClause = [];
    const params = [];

    // 添加关键词搜索
    whereClause.push('(n.title LIKE ? OR n.content LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);

    // 添加分类筛选
    if (categoryIds) {
      const ids = categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereClause.push('n.category_id IN (?)');
        params.push(ids);
      }
    }

    // 添加时间范围筛选
    if (timeRange === '30days') {
      whereClause.push('n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    } else if (timeRange === '90days') {
      whereClause.push('n.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)');
    }

    if (whereClause.length > 0) {
      query += ' AND ' + whereClause.join(' AND ');
    }

    // 确定排序方式
    let orderBy = 'CASE WHEN n.title LIKE ? THEN 1 ELSE 2 END, n.created_at DESC';
    params.push(`%${keyword}%`); // 用于标题权重

    if (sortBy === 'newest') {
      orderBy = 'n.created_at DESC';
    } else if (sortBy === 'mostViewed') {
      orderBy = 'n.views DESC';
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), parseInt(offset));

    const [notes] = await pool.execute(query, params);

    // 高亮匹配的关键词
    const highlightedNotes = notes.map(note => {
      if (note.title.includes(keyword)) {
        note.highlightedTitle = note.title.replace(
          new RegExp(keyword, 'gi'),
          match => `<mark>${match}</mark>`
        );
      } else {
        note.highlightedTitle = note.title;
      }

      // 生成摘要
      if (note.content) {
        const plainContent = note.content.replace(/<[^>]*>/g, '');
        const keywordIndex = plainContent.toLowerCase().indexOf(keyword.toLowerCase());
        let summary = plainContent.slice(0, 100);

        if (keywordIndex >= 0) {
          const start = Math.max(0, keywordIndex - 30);
          const end = Math.min(plainContent.length, keywordIndex + 70);
          summary = (start > 0 ? '...' : '') + 
                    plainContent.slice(start, end).replace(
                      new RegExp(keyword, 'gi'),
                      match => `<mark>${match}</mark>`
                    ) + 
                    (end < plainContent.length ? '...' : '');
        }
        note.summary = summary;
      }

      return note;
    });

    // 获取总条数
    let countQuery = 'SELECT COUNT(*) as total FROM notes n WHERE n.status = 1';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数

    if (whereClause.length > 0) {
      countQuery += ' AND ' + whereClause.join(' AND ');
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // 如果没有搜索结果，推荐热门笔记
    let recommendedNotes = [];
    if (total === 0) {
      const [hotNotes] = await pool.execute(
        'SELECT n.id, n.title, n.cover_image, n.views, n.created_at, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.status = 1 ORDER BY n.views DESC LIMIT 5'
      );
      recommendedNotes = hotNotes;
    }

    return res.json(formatSuccess({
      list: highlightedNotes,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize),
      recommendedNotes
    }, `搜索"${keyword}"找到 ${total} 条结果`));

  } catch (error) {
    console.error('搜索笔记失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取热门搜索词
router.get('/hot-searches', async (req, res) => {
  try {
    const [hotSearches] = await pool.execute(
      'SELECT keyword, COUNT(*) as count FROM search_logs WHERE search_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY keyword ORDER BY count DESC LIMIT 10'
    );

    return res.json(formatSuccess(hotSearches, '获取热门搜索词成功'));

  } catch (error) {
    console.error('获取热门搜索词失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 提交用户反馈
router.post('/feedback', async (req, res) => {
  try {
    const { type, content, contact } = req.body;

    // 检查参数
    if (!type || !content) {
      return res.json(formatError('反馈类型和内容不能为空', 400));
    }

    if (content.length > 500) {
      return res.json(formatError('反馈内容不能超过500字', 400));
    }

    // 创建反馈
    const [result] = await pool.execute(
      'INSERT INTO feedback (type, content, contact, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [type, content, contact || null, 0] // 0表示待处理
    );

    return res.status(201).json(formatSuccess({ id: result.insertId }, '反馈已收到，感谢您的宝贵意见！'));

  } catch (error) {
    console.error('提交反馈失败:', error);
    return res.json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取系统配置
router.get('/system-configs', async (req, res) => {
  try {
    const [configs] = await pool.execute('SELECT * FROM system_configs');
    const configMap = {};

    configs.forEach(config => {
      configMap[config.key] = config.value;
    });

    return res.json(formatSuccess(configMap, '获取系统配置成功'));

  } catch (error) {
    console.error('获取系统配置失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

module.exports = router;