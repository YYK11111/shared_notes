const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError, paginatedResponse } = require('../utils/responseFormatter');

// 获取反馈列表（后台管理）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, type, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT * FROM feedback';
    const whereClause = [];
    const params = [];
    
    if (status) {
      whereClause.push('status = ?');
      params.push(status);
    }
    
    if (type) {
      whereClause.push('type = ?');
      params.push(type);
    }
    
    if (keyword) {
      whereClause.push('(content LIKE ? OR contact LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const [feedback] = await pool.execute(query, params);
    
    // 获取总条数
    let countQuery = 'SELECT COUNT(*) as total FROM feedback';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    return res.json(paginatedResponse(feedback, total, page, pageSize, '获取反馈列表成功'));
    
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    return res.status(500).json(formatError('获取反馈列表失败，请稍后重试', 500));
  }
});

// 获取单个反馈详情（后台管理）
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [feedback] = await pool.execute('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (feedback.length === 0) {
      return res.status(404).json(formatError('反馈不存在', 404));
    }
    
    return res.json(formatSuccess(feedback[0], '获取反馈详情成功'));
    
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    return res.status(500).json(formatError('获取反馈详情失败，请稍后重试', 500));
  }
});

// 提交反馈（前台用户）
router.post('/submit', async (req, res) => {
  try {
    const { type, content, contact } = req.body;
    
    // 检查参数
    if (!type || !content) {
      return res.status(400).json(formatError('反馈类型和内容不能为空', 400));
    }
    
    // 检查反馈内容长度
    if (content.length > 1000) {
      return res.status(400).json(formatError('反馈内容不能超过1000字', 400));
    }
    
    // 插入反馈
    const [result] = await pool.execute(
      'INSERT INTO feedback (type, content, contact) VALUES (?, ?, ?)',
      [type, content, contact || '']
    );
    
    return res.status(201).json(formatSuccess({ id: result.insertId }, '反馈已收到，感谢您的建议！'));
    
  } catch (error) {
    console.error('提交反馈失败:', error);
    return res.status(500).json(formatError('提交反馈失败，请稍后重试', 500));
  }
});

// 更新反馈状态（后台管理）
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 检查参数
    if (!status) {
      return res.status(400).json(formatError('请指定反馈状态', 400));
    }
    
    // 检查反馈是否存在
    const [feedback] = await pool.execute('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (feedback.length === 0) {
      return res.status(404).json(formatError('反馈不存在', 404));
    }
    
    // 更新状态
    await pool.execute('UPDATE feedback SET status = ? WHERE id = ?', [status, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '更新反馈状态', '反馈', id, { status });
    
    return res.json(formatSuccess(null, '更新反馈状态成功'));
    
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    return res.status(500).json(formatError('更新反馈状态失败，请稍后重试', 500));
  }
});

// 回复反馈（后台管理）
router.put('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, status } = req.body;
    
    // 检查参数
    if (!reply) {
      return res.status(400).json(formatError('回复内容不能为空', 400));
    }
    
    // 检查反馈是否存在
    const [feedback] = await pool.execute('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (feedback.length === 0) {
      return res.status(404).json(formatError('反馈不存在', 404));
    }
    
    // 更新回复和状态
    await pool.execute(
      'UPDATE feedback SET reply = ?, status = ? WHERE id = ?',
      [reply, status || '已处理', id]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '回复反馈', '反馈', id, { reply });
    
    // 如果有联系方式，可以在这里发送邮件通知（需要配置邮件服务）
    const feedbackItem = feedback[0];
    if (feedbackItem.contact && (feedbackItem.contact.includes('@') || feedbackItem.contact.match(/^1[3-9]\d{9}$/))) {
      // 这里可以调用邮件发送服务
      console.log(`待发送回复通知到: ${feedbackItem.contact}`);
    }
    
    return res.json(formatSuccess(null, '回复反馈成功'));
    
  } catch (error) {
    console.error('回复反馈失败:', error);
    return res.status(500).json(formatError('回复反馈失败，请稍后重试', 500));
  }
});

// 删除反馈（后台管理）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查反馈是否存在
    const [feedback] = await pool.execute('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (feedback.length === 0) {
      return res.status(404).json(formatError('反馈不存在', 404));
    }
    
    // 删除反馈
    await pool.execute('DELETE FROM feedback WHERE id = ?', [id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除反馈', '反馈', id, {});
    
    return res.json(formatSuccess(null, '删除反馈成功'));
    
  } catch (error) {
    console.error('删除反馈失败:', error);
    return res.status(500).json(formatError('删除反馈失败，请稍后重试', 500));
  }
});

// 获取反馈统计数据（后台管理）
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [statusStats] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM feedback GROUP BY status'
    );
    
    const [typeStats] = await pool.execute(
      'SELECT type, COUNT(*) as count FROM feedback GROUP BY type'
    );
    
    return res.json(formatSuccess({
      statusStats,
      typeStats
    }, '获取反馈统计数据成功'));
    
  } catch (error) {
    console.error('获取反馈统计数据失败:', error);
    return formatError(res, '获取统计数据失败，请稍后重试', 500);
  }
});

module.exports = router;