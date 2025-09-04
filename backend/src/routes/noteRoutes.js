const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');

// 配置文件上传
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) // 5MB
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只支持JPG、PNG、GIF格式的图片文件!'));
  }
});

// 获取笔记列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('请求参数:', req.query);
    // 确保参数是有效的数字
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const { keyword, categoryId, status, startDate, endDate } = req.query;
    
    console.log('处理后的分页参数:', { page, pageSize, offset });
    
    let query = 'SELECT n.*, GROUP_CONCAT(c.name) as categories FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id';
    const whereClause = [];
    const params = [];
    
    if (keyword) {
      whereClause.push('(n.title LIKE ? OR n.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (categoryId) {
      whereClause.push('nc.category_id = ?');
      params.push(categoryId);
    }
    
    if (status !== undefined && status !== '') {
      whereClause.push('n.status = ?');
      params.push(parseInt(status));
    }
    
    if (startDate) {
      whereClause.push('n.created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause.push('n.created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }
    
    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 不使用参数化的LIMIT和OFFSET，直接插入数值
    const safePageSize = parseInt(pageSize) || 10;
    const safeOffset = parseInt(offset) || 0;
    query += ` GROUP BY n.id ORDER BY n.updated_at DESC LIMIT ${safePageSize} OFFSET ${safeOffset}`;
    
    console.log('完整SQL查询:', query);
    console.log('参数数组:', params);
    
    const [notes] = await pool.execute(query, params);
    
    // 获取总条数
    let countQuery = 'SELECT COUNT(DISTINCT n.id) as total FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const totalPages = Math.ceil(total / pageSize);
    
    return res.json(formatSuccess({
      list: notes,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: totalPages
    }, '获取笔记列表成功'));
    
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    return res.status(500).json(formatError('获取笔记列表失败，请稍后重试', 500));
  }
});

// 获取单条笔记
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [notes] = await pool.execute(
      'SELECT n.*, GROUP_CONCAT(nc.category_id) as category_ids, GROUP_CONCAT(c.name) as category_names FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.id = ? GROUP BY n.id',
      [id]
    );
    
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    const note = notes[0];
    note.category_ids = note.category_ids ? note.category_ids.split(',').map(Number) : [];
    note.category_names = note.category_names ? note.category_names.split(',') : [];
    
    return res.json(formatSuccess(note, '获取笔记成功'));
    
  } catch (error) {
    console.error('获取笔记失败:', error);
    return res.status(500).json(formatError('获取笔记失败，请稍后重试', 500));
  }
});

// 创建笔记
router.post('/', authMiddleware, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, content, category_ids, status, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend } = req.body;
    
    // 检查参数
    if (!title || !content) {
      return res.status(400).json(formatError('标题和内容不能为空', 400));
    }
    
    // 处理封面图片
    let coverImage = null;
    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    }
    
    // 确保所有可能为undefined的参数都转换为null
    const safeStatus = status !== undefined ? status : null;
    const safeIsTop = is_top !== undefined ? is_top : null;
    const safeTopExpireTime = top_expire_time !== undefined ? top_expire_time : null;
    const safeIsHomeRecommend = is_home_recommend !== undefined ? is_home_recommend : null;
    const safeIsWeekSelection = is_week_selection !== undefined ? is_week_selection : null;
    const safeIsMonthRecommend = is_month_recommend !== undefined ? is_month_recommend : null;
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 插入笔记
      const [result] = await connection.execute(
        'INSERT INTO notes (title, content, cover_image, status, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, content, coverImage, safeStatus, safeIsTop, safeTopExpireTime, safeIsHomeRecommend, safeIsWeekSelection, safeIsMonthRecommend]
      );
      
      const noteId = result.insertId;
      
      // 插入笔记分类关联
      if (category_ids && category_ids.length > 0) {
        const categoryIds = Array.isArray(category_ids) ? category_ids : category_ids.split(',').map(Number);
        for (const categoryId of categoryIds) {
          await connection.execute(
            'INSERT INTO note_categories (note_id, category_id) VALUES (?, ?)',
            [noteId, categoryId]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '创建笔记', '笔记', noteId, { title, category_ids, status });
      
      return res.status(201).json(formatSuccess({ id: noteId }, '创建笔记成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('创建笔记失败:', error);
    return res.status(500).json(formatError('创建笔记失败，请稍后重试', 500));
  }
});

// 更新笔记
router.put('/:id', authMiddleware, upload.single('cover_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category_ids, status, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend, delete_cover } = req.body;
    
    // 检查参数
    if (!title || !content) {
      return res.status(400).json(formatError('标题和内容不能为空', 400));
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 查询原笔记信息
      const [originalNotes] = await connection.execute('SELECT cover_image FROM notes WHERE id = ?', [id]);
      
      if (originalNotes.length === 0) {
        await connection.rollback();
        return res.status(404).json(formatError('笔记不存在', 404));
      }
      
      const originalNote = originalNotes[0];
      
      // 处理封面图片
      let coverImage = originalNote.cover_image;
      if (req.file) {
        // 删除原图片
        if (coverImage) {
          const oldFilePath = path.join(__dirname, '..', '..', coverImage);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        coverImage = `/uploads/${req.file.filename}`;
      } else if (delete_cover === 'true' && coverImage) {
        // 删除封面
        const oldFilePath = path.join(__dirname, '..', '..', coverImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        coverImage = null;
      }
      
      // 更新笔记
      await connection.execute(
        'UPDATE notes SET title = ?, content = ?, cover_image = ?, status = ?, is_top = ?, top_expire_time = ?, is_home_recommend = ?, is_week_selection = ?, is_month_recommend = ? WHERE id = ?',
        [title, content, coverImage, status, is_top, top_expire_time, is_home_recommend, is_week_selection, is_month_recommend, id]
      );
      
      // 删除原分类关联
      await connection.execute('DELETE FROM note_categories WHERE note_id = ?', [id]);
      
      // 插入新分类关联
      if (category_ids && category_ids.length > 0) {
        const categoryIds = Array.isArray(category_ids) ? category_ids : category_ids.split(',').map(Number);
        for (const categoryId of categoryIds) {
          await connection.execute(
            'INSERT INTO note_categories (note_id, category_id) VALUES (?, ?)',
            [id, categoryId]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '更新笔记', '笔记', id, { title, category_ids, status });
      
      return res.json(formatSuccess(null, '更新笔记成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
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
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 查询笔记信息
      const [notes] = await connection.execute('SELECT cover_image FROM notes WHERE id = ?', [id]);
      
      if (notes.length === 0) {
        await connection.rollback();
        return res.status(404).json(formatError('笔记不存在', 404));
      }
      
      const note = notes[0];
      
      // 删除笔记
      await connection.execute('DELETE FROM notes WHERE id = ?', [id]);
      
      // 笔记删除后，相关联的note_categories会通过外键约束自动删除
      
      // 删除封面图片
      if (note.cover_image) {
        const filePath = path.join(__dirname, '..', '..', note.cover_image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '删除笔记', '笔记', id, {});
      
      return res.json(formatSuccess(null, '删除笔记成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('删除笔记失败:', error);
    return res.status(500).json(formatError('删除笔记失败，请稍后重试', 500));
  }
});

// 批量删除笔记
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
      return res.status(400).json(formatError('请选择要删除的笔记', 400));
    }
    
    // 支持数组和单个ID
    let noteIds = ids;
    if (!Array.isArray(noteIds)) {
      noteIds = [noteIds];
    }
    
    // 修复MySQL无法直接处理数组参数的问题
    const placeholders = noteIds.map(() => '?').join(',');
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 查询要删除的笔记的封面图片
      const [notes] = await connection.execute(
        `SELECT cover_image FROM notes WHERE id IN (${placeholders})`,
        [...noteIds]
      );
      
      // 删除笔记
      await connection.execute(
        `DELETE FROM notes WHERE id IN (${placeholders})`,
        [...noteIds]
      );
      
      // 删除封面图片
      for (const note of notes) {
        if (note.cover_image) {
          const filePath = path.join(__dirname, '..', '..', note.cover_image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '批量删除笔记', '笔记', null, { count: noteIds.length, ids: noteIds });
      
      return res.json(formatSuccess(null, '批量删除成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('批量删除笔记失败:', error);
    return res.status(500).json(formatError('批量删除失败，请稍后重试', 500));
  }
});

// 批量修改笔记状态
router.post('/batch-update-status', authMiddleware, async (req, res) => {
  try {
    const { ids, status } = req.body;

    // 支持数组和单个ID
    let noteIds = ids;
    if (!Array.isArray(noteIds)) {
      noteIds = [noteIds];
    }

    if (!noteIds || noteIds.length === 0) {
      return res.status(400).json(formatError('请选择要操作的笔记', 400));
    }

    if (status === undefined) {
      return res.status(400).json(formatError('请指定状态', 400));
    }

    // 修复MySQL无法直接处理数组参数的问题
    const placeholders = noteIds.map(() => '?').join(',');
    await pool.execute(
      `UPDATE notes SET status = ? WHERE id IN (${placeholders})`,
      [status, ...noteIds]
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
    const [totalNotes] = await pool.execute(`SELECT COUNT(*) as count FROM notes ${whereClause}`, params);
    const [activeNotes] = await pool.execute(`SELECT COUNT(*) as count FROM notes WHERE status = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    const [topNotes] = await pool.execute(`SELECT COUNT(*) as count FROM notes WHERE is_top = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    const [recommendedNotes] = await pool.execute(`SELECT COUNT(*) as count FROM notes WHERE is_home_recommend = 1 ${whereClause.replace('WHERE', 'AND')}`, params);
    
    return res.json(formatSuccess({
      total: totalNotes[0].count,
      active: activeNotes[0].count,
      top: topNotes[0].count,
      recommended: recommendedNotes[0].count
    }, '获取统计数据成功'));
    
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
    
    const [stats] = await pool.execute(query, params);
    
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
    const { top } = req.body;

    // 检查参数
    if (top === undefined) {
      return res.status(400).json(formatError('请指定置顶状态', 400));
    }

    // 验证笔记是否存在
    const [notes] = await pool.execute('SELECT id FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }

    // 更新置顶状态
    await pool.execute(
      'UPDATE notes SET is_top = ? WHERE id = ?',
      [top, id]
    );

    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '切换笔记置顶状态', '笔记', id, { top });

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
    
    const [allNotesStats] = await pool.execute(query, [formattedStartDate, formattedStartDate]);
    
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

// 编辑器图片上传接口
router.post('/upload-image', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(formatError('请选择要上传的图片', 400));
    }
    
    // 构建图片URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '上传笔记图片', '笔记', null, { filename: req.file.filename });
    
    return res.json(formatSuccess({ url: imageUrl }, '图片上传成功'));
    
  } catch (error) {
    console.error('图片上传失败:', error);
    return res.status(500).json(formatError('图片上传失败，请稍后重试', 500));
  }
});

module.exports = router;