const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');
const xss = require('xss');
const dbConfig = require('../../database/dbConfig');

// 导入Markdown服务
const markdownService = require('../services/markdownService');

// 长笔记阈值：10000字符
const LONG_NOTE_THRESHOLD = 10000;

// 获取笔记的HTML预览（后台使用）
router.get('/:id/preview', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询笔记基本信息
    const notes = await dbConfig.query(
      'SELECT id, title, content, status, cover_image, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend, created_at, updated_at FROM notes WHERE id = ?',
      [id]
    );
    
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 查询笔记所属分类
    const categories = await dbConfig.query(
      'SELECT c.id, c.name FROM note_categories nc JOIN categories c ON nc.category_id = c.id WHERE nc.note_id = ?',
      [id]
    );
    
    // 处理笔记内容
    const note = notes[0];
    note.categories = categories;
    
    // 根据笔记长度选择处理方式
    if (note.content && note.content.length > LONG_NOTE_THRESHOLD) {
      // 长笔记使用异步处理，先返回基本信息
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        code: 200,
        message: '正在处理长笔记，请等待...',
        data: {
          basicInfo: {
            id: note.id,
            title: note.title,
            status: note.status,
            cover_image: note.cover_image,
            is_top: note.is_top,
            top_expire_time: note.top_expire_time,
            is_home_recommend: note.is_home_recommend,
            is_week_selection: note.is_week_selection,
            is_month_recommend: note.is_month_recommend,
            created_at: note.created_at,
            updated_at: note.updated_at,
            categories: note.categories
          },
          isLongNote: true
        }
      }));
      res.end();
      
      try {
        // 异步处理HTML转换
        const htmlContent = await markdownService.asyncMarkdownToHtml(note.content);
        // 可以在这里添加逻辑，比如将转换后的HTML缓存到数据库
        console.log(`长笔记${id}转换完成`);
      } catch (error) {
        console.error(`长笔记${id}转换失败:`, error);
      }
    } else {
      // 短笔记使用同步缓存转换
      note.html_content = markdownService.markdownToHtml(note.content);
      note.isLongNote = false;
      
      return res.json(formatSuccess(note, '获取笔记预览成功'));
    }
  } catch (error) {
    console.error('获取笔记预览失败:', error);
    return res.status(500).json(formatError('获取笔记预览失败，请稍后重试', 500));
  }
});

// 获取笔记详情
// 添加缺少的路由映射，兼容前端直接使用/api/notes/:id的请求
router.get('/:id', authMiddleware, async (req, res) => {
  // 转发请求到现有的/detail接口
  return res.redirect(307, `/api/notes/${req.params.id}/detail`);
});

// 获取笔记详情接口
router.get('/:id/detail', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询笔记基本信息
    const notes = await dbConfig.query(
      'SELECT id, title, content, status, cover_image, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend, created_at, updated_at FROM notes WHERE id = ?',
      [id]
    );
    
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 查询笔记所属分类
    const categories = await dbConfig.query(
      'SELECT c.id, c.name FROM note_categories nc JOIN categories c ON nc.category_id = c.id WHERE nc.note_id = ?',
      [id]
    );
    
    // 处理笔记内容
    const note = notes[0];
    note.categories = categories;
    note.tags = []; // 不查询标签表，直接返回空数组
    
    return res.json(formatSuccess(note, '获取笔记详情成功'));
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    return res.status(500).json(formatError('获取笔记详情失败，请稍后重试', 500));
  }
});

// 切换笔记首页推荐状态
router.put('/:id/home-recommend', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_home_recommend: isHomeRecommend } = req.body;
    
    // 检查参数
    if (isHomeRecommend === undefined) {
      return res.status(400).json(formatError('请指定首页推荐状态', 400));
    }
    
    // 验证笔记是否存在
    const [notes] = await dbConfig.query('SELECT id FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 更新首页推荐状态
    await dbConfig.query('UPDATE notes SET is_home_recommend = ? WHERE id = ?', [isHomeRecommend, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '切换笔记首页推荐状态', '笔记', id, { isHomeRecommend });
    
    return res.json(formatSuccess(null, isHomeRecommend ? '设置首页推荐成功' : '取消首页推荐成功'));
  } catch (error) {
    console.error('切换笔记首页推荐状态失败:', error);
    return res.status(500).json(formatError('切换首页推荐状态失败，请稍后重试', 500));
  }
});

// 切换笔记本周精选状态
router.put('/:id/week-selection', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_week_selection: isWeekSelection } = req.body;
    
    // 检查参数
    if (isWeekSelection === undefined) {
      return res.status(400).json(formatError('请指定本周精选状态', 400));
    }
    
    // 验证笔记是否存在
    const [notes] = await dbConfig.query('SELECT id FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 更新本周精选状态
    await dbConfig.query('UPDATE notes SET is_week_selection = ? WHERE id = ?', [isWeekSelection, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '切换笔记本周精选状态', '笔记', id, { isWeekSelection });
    
    return res.json(formatSuccess(null, isWeekSelection ? '设置本周精选成功' : '取消本周精选成功'));
  } catch (error) {
    console.error('切换笔记本周精选状态失败:', error);
    return res.status(500).json(formatError('切换本周精选状态失败，请稍后重试', 500));
  }
});

// 切换笔记本月推荐状态
router.put('/:id/month-recommend', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_month_recommend: isMonthRecommend } = req.body;
    
    // 检查参数
    if (isMonthRecommend === undefined) {
      return res.status(400).json(formatError('请指定本月推荐状态', 400));
    }
    
    // 验证笔记是否存在
    const [notes] = await dbConfig.query('SELECT id FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 更新本月推荐状态
    await dbConfig.query('UPDATE notes SET is_month_recommend = ? WHERE id = ?', [isMonthRecommend, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '切换笔记本月推荐状态', '笔记', id, { isMonthRecommend });
    
    return res.json(formatSuccess(null, isMonthRecommend ? '设置本月推荐成功' : '取消本月推荐成功'));
  } catch (error) {
    console.error('切换笔记本月推荐状态失败:', error);
    return res.status(500).json(formatError('切换本月推荐状态失败，请稍后重试', 500));
  }
});

// 获取笔记列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('请求参数:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    const { keyword, categoryId, status, startDate, endDate, parentCategoryId, isHomeRecommend, isTop, isWeekSelection, isMonthRecommend } = req.query;
    const actualCategoryId = req.query.category_id || categoryId;
    
    let queryString = `
      SELECT n.id, n.title, n.content, n.status, n.cover_image, n.is_top, n.top_expire_time, n.is_home_recommend, n.is_week_selection, n.is_month_recommend, n.created_at, n.updated_at,
        GROUP_CONCAT(DISTINCT c.name SEPARATOR ',') as category_names,
        GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') as category_ids
      FROM notes n
      LEFT JOIN note_categories nc ON n.id = nc.note_id
      LEFT JOIN categories c ON nc.category_id = c.id
    `;
    
    let countQuery = `
      SELECT COUNT(DISTINCT n.id) as count
      FROM notes n
      LEFT JOIN note_categories nc ON n.id = nc.note_id
      LEFT JOIN categories c ON nc.category_id = c.id
    `;
    
    let whereClause = [];
    let params = [];
    
    // 关键词搜索
    if (keyword) {
      whereClause.push('(n.title LIKE ? OR n.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    // 分类筛选
    if (actualCategoryId) {
      whereClause.push('c.id = ?');
      params.push(actualCategoryId);
    }
    
    // 父分类筛选
    if (parentCategoryId) {
      whereClause.push('c.parent_id = ?');
      params.push(parentCategoryId);
    }
    
    // 状态筛选
    if (status !== undefined) {
      whereClause.push('n.status = ?');
      params.push(status);
    }
    
    // 首页推荐筛选
    if (isHomeRecommend !== undefined) {
      whereClause.push('n.is_home_recommend = ?');
      params.push(isHomeRecommend);
    }
    
    // 置顶筛选
    if (isTop !== undefined) {
      whereClause.push('n.is_top = ?');
      params.push(isTop);
    }
    
    // 本周精选筛选
    if (isWeekSelection !== undefined) {
      whereClause.push('n.is_week_selection = ?');
      params.push(isWeekSelection);
    }
    
    // 本月推荐筛选
    if (isMonthRecommend !== undefined) {
      whereClause.push('n.is_month_recommend = ?');
      params.push(isMonthRecommend);
    }
    
    // 时间范围筛选
    if (startDate) {
      whereClause.push('n.created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause.push('n.created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }
    
    // 组合查询条件
    if (whereClause.length > 0) {
      queryString += ' WHERE ' + whereClause.join(' AND ');
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 分组和排序
    queryString += ' GROUP BY n.id ORDER BY n.updated_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    // 执行查询
    const notes = await dbConfig.query(queryString, params);
    const countResult = await dbConfig.query(countQuery, params);
    const total = countResult[0].count;
    
    // 处理结果数据
    const processedNotes = notes.map(note => {
      // 创建categories数组
      const categories = [];
      if (note.category_names && note.category_ids) {
        const names = note.category_names.split(',');
        const ids = note.category_ids.split(',').map(id => parseInt(id));
        
        // 组合成categories数组
        for (let i = 0; i < names.length; i++) {
          if (names[i] && ids[i]) {
            categories.push({
              id: ids[i],
              name: names[i]
            });
          }
        }
      }
      
      return {
        ...note,
        categories: categories,
        tag_names: [],
        tag_ids: []
        // 删除旧的分类字段，保持与API文档一致
      };
    });

    return res.json(formatSuccess({
      list: processedNotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }, '获取笔记列表成功'));
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    return res.status(500).json(formatError('获取笔记列表失败，请稍后重试', 500));
  }
});

// 创建笔记
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, status, categoryIds = [], tagIds = [], cover_image, isTop = 0, topExpireTime = null, isHomeRecommend = 0, isWeekSelection = 0, isMonthRecommend = 0 } = req.body;
    
    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json(formatError('标题和内容不能为空', 400));
    }
    
    // 验证分类格式
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json(formatError('分类ID格式不正确', 400));
    }
    
    // 处理文件ID
    const coverImageFileId = cover_image || null;
    
    // 开始事务
    const noteId = await dbConfig.transaction(async (connection) => {
      // 插入笔记基本信息
      const result = await dbConfig.executeInTransaction(connection,
        'INSERT INTO notes (title, content, status, cover_image, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [title, content, status, coverImageFileId, isTop, topExpireTime, isHomeRecommend, isWeekSelection, isMonthRecommend]
      );
      
      const insertId = result.insertId;
      
      // 插入分类关联
      if (categoryIds.length > 0) {
        const categoryValues = categoryIds.filter(id => id && !isNaN(id)).map(id => [insertId, id]);
        if (categoryValues.length > 0) {
          // 对于多行插入，需要使用query方法而不是execute方法
          await connection.query('INSERT INTO note_categories (note_id, category_id) VALUES ?', [categoryValues]);
        }
      }
      
      // 不处理标签关联，因为note_tags表不存在
      
      return insertId;
    });
    
    // 记录操作日志
    const decoded = req.user;
    const logData = {
      title,
      status,
      categoryIds,
      tagIds
    };
    await logAdminAction(decoded.id, decoded.username, '创建笔记', '笔记', noteId, logData);
    
    return res.json(formatSuccess({ noteId }, '创建笔记成功'));
  } catch (error) {
    console.error('创建笔记失败:', error);
    return res.status(500).json(formatError('创建笔记失败，请稍后重试', 500));
  }
});

// 更新笔记
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status, categoryIds = [], tagIds = [], cover_image, isTop, topExpireTime = null, isHomeRecommend, isWeekSelection, isMonthRecommend } = req.body;
    
    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json(formatError('标题和内容不能为空', 400));
    }
    
    // 验证分类格式
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json(formatError('分类ID格式不正确', 400));
    }
    
    // 处理文件ID
    const coverImageFileId = cover_image || null;
    
    // 开始事务
    await dbConfig.transaction(async (connection) => {
      // 验证笔记是否存在
      const notes = await dbConfig.executeInTransaction(connection, 'SELECT id FROM notes WHERE id = ?', [id]);
      
      if (notes.length === 0) {
        throw new Error('笔记不存在');
      }
      
      // 查询当前笔记的置顶、推荐等状态
      const currentNote = await dbConfig.executeInTransaction(connection, 'SELECT is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend FROM notes WHERE id = ?', [id]);
      
      // 使用当前状态作为默认值，只有在前端提供了新值时才更新
      const finalIsTop = isTop !== undefined ? isTop : currentNote[0].is_top;
      const finalTopExpireTime = topExpireTime !== undefined ? topExpireTime : currentNote[0].top_expire_time;
      const finalIsHomeRecommend = isHomeRecommend !== undefined ? isHomeRecommend : currentNote[0].is_home_recommend;
      const finalIsWeekSelection = isWeekSelection !== undefined ? isWeekSelection : currentNote[0].is_week_selection;
      const finalIsMonthRecommend = isMonthRecommend !== undefined ? isMonthRecommend : currentNote[0].is_month_recommend;
      
      // 更新笔记基本信息
      await dbConfig.executeInTransaction(connection,
        'UPDATE notes SET title = ?, content = ?, status = ?, cover_image = ?, is_top = ?, top_expire_time = ?, is_home_recommend = ?, is_week_selection = ?, is_month_recommend = ?, updated_at = NOW() WHERE id = ?',
        [title, content, status, coverImageFileId, finalIsTop ?? null, finalTopExpireTime ?? null, finalIsHomeRecommend ?? null, finalIsWeekSelection ?? null, finalIsMonthRecommend ?? null, id]
      );
      
      // 先删除现有的分类关联
      await dbConfig.executeInTransaction(connection, 'DELETE FROM note_categories WHERE note_id = ?', [id]);
      
      // 再添加新的分类关联
      if (categoryIds.length > 0) {
        // 修复变量名冲突，使用categoryId而不是id作为参数名
        const categoryValues = categoryIds.filter(categoryId => categoryId && !isNaN(categoryId)).map(categoryId => [id, categoryId]);
        if (categoryValues.length > 0) {
          // 修复批量插入语法问题
          const placeholders = categoryValues.map(() => '(?, ?)').join(', ');
          const flatValues = categoryValues.flat();
          await dbConfig.executeInTransaction(connection,
            `INSERT INTO note_categories (note_id, category_id) VALUES ${placeholders}`,
            flatValues
          );
        }
      }
      
      // 不处理标签关联，因为note_tags表不存在
    });
    
    // 记录操作日志
    const decoded = req.user;
    const logData = {
      title,
      status,
      categoryIds,
      tagIds
    };
    await logAdminAction(decoded.id, decoded.username, '更新笔记', '笔记', id, logData);
    
    return res.json(formatSuccess(null, '更新笔记成功'));
  } catch (error) {
    console.error('更新笔记失败:', error);
    return res.status(500).json(formatError('更新笔记失败，请稍后重试', 500));
  }
});

// 删除笔记
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 开始事务
    await dbConfig.transaction(async (connection) => {
      // 验证笔记是否存在
      const notes = await dbConfig.executeInTransaction(connection, 'SELECT cover_image FROM notes WHERE id = ?', [id]);
      
      if (notes.length === 0) {
        throw new Error('笔记不存在');
      }
      
      // 删除笔记
      await dbConfig.executeInTransaction(connection, 'DELETE FROM notes WHERE id = ?', [id]);
      
      // 删除分类关联
      await dbConfig.executeInTransaction(connection, 'DELETE FROM note_categories WHERE note_id = ?', [id]);
      
      // 不删除标签关联，因为note_tags表不存在
    });
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除笔记', '笔记', id);
    
    return res.json(formatSuccess(null, '删除笔记成功'));
  } catch (error) {
    console.error('删除笔记失败:', error);
    return res.status(500).json(formatError('删除笔记失败，请稍后重试', 500));
  }
});

// 批量删除笔记
router.delete('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { noteIds } = req.body;
    
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json(formatError('请选择要删除的笔记', 400));
    }
    
    // 开始事务
    await dbConfig.transaction(async (connection) => {
      // 删除笔记
      await dbConfig.executeInTransaction(connection,
        'DELETE FROM notes WHERE id IN (?)',
        [noteIds]
      );
      
      // 删除分类关联
      await dbConfig.executeInTransaction(connection,
        'DELETE FROM note_categories WHERE note_id IN (?)',
        [noteIds]
      );
      
      // 不删除标签关联，因为note_tags表不存在
    });
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '批量删除笔记', '笔记', null, { noteIds });
    
    return res.json(formatSuccess(null, '批量删除笔记成功'));
  } catch (error) {
    console.error('批量删除笔记失败:', error);
    return res.status(500).json(formatError('批量删除笔记失败，请稍后重试', 500));
  }
});

// 批量修改笔记状态
router.put('/batch-status', authMiddleware, async (req, res) => {
  try {
    const { noteIds, status } = req.body;
    
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json(formatError('请选择要修改的笔记', 400));
    }
    
    if (status === undefined) {
      return res.status(400).json(formatError('请指定状态', 400));
    }
    
    // 更新笔记状态
    await dbConfig.query(
      'UPDATE notes SET status = ? WHERE id IN (?)',
      [status, noteIds]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '批量修改笔记状态', '笔记', null, { count: noteIds.length, status });
    
    return res.json(formatSuccess(null, '批量修改成功'));
  } catch (error) {
    console.error('批量修改笔记状态失败:', error);
    return res.status(500).json(formatError('批量修改失败，请稍后重试', 500));
  }
});

// 统计笔记数据
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (startDate) {
      whereClause += 'WHERE created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += whereClause ? ' AND created_at <= ?' : 'WHERE created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    // 获取统计数据
    const totalNotes = await dbConfig.query(`SELECT COUNT(*) as count FROM notes ${whereClause}`, params);
    const activeNotes = await dbConfig.query(`SELECT COUNT(*) as count FROM notes WHERE status = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    const topNotes = await dbConfig.query(`SELECT COUNT(*) as count FROM notes WHERE is_top = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    const recommendedNotes = await dbConfig.query(`SELECT COUNT(*) as count FROM notes WHERE is_home_recommend = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    
    return res.json(formatSuccess({
      total: totalNotes[0].count,
      active: activeNotes[0].count,
      top: topNotes[0].count,
      recommended: recommendedNotes[0].count
    }, '获取笔记统计数据成功'));
    
  } catch (error) {
    console.error('获取笔记统计数据失败:', error);
    return res.status(500).json(formatError('获取统计数据失败，请稍后重试', 500));
  }
});

// 笔记统计详情接口
router.get('/stats/detail', authMiddleware, async (req, res) => {
  try {
    const { noteId, timeRange = '7d', type = 'views' } = req.query;
    
    if (!noteId) {
      return res.status(400).json({ code: 400, data: null, msg: '请指定笔记ID' });
    }
    
    // 验证时间范围
    const validTimeRanges = ['1d', '7d', '30d', '90d'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json(formatError('无效的时间范围', 400));
    }
    
    // 验证统计类型
    const validTypes = ['views', 'exposure', 'conversion_rate'];
    if (!validTypes.includes(type)) {
      return res.status(400).json(formatError('无效的统计类型', 400));
    }
    
    // 根据时间范围计算开始日期
    let startDate = new Date();
    const days = parseInt(timeRange);
    startDate.setDate(startDate.getDate() - days);
    
    // 格式化日期
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    let query = '';
    let params = [noteId, formattedStartDate];
    
    // 根据不同的统计类型构建查询
    if (type === 'views') {
      // 阅读量统计
      query = `
        SELECT 
          DATE(view_time) as date, 
          COUNT(*) as views 
        FROM note_views 
        WHERE note_id = ? AND view_time >= ? 
        GROUP BY DATE(view_time) 
        ORDER BY date ASC
      `;
    } else if (type === 'exposure') {
      // 曝光量统计（这里假设我们有一个exposure_logs表来记录曝光数据）
      query = `
        SELECT 
          DATE(exposure_time) as date, 
          COUNT(*) as exposure 
        FROM exposure_logs 
        WHERE note_id = ? AND exposure_time >= ? 
        GROUP BY DATE(exposure_time) 
        ORDER BY date ASC
      `;
    } else if (type === 'conversion_rate') {
      // 转化率统计
      query = `
        SELECT 
          DATE(view_time) as date, 
          COUNT(DISTINCT nv.id) as views, 
          COUNT(DISTINCT el.id) as exposure, 
          (COUNT(DISTINCT nv.id) / NULLIF(COUNT(DISTINCT el.id), 0)) * 100 as conversion_rate 
        FROM exposure_logs el 
        LEFT JOIN note_views nv ON el.note_id = nv.note_id AND DATE(el.exposure_time) = DATE(nv.view_time) 
        WHERE el.note_id = ? AND el.exposure_time >= ? 
        GROUP BY DATE(view_time) 
        ORDER BY date ASC
      `;
    }
    
    const stats = await dbConfig.query(query, params);
    
    // 填充缺失的日期数据
    const filledStats = [];
    const currentDate = new Date(formattedStartDate);
    const endDate = new Date();
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingStat = stats.find(item => item.date === dateStr);
      
      if (existingStat) {
        filledStats.push(existingStat);
      } else {
        if (type === 'conversion_rate') {
          filledStats.push({ date: dateStr, views: 0, exposure: 0, conversion_rate: 0 });
        } else {
          filledStats.push({ date: dateStr, [type === 'views' ? 'views' : 'exposure']: 0 });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return res.json(formatSuccess({
      stats: filledStats,
      total: stats.reduce((sum, item) => sum + (item.views || item.exposure || 0), 0),
      average: Math.round(stats.reduce((sum, item) => sum + (item.views || item.exposure || 0), 0) / days * 100) / 100
    }, '获取笔记统计数据成功'));
    
  } catch (error) {
    console.error('获取笔记统计数据失败:', error);
    return res.status(500).json(formatError('获取统计数据失败，请稍后重试', 500));
  }
});

// 切换笔记置顶状态
router.put('/:id/top', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { top, top_expire_time } = req.body;

    // 检查参数
    if (top === undefined) {
      return res.status(400).json(formatError('请指定置顶状态', 400));
    }

    // 验证笔记是否存在
    const notes = await dbConfig.query('SELECT id FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }

    // 准备更新参数
    const updateParams = [];
    let updateQuery = 'UPDATE notes SET is_top = ?';
    updateParams.push(top);
    
    // 如果设置了置顶过期时间
    if (top === 1 && top_expire_time) {
      updateQuery += ', top_expire_time = ?';
      updateParams.push(top_expire_time);
    } else if (top === 0) {
      // 取消置顶时清除过期时间
      updateQuery += ', top_expire_time = NULL';
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    // 更新置顶状态
    await dbConfig.query(updateQuery, updateParams);

    // 记录操作日志
    const decoded = req.user;
    const logData = { top };
    if (top_expire_time) {
      logData.top_expire_time = top_expire_time;
    }
    await logAdminAction(decoded.id, decoded.username, '切换笔记置顶状态', '笔记', id, logData);

    return res.json(formatSuccess(null, top === 1 ? '置顶成功' : '取消置顶成功'));
      
  } catch (error) {
    console.error('切换笔记置顶状态失败:', error);
    return res.status(500).json(formatError('切换置顶状态失败，请稍后重试', 500));
  }
});

// 批量笔记统计接口（根据统计指标筛选笔记）
router.post('/stats/filter', authMiddleware, async (req, res) => {
  try {
    const { condition, timeRange = '7d', page = 1, pageSize = 10 } = req.body;
    const offset = (page - 1) * pageSize;
    
    if (!condition || typeof condition !== 'object') {
      return res.status(400).json(formatError('请提供有效的筛选条件', 400));
    }
    
    // 根据时间范围计算开始日期
    let startDate = new Date();
    let days = 7; // 默认7天
    
    // 支持带单位的时间格式，如'7d'、'30d'等
    if (typeof timeRange === 'string') {
      const match = timeRange.match(/^(\d+)([dD])$/);
      if (match) {
        days = parseInt(match[1]);
      } else if (!isNaN(parseInt(timeRange))) {
        days = parseInt(timeRange);
      }
    } else if (typeof timeRange === 'number') {
      days = timeRange;
    }
    
    // 确保days是有效的数字
    days = isNaN(days) || days <= 0 ? 7 : days;
    startDate.setDate(startDate.getDate() - days);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    // 使用简单的SQL查询，获取所有笔记的统计数据
    const query = `
      SELECT n.id, n.title, n.status, 
        COUNT(DISTINCT nv.id) as views_count, 
        COUNT(DISTINCT el.id) as exposure_count, 
        (COUNT(DISTINCT nv.id) / NULLIF(COUNT(DISTINCT el.id), 0)) * 100 as conversion_rate 
      FROM notes n
      LEFT JOIN note_views nv ON n.id = nv.note_id AND nv.view_time >= ?
      LEFT JOIN exposure_logs el ON n.id = el.note_id AND el.exposure_time >= ?
      GROUP BY n.id, n.title, n.status
      ORDER BY n.updated_at DESC
    `;
    
    const allNotesStats = await dbConfig.query(query, [formattedStartDate, formattedStartDate]);
    
    // 在应用层根据条件过滤结果
    const filteredNotes = allNotesStats.filter(note => {
      for (const [key, value] of Object.entries(condition)) {
        if (key === 'views_count' && note.views_count <= value) return false;
        if (key === 'exposure_count' && note.exposure_count <= value) return false;
        if (key === 'conversion_rate') {
          const rate = note.conversion_rate || 0;
          if (rate <= value) return false;
        }
      }
      return true;
    });
    
    // 分页处理
    const total = filteredNotes.length;
    const paginatedNotes = filteredNotes.slice(offset, offset + parseInt(pageSize));
    
    return res.json(formatSuccess({
      list: paginatedNotes,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    }, '获取筛选笔记列表成功'));
    
  } catch (error) {
    console.error('获取筛选笔记列表失败:', error);
    return res.status(500).json(formatError('获取筛选笔记列表失败，请稍后重试', 500));
  }
});


module.exports = router;