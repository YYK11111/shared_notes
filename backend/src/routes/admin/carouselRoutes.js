const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authMiddleware, permissionMiddleware } = require('../../middleware/authMiddleware');
const { convertIsoToMysqlDateTime } = require('../../utils/dateTime');

// 应用认证和权限中间件
router.use(authMiddleware);
router.use(permissionMiddleware('carousel_manage'));

/**
 * 获取轮播图列表
 * @route GET /api/admin/carousels
 * @description 获取轮播图列表，支持分页、筛选和排序
 * @access 轮播图管理权限
 */
router.get('/carousels', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, position, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = '1=1';
    const params = [];
    
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }
    
    if (position && position !== '') {
      whereClause += ' AND position = ?';
      params.push(position);
    }
    
    if (keyword && keyword !== '') {
      whereClause += ' AND (name LIKE ? OR title LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    // 查询轮播图列表（单表查询）
    const [carousels] = await query(
      `SELECT id, name, description, file_id, title, subtitle, link_url, 
       link_target, status, sort, start_time, end_time, position, created_at, updated_at 
       FROM carousels 
       WHERE ${whereClause} 
       ORDER BY sort ASC, updated_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );
    
    // 查询总条数
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM carousels WHERE ${whereClause}`,
      params
    );
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / pageSize);
    
    // 返回轮播图列表
    res.json({
      code: 200,
      data: {
        list: carousels,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages
        }
      },
      msg: '获取轮播图列表成功'
    });
  } catch (error) {
    console.error('获取轮播图列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取轮播图列表失败，请稍后重试'
    });
  }
});

/**
 * 获取单个轮播图详情
 * @route GET /api/admin/carousels/:id
 * @description 获取单个轮播图的详细信息
 * @access 轮播图管理权限
 */
router.get('/carousels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询轮播图详情（单表查询）
    const [carousels] = await query(
      `SELECT id, name, description, file_id, title, subtitle, link_url, 
       link_target, status, sort, start_time, end_time, position, created_at, updated_at 
       FROM carousels 
       WHERE id = ?`,
      [id]
    );
    
    if (carousels.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '轮播图不存在'
      });
    }
    
    // 返回轮播图详情
    res.json({
      code: 200,
      data: carousels[0],
      msg: '获取轮播图详情成功'
    });
  } catch (error) {
    console.error('获取轮播图详情失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取轮播图详情失败，请稍后重试'
    });
  }
});

/**
 * 创建新的轮播图
 * @route POST /api/admin/carousels
 * @description 创建新的轮播图
 * @access 轮播图管理权限
 */
router.post('/carousels', async (req, res) => {
  try {
    const {
      name, description, file_id, title, subtitle,
      link_url, link_target, status, sort,
      start_time, end_time, position
    } = req.body;
    
    // 验证必填字段
    if (!name || !file_id) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '轮播图名称和文件ID为必填项'
      });
    }
    
    // 转换日期时间格式为MySQL兼容格式
    const formattedStartTime = convertIsoToMysqlDateTime(start_time);
    const formattedEndTime = convertIsoToMysqlDateTime(end_time);
    
    // 插入轮播图数据
    const [result] = await query(
      `INSERT INTO carousels (
        name, description, file_id, title, subtitle,
        link_url, link_target, status, sort,
        start_time, end_time, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description || '', file_id, title || '', subtitle || '',
        link_url || '', link_target || '_self', status || 1, sort || 100,
        formattedStartTime, formattedEndTime, position || 'home_top'
      ]
    );
    
    res.json({
      code: 200,
      data: {
        id: result.insertId
      },
      msg: '创建轮播图成功'
    });
  } catch (error) {
    console.error('创建轮播图失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '创建轮播图失败，请稍后重试'
    });
  }
});

/**
 * 更新轮播图
 * @route PUT /api/admin/carousels/:id
 * @description 更新指定轮播图的信息
 * @access 轮播图管理权限
 */
router.put('/carousels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, file_id, title, subtitle,
      link_url, link_target, status, sort,
      start_time, end_time, position
    } = req.body;
    
    // 验证必填字段
    if (!name || !file_id) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '轮播图名称和文件ID为必填项'
      });
    }
    
    // 检查轮播图是否存在
    const [existingCarousels] = await query(
      'SELECT id FROM carousels WHERE id = ?',
      [id]
    );
    
    if (existingCarousels.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '轮播图不存在'
      });
    }
    
    // 转换日期时间格式为MySQL兼容格式
    const formattedStartTime = convertIsoToMysqlDateTime(start_time);
    const formattedEndTime = convertIsoToMysqlDateTime(end_time);
    
    // 更新轮播图数据
    await query(
      `UPDATE carousels SET 
        name = ?, description = ?, file_id = ?, title = ?, subtitle = ?,
        link_url = ?, link_target = ?, status = ?, sort = ?,
        start_time = ?, end_time = ?, position = ?
      WHERE id = ?`,
      [
        name, description || '', file_id, title || '', subtitle || '',
        link_url || '', link_target || '_self', status || 1, sort || 100,
        formattedStartTime, formattedEndTime, position || 'home_top',
        id
      ]
    );
    
    res.json({
      code: 200,
      data: null,
      msg: '更新轮播图成功'
    });
  } catch (error) {
    console.error('更新轮播图失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新轮播图失败，请稍后重试'
    });
  }
});

/**
 * 更新轮播图状态
 * @route PATCH /api/admin/carousels/:id/status
 * @description 更新指定轮播图的状态
 * @access 轮播图管理权限
 */
router.patch('/carousels/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证状态参数
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '状态值必须是0或1'
      });
    }
    
    // 检查轮播图是否存在
    const [existingCarousels] = await query(
      'SELECT id FROM carousels WHERE id = ?',
      [id]
    );
    
    if (existingCarousels.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '轮播图不存在'
      });
    }
    
    // 更新轮播图状态
    await query(
      'UPDATE carousels SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    res.json({
      code: 200,
      data: null,
      msg: '更新轮播图状态成功'
    });
  } catch (error) {
    console.error('更新轮播图状态失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新轮播图状态失败，请稍后重试'
    });
  }
});

/**
 * 删除轮播图
 * @route DELETE /api/admin/carousels/:id
 * @description 删除指定的轮播图
 * @access 轮播图管理权限
 */
router.delete('/carousels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查轮播图是否存在
    const [existingCarousels] = await query(
      'SELECT id FROM carousels WHERE id = ?',
      [id]
    );
    
    if (existingCarousels.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '轮播图不存在'
      });
    }
    
    // 删除轮播图
    await query(
      'DELETE FROM carousels WHERE id = ?',
      [id]
    );
    
    res.json({
      code: 200,
      data: null,
      msg: '删除轮播图成功'
    });
  } catch (error) {
    console.error('删除轮播图失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '删除轮播图失败，请稍后重试'
    });
  }
});



module.exports = router;