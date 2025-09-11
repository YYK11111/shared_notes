const express = require('express');
const router = express.Router();
const { pool, query } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { deleteCache } = require('../utils/cacheManager');
const { successResponse: formatSuccess, errorResponse: formatError, paginatedResponse } = require('../utils/responseFormatter');
const searchService = require('../services/searchService');

// 重建搜索索引接口
router.post('/index/rebuild', authMiddleware, async (req, res) => {
  try {
    // 验证是否为超级管理员权限
    const user = req.user;
    if (user.role !== 'super_admin') {
      return res.status(403).json(formatError('权限不足，仅超级管理员可执行此操作', 403));
    }
    
    // 开始重建索引
    try {
      // 1. 禁用全文索引（使用兼容所有MySQL版本的方式）
      try {
        // 先检查索引是否存在
        const [indexCheck] = await query(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.STATISTICS 
          WHERE table_schema = DATABASE() 
          AND table_name = 'notes' 
          AND index_name = 'idx_notes_fulltext';
        `);
        
        // 如果索引存在，则删除它
        if (indexCheck[0].count > 0) {
          await query('ALTER TABLE notes DROP INDEX idx_notes_fulltext;');
        }
      } catch (error) {
        console.log('删除索引时出现错误（可能是索引不存在），继续执行后续操作:', error.message);
      }
      
      // 2. 删除可能的旧索引表
      await query('DROP TABLE IF EXISTS search_index');
      
      // 3. 创建新的索引表
      await query(`
        CREATE TABLE search_index (
          id INT AUTO_INCREMENT PRIMARY KEY,
          note_id INT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FULLTEXT (title, content) WITH PARSER ngram
        ) ENGINE=InnoDB;
      `);
      
      // 4. 重新填充索引数据
      await query(`
        INSERT INTO search_index (note_id, title, content)
        SELECT id, title, content FROM notes WHERE status = 1;
      `);
      
      // 5. 在主表上重新创建全文索引
      await query('ALTER TABLE notes ADD FULLTEXT idx_notes_fulltext (title, content) WITH PARSER ngram');
      
      // 6. 清理缓存
      await deleteCache('search_index');
      
      // 记录操作日志
      await logAdminAction(user.id, user.username, '重建搜索索引', '系统', null, {});
      
      return res.json(formatSuccess(null, '搜索索引重建成功'));
      
    } catch (indexError) {
      console.error('重建索引失败:', indexError);
      return res.status(500).json(formatError('重建索引失败，请检查MySQL配置和全文索引支持情况', 500));
    }
    
  } catch (error) {
    console.error('操作失败:', error);
    return res.status(500).json(formatError('服务器内部错误，请稍后重试', 500));
  }
});

// 获取索引状态接口
router.get('/index/status', authMiddleware, async (req, res) => {
  try {
    // 检查索引是否存在
    const [indexCheck] = await query(`
      SELECT COUNT(*) as index_exists 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE table_schema = DATABASE() 
      AND table_name = 'notes' 
      AND index_name = 'idx_notes_fulltext';
    `);
    
    // 获取索引表中的记录数
    const [indexCount] = await query('SELECT COUNT(*) as count FROM search_index');
    
    // 获取笔记总数
    const [noteCount] = await query('SELECT COUNT(*) as count FROM notes WHERE status = 1');
    
    return res.json(formatSuccess({
      index_exists: indexCheck[0].index_exists > 0,
      indexed_count: indexCount[0].count,
      total_active_notes: noteCount[0].count,
      index_coverage: (indexCount[0].count / Math.max(1, noteCount[0].count) * 100).toFixed(2) + '%'
    }, '获取索引状态成功'));
    
  } catch (error) {
    console.error('获取索引状态失败:', error);
    return res.status(500).json(formatError('获取索引状态失败，请稍后重试', 500));
  }
});

// 管理搜索屏蔽列表接口
router.get('/blocked', authMiddleware, async (req, res) => {
  try {
    // 确保参数类型正确
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    // 获取屏蔽列表
    const [blockedList] = await query(
      'SELECT * FROM search_blocked_notes ORDER BY blocked_at DESC LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    
    // 获取总数
    const [countResult] = await query('SELECT COUNT(*) as total FROM search_blocked_notes');
    const total = countResult[0].total;
    
    return res.json(paginatedResponse(blockedList, total, page, pageSize, '获取搜索屏蔽列表成功'));
    
  } catch (error) {
    console.error('获取搜索屏蔽列表失败:', error);
    return res.status(500).json(formatError('获取搜索屏蔽列表失败，请稍后重试', 500));
  }
});

// 添加笔记到搜索屏蔽列表
router.post('/blocked/add', authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.body;
    const user = req.user;
    
    if (!noteId) {
      return res.status(400).json(formatError('请指定要屏蔽的笔记ID', 400));
    }
    
    // 检查笔记是否存在
    const [notes] = await query('SELECT id, title FROM notes WHERE id = ?', [noteId]);
    if (notes.length === 0) {
      return res.status(404).json(formatError('笔记不存在', 404));
    }
    
    // 检查是否已在屏蔽列表中
    const [blockedCheck] = await query('SELECT id FROM search_blocked_notes WHERE note_id = ?', [noteId]);
    if (blockedCheck.length > 0) {
      return res.status(400).json(formatError('该笔记已在屏蔽列表中', 400));
    }
    
    // 添加到屏蔽列表
    await query(
      'INSERT INTO search_blocked_notes (note_id, note_title, blocked_by) VALUES (?, ?, ?)',
      [noteId, notes[0].title, user.id]
    );
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '添加笔记到搜索屏蔽列表', '笔记', noteId, { title: notes[0].title });
    
    // 清理相关缓存
    await deleteCache(`search_notes_${noteId}`);
    
    return res.json(formatSuccess(null, '添加到屏蔽列表成功'));
    
  } catch (error) {
    console.error('添加到屏蔽列表失败:', error);
    return res.status(500).json(formatError('添加到屏蔽列表失败，请稍后重试', 500));
  }
});

// 从搜索屏蔽列表移除笔记
router.post('/blocked/remove', authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.body;
    const user = req.user;
    
    if (!noteId) {
      return res.status(400).json(formatError('请指定要移除的笔记ID', 400));
    }
    
    // 检查是否在屏蔽列表中
    const [blockedCheck] = await query('SELECT id, note_title FROM search_blocked_notes WHERE note_id = ?', [noteId]);
    if (blockedCheck.length === 0) {
      return res.status(404).json(formatError('该笔记不在屏蔽列表中', 404));
    }
    
    // 从屏蔽列表移除
    await query('DELETE FROM search_blocked_notes WHERE note_id = ?', [noteId]);
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '从搜索屏蔽列表移除笔记', '笔记', noteId, { title: blockedCheck[0].note_title });
    
    return res.json(formatSuccess(null, '从屏蔽列表移除成功'));
    
  } catch (error) {
    console.error('从屏蔽列表移除失败:', error);
    return res.status(500).json(formatError('从屏蔽列表移除失败，请稍后重试', 500));
  }
});

// 获取搜索日志接口
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    
    let searchQuery = 'SELECT * FROM search_logs';
    const whereClause = [];
    const params = [];
    
    if (keyword) {
      whereClause.push('keyword LIKE ?');
      params.push(`%${keyword}%`);
    }
    
    if (startDate) {
      whereClause.push('last_search_time >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause.push('last_search_time <= ?');
      params.push(endDate + ' 23:59:59');
    }
    
    if (whereClause.length > 0) {
      searchQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    searchQuery += ' ORDER BY last_search_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    // 使用导入的query函数执行SQL查询
    const [logs] = await query(searchQuery, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM search_logs';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await query(countQuery, countParams);
    const total = countResult[0].total;
    
    return res.json(paginatedResponse(logs, total, page, pageSize, '获取搜索日志成功'));
    
  } catch (error) {
    console.error('获取搜索日志失败:', error);
    return res.status(500).json(formatError('获取搜索日志失败，请稍后重试', 500));
  }
});

// 获取热门搜索词接口
router.get('/trending', authMiddleware, async (req, res) => {
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
    
    return res.json(formatSuccess(trendingKeywords, '获取热门搜索词成功'));
    
  } catch (error) {
    console.error('获取热门搜索词失败:', error);
    return res.status(500).json(formatError('获取热门搜索词失败，请稍后重试', 500));
  }
});

// 获取搜索配置接口
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const searchConfig = await searchService.getSearchConfig();
    return res.json(formatSuccess(searchConfig, '获取搜索配置成功'));
  } catch (error) {
    console.error('获取搜索配置失败:', error);
    return res.status(500).json(formatError('获取搜索配置失败，请稍后重试', 500));
  }
});

// 更新搜索配置接口
router.put('/config', authMiddleware, async (req, res) => {
  try {
    const { sensitive_words, suggest_count, title_weight, content_weight, enable_suggest, enable_trending } = req.body;
    const user = req.user;
    
    await searchService.updateSearchConfig(sensitive_words, suggest_count, title_weight, content_weight, enable_suggest, enable_trending);
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '更新搜索配置', '系统', null, req.body);
    
    return res.json(formatSuccess(null, '搜索配置更新成功'));
  } catch (error) {
    console.error('更新搜索配置失败:', error);
    if (error.message.includes('验证失败')) {
      return res.status(400).json(formatError(error.message, 400));
    }
    return res.status(500).json(formatError('更新搜索配置失败，请稍后重试', 500));
  }
});



// 清理搜索缓存接口
router.post('/cache/clear', authMiddleware, async (req, res) => {
  try {
    // 验证是否为超级管理员权限
    const user = req.user;
    if (user.role !== 'super_admin') {
      return res.status(403).json(formatError('权限不足，仅超级管理员可执行此操作', 403));
    }
    
    // 引入searchService
    const searchService = require('../services/searchService');
    
    // 执行搜索缓存清理
    await searchService.clearSearchCache();
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '清理搜索缓存', '系统', null, {});
    
    return res.json(formatSuccess(null, '搜索缓存清理成功'));
    
  } catch (error) {
    console.error('清理搜索缓存失败:', error);
    return res.status(500).json(formatError('清理搜索缓存失败，请稍后重试', 500));
  }
});

module.exports = router;