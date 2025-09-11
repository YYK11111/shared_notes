const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');
const searchService = require('../services/searchService');

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
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.status = 1 AND n.is_hot = 1 ORDER BY n.views DESC LIMIT 10'
    );

    // 获取本周精选
    const [weeklyNotes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.status = 1 AND n.is_weekly_pick = 1 ORDER BY n.updated_at DESC LIMIT 15'
    );

    // 获取月度推荐
    const [monthlyNotes] = await pool.execute(
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.status = 1 AND n.is_monthly_recommend = 1 ORDER BY n.updated_at DESC LIMIT 15'
    );

    // 获取高优先级分类（前8个）
    const [topCategories] = await pool.execute(
      'SELECT c.*, COUNT(nc.note_id) as note_count FROM categories c LEFT JOIN note_categories nc ON c.id = nc.category_id LEFT JOIN notes n ON nc.note_id = n.id AND n.status = 1 WHERE c.status = 1 GROUP BY c.id, c.name, c.parent_id, c.status, c.priority, c.created_at, c.updated_at ORDER BY c.priority ASC LIMIT 8'
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
      'SELECT c.*, COUNT(nc.note_id) as note_count FROM categories c LEFT JOIN note_categories nc ON c.id = nc.category_id LEFT JOIN notes n ON nc.note_id = n.id AND n.status = 1 WHERE c.status = 1 GROUP BY c.id, c.name, c.parent_id, c.status, c.priority, c.created_at, c.updated_at ORDER BY c.priority ASC, c.id ASC'
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
      `SELECT n.*, c.name as category_name FROM notes n JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.status = 1 AND nc.category_id = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [id, parseInt(pageSize), parseInt(offset)]
    );

    // 获取总条数
    const [countResult] = await pool.execute(
      'SELECT COUNT(DISTINCT n.id) as total FROM notes n JOIN note_categories nc ON n.id = nc.note_id WHERE n.status = 1 AND nc.category_id = ?',
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
      'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.id = ?',
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

    // 获取上一篇和下一篇 - 注意：由于多对多关系，这里简化处理，仅考虑状态为1的笔记
    const [prevNext] = await pool.execute(
      'SELECT id, title FROM notes WHERE status = 1 AND id < ? ORDER BY id DESC LIMIT 1',
      [id]
    );
    note.prevNote = prevNext.length > 0 ? prevNext[0] : null;

    const [nextPrev] = await pool.execute(
      'SELECT id, title FROM notes WHERE status = 1 AND id > ? ORDER BY id ASC LIMIT 1',
      [id]
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

    // 使用搜索服务执行搜索
    const searchResult = await searchService.search({
      keyword,
      page,
      pageSize,
      sortBy,
      categoryIds,
      timeRange,
      useIndex: true // 使用搜索索引
    });

    return res.json(formatSuccess(searchResult, `搜索"${keyword}"找到 ${searchResult.total} 条结果`));

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

// 获取推荐笔记
router.get('/recommend-notes', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // 查询首页推荐笔记，优先显示置顶的，然后是设置了首页推荐的
    const [recommendNotes] = await pool.execute(
      `SELECT n.*, c.name as category_name 
       FROM notes n 
       LEFT JOIN note_categories nc ON n.id = nc.note_id 
       LEFT JOIN categories c ON nc.category_id = c.id 
       WHERE n.status = 1 
       AND ( 
         (n.is_top = 1 AND (n.top_expire_time IS NULL OR n.top_expire_time > NOW())) 
         OR n.is_home_recommend = 1
       ) 
       ORDER BY 
         n.is_top DESC, 
         n.top_expire_time DESC, 
         n.updated_at DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    return res.json(formatSuccess(recommendNotes, '获取推荐笔记成功'));

  } catch (error) {
    console.error('获取推荐笔记失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取笔记评论列表
router.get('/notes/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 由于没有找到comments表的具体实现，这里返回模拟数据
    // 实际应用中应该从comments表中查询数据
    const mockComments = [
      {
        id: 1,
        user_id: 1,
        user_name: '游客',
        user_avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        content: '这是一条评论',
        is_liked: false,
        like_count: 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ];

    return res.json(formatSuccess(mockComments, '获取评论列表成功'));

  } catch (error) {
    console.error('获取评论列表失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

// 获取相关笔记
router.get('/notes/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // 查询相关笔记 - 基于相同分类
    const [relatedNotes] = await pool.execute(
      `SELECT n.*, c.name as category_name 
       FROM notes n 
       LEFT JOIN note_categories nc ON n.id = nc.note_id 
       LEFT JOIN categories c ON nc.category_id = c.id 
       WHERE n.id != ? AND n.status = 1 
       AND nc.category_id IN (SELECT category_id FROM note_categories WHERE note_id = ?) 
       ORDER BY n.view_count DESC 
       LIMIT ?`,
      [id, id, parseInt(limit)]
    );

    return res.json(formatSuccess(relatedNotes, '获取相关笔记成功'));

  } catch (error) {
    console.error('获取相关笔记失败:', error);
    return res.status(500).json(formatError('系统暂时无法访问，请稍后重试', 500));
  }
});

module.exports = router;