const express = require('express');
const router = express.Router();
const { query, pool } = require('../database/db');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError, paginatedResponse } = require('../utils/responseFormatter');

// 获取管理员列表 - 支持两种路径格式
router.get('/', authMiddleware, async (req, res) => {
  // 复用管理员列表功能
  return getAdminList(req, res);
});

// 为前端请求添加兼容的/admins路径
router.get('/admins', authMiddleware, async (req, res) => {
  return getAdminList(req, res);
});

// 管理员列表处理函数
async function getAdminList(req, res) {
  try {
    // 确保page和pageSize是有效的数字
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { keyword, status, role_id } = req.query;
    
    // 确保page和pageSize是有效的正整数
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validPageSize = Math.max(1, Math.min(100, isNaN(pageSize) ? 10 : pageSize));
    const offset = (validPage - 1) * validPageSize;
    
    let sqlQuery = 'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id';
    const whereClause = [];
    const params = [];
    
    if (keyword) {
      whereClause.push('(a.username LIKE ? OR a.nickname LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    // 确保status是有效的数字
    if (status !== undefined && status !== '' && !isNaN(parseInt(status))) {
      whereClause.push('a.status = ?');
      params.push(parseInt(status));
    }
    
    // 确保role_id是有效的数字
    if (role_id !== undefined && role_id !== '' && !isNaN(parseInt(role_id))) {
      whereClause.push('a.role_id = ?');
      params.push(parseInt(role_id));
    }
    
    if (whereClause.length > 0) {
      sqlQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 添加排序和分页
    sqlQuery += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(validPageSize, offset);
    
    const admins = await query(sqlQuery, params);
    
    // 获取总条数
    let countQuery = 'SELECT COUNT(*) as total FROM admins a LEFT JOIN roles r ON a.role_id = r.id';
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 对于总条数查询，直接复用params数组，但去掉分页参数
    const countParams = params.slice(0, -2); // 移除最后两个参数(LIMIT和OFFSET)
    
    console.log('Count Query:', countQuery);
    console.log('Count Params:', countParams);
    
    const countResult = await query(countQuery, countParams);
    const total = countResult[0].total;
    
    return res.json(paginatedResponse(admins, total, validPage, validPageSize, '获取管理员列表成功'));
    
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    return res.status(500).json(formatError('获取管理员列表失败，请稍后重试', 500));
  }
}


// 创建管理员
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, password, nickname, email, phone, role_id, status } = req.body;
    
    // 检查参数
    if (!username || !password || !nickname) {
      return res.status(400).json(formatError('用户名、密码和昵称不能为空', 400));
    }
    
    // 检查用户名是否已存在
    const [existingAdmins] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);
    
    if (existingAdmins.length > 0) {
      return res.status(400).json(formatError('用户名已存在', 400));
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const [emailAdmins] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
      
      if (emailAdmins.length > 0) {
        return res.status(400).json(formatError('邮箱已存在', 400));
      }
    }
    
    // 检查手机号是否已存在
    if (phone) {
      const [phoneAdmins] = await pool.execute('SELECT * FROM admins WHERE phone = ?', [phone]);
      
      if (phoneAdmins.length > 0) {
        return res.status(400).json(formatError('手机号已存在', 400));
      }
    }
    
    // 检查角色是否存在
    if (role_id) {
      const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [role_id]);
      
      if (roles.length === 0) {
        return res.status(400).json(formatError('角色不存在', 400));
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建管理员
    const [result] = await pool.execute(
      'INSERT INTO admins (username, password, nickname, email, phone, role_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nickname, email || null, phone || null, role_id || null, status || 1]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '创建管理员', '管理员', result.insertId, { username });
    
    return res.status(201).json(formatSuccess({ id: result.insertId }, '创建管理员成功'));
    
  } catch (error) {
    console.error('创建管理员失败:', error);
    return res.status(500).json(formatError('创建管理员失败，请稍后重试', 500));
  }
});

// 更新管理员
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, email, phone, role_id, status } = req.body;
    
    // 检查参数
    if (!nickname) {
      return res.status(400).json(formatError('昵称不能为空', 400));
    }
    
    // 检查管理员是否存在
    const [admins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [id]);
    
    if (admins.length === 0) {
      return res.status(404).json(formatError('管理员不存在', 404));
    }
    
    const admin = admins[0];
    
    // 检查邮箱是否已存在（排除当前管理员）
    if (email && email !== admin.email) {
      const [emailAdmins] = await pool.execute('SELECT * FROM admins WHERE email = ? AND id != ?', [email, id]);
      
      if (emailAdmins.length > 0) {
        return res.status(400).json(formatError('邮箱已存在', 400));
      }
    }
    
    // 检查手机号是否已存在（排除当前管理员）
    if (phone && phone !== admin.phone) {
      const [phoneAdmins] = await pool.execute('SELECT * FROM admins WHERE phone = ? AND id != ?', [phone, id]);
      
      if (phoneAdmins.length > 0) {
        return res.status(400).json(formatError('手机号已存在', 400));
      }
    }
    
    // 检查角色是否存在
    if (role_id) {
      const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [role_id]);
      
      if (roles.length === 0) {
        return res.status(400).json(formatError('角色不存在', 400));
      }
    }
    
    // 记录更新的字段
    const updateFields = {};
    if (nickname) updateFields.nickname = nickname;
    if (email !== undefined) updateFields.email = email || null;
    if (phone !== undefined) updateFields.phone = phone || null;
    if (role_id !== undefined) updateFields.role_id = role_id || null;
    if (status !== undefined) updateFields.status = status || 1;
    
    // 更新管理员
    await pool.execute(
      'UPDATE admins SET nickname = ?, email = ?, phone = ?, role_id = ?, status = ? WHERE id = ?',
      [nickname, email || null, phone || null, role_id || null, status || 1, id]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '更新管理员', '管理员', id, { updatedFields: Object.keys(updateFields) });
    
    return res.json(formatSuccess(null, '更新管理员成功'));
    
  } catch (error) {
    console.error('更新管理员失败:', error);
    return res.status(500).json(formatError('更新管理员失败，请稍后重试', 500));
  }
});

// 重置管理员密码
router.put('/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // 检查参数
    if (!password) {
      return res.status(400).json(formatError('密码不能为空', 400));
    }
    
    // 检查管理员是否存在
    const [admins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [id]);
    
    if (admins.length === 0) {
      return res.status(404).json(formatError('管理员不存在', 404));
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 更新密码
    await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '重置管理员密码', '管理员', id, {});
    
    return res.json(formatSuccess(null, '密码重置成功'));
    
  } catch (error) {
    console.error('重置密码失败:', error);
    return res.status(500).json(formatError('重置密码失败，请稍后重试', 500));
  }
});

// 删除管理员
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查管理员是否存在
    const [admins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [id]);
    
    if (admins.length === 0) {
      return res.status(404).json({ code: 404, data: null, msg: '管理员不存在' });
    }
    
    const admin = admins[0];
    
    // 检查是否是最后一个超级管理员
    // 首先获取当前管理员的角色信息
    const [roleInfo] = await pool.execute(
      'SELECT r.code FROM roles r WHERE r.id = ?',
      [admin.role_id]
    );
    
    if (roleInfo.length > 0 && roleInfo[0].code === 'super_admin') {
      // 查询所有超级管理员数量
      const [superAdmins] = await pool.execute(
        'SELECT COUNT(*) as count FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE r.code = ?',
        ['super_admin']
      );
      
      if (superAdmins[0].count <= 1) {
        return res.status(400).json({ code: 400, data: null, msg: '不能删除最后一个超级管理员' });
      }
    }
    
    // 删除管理员
    await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除管理员', '管理员', id, {});
    
    return res.json({ code: 200, data: null, msg: '删除管理员成功' });
    
  } catch (error) {
    console.error('删除管理员失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '删除管理员失败，请稍后重试' });
  }
});

// 批量删除管理员
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(formatError('请选择要删除的管理员', 400));
    }
    
    // 检查是否包含超级管理员
    const [superAdmins] = await pool.execute(
      'SELECT a.id, r.code as role_code FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id IN (?)',
      [ids]
    );
    
    const hasSuperAdmin = superAdmins.some(admin => admin.role_code === 'super_admin');
    
    if (hasSuperAdmin) {
      // 检查超级管理员数量
      const [allSuperAdmins] = await pool.execute(
        'SELECT COUNT(*) as count FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE r.code = ?',
        ['super_admin']
      );
      
      if (allSuperAdmins[0].count <= superAdmins.filter(admin => admin.role_code === 'super_admin').length) {
        return res.status(400).json(formatError('不能删除所有超级管理员', 400));
      }
    }
    
    // 删除管理员
    await pool.execute('DELETE FROM admins WHERE id IN (?)', [ids]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '批量删除管理员', '管理员', null, { count: ids.length, ids });
    
    return res.json(formatSuccess(null, '批量删除管理员成功'));
    
  } catch (error) {
    console.error('批量删除管理员失败:', error);
    return res.status(500).json(formatError('批量删除管理员失败，请稍后重试', 500));
  }
});

// 获取角色列表
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    // 确保page和pageSize是有效的数字
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sqlQuery = 'SELECT r.*, (SELECT COUNT(*) FROM admins a WHERE a.role_id = r.id) as user_count FROM roles r';
    const whereClause = [];
    const params = [];
    
    if (keyword) {
      whereClause.push('(r.name LIKE ? OR r.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (whereClause.length > 0) {
      sqlQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    // 添加排序和分页
    sqlQuery += ' ORDER BY r.id ASC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    // 执行查询获取角色列表
    const [roles] = await query(sqlQuery, params);
    
    // 查询总记录数
    let countQuery = 'SELECT COUNT(*) as total FROM roles';
    const countParams = [];
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
      countParams.push(...params.slice(0, -2)); // 排除LIMIT和OFFSET参数
    }
    
    const [countResult] = await query(countQuery, countParams);
    const totalCount = countResult[0].total;
    
    // 返回分页数据
    return res.json(paginatedResponse(roles, totalCount, page, pageSize, '获取角色列表成功'));
    
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return res.status(500).json(formatError('获取角色列表失败，请稍后重试', 500));
  }
});

// 创建角色
router.post('/roles', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // 检查参数
    if (!name) {
      return res.status(400).json(formatError('角色名称不能为空', 400));
    }
    
    // 检查角色是否已存在
    const [existingRoles] = await pool.execute('SELECT * FROM roles WHERE name = ?', [name]);
    
    if (existingRoles.length > 0) {
      return res.status(400).json(formatError('角色名称已存在', 400));
    }
    
    // 创建角色
    const [result] = await pool.execute(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    const roleId = result.insertId;
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '创建角色', '角色', roleId, { name });
    
    return res.status(201).json(formatSuccess({ id: roleId }, '创建角色成功'));
    
  } catch (error) {
    console.error('创建角色失败:', error);
    return res.status(500).json(formatError('创建角色失败，请稍后重试', 500));
  }
});

// 更新角色
router.put('/roles/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // 检查参数
    if (!name) {
      return res.status(400).json(formatError('角色名称不能为空', 400));
    }
    
    // 检查角色是否存在
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json(formatError('角色不存在', 404));
    }
    
    const role = roles[0];
    
    // 检查角色名称是否已存在（排除当前角色）
    if (name !== role.name) {
      const [existingRoles] = await pool.execute('SELECT * FROM roles WHERE name = ? AND id != ?', [name, id]);
      
      if (existingRoles.length > 0) {
        return res.status(400).json(formatError('角色名称已存在', 400));
      }
    }
    
    // 记录更新的字段
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description || '';
    
    // 更新角色
    await pool.execute(
      'UPDATE roles SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '更新角色', '角色', id, { updatedFields: Object.keys(updateFields) });
    
    return res.json(formatSuccess(null, '更新角色成功'));
    
  } catch (error) {
    console.error('更新角色失败:', error);
    return res.status(500).json(formatError('更新角色失败，请稍后重试', 500));
  }
});

// 删除角色
router.delete('/roles/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查角色是否存在
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json(formatError('角色不存在', 404));
    }
    
    // 检查是否是超级管理员角色
    if (roles[0].name === '超级管理员') {
      return res.status(400).json(formatError('不能删除超级管理员角色', 400));
    }
    
    // 检查是否有管理员关联此角色
    const [admins] = await pool.execute('SELECT * FROM admins WHERE role_id = ?', [id]);
    
    if (admins.length > 0) {
      return res.status(400).json(formatError('该角色下有管理员，请先移除关联', 400));
    }
    
    // 删除角色
    await pool.execute('DELETE FROM roles WHERE id = ?', [id]);
    
    // 角色删除后，相关联的role_permissions会通过外键约束自动删除
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除角色', '角色', id, {});
    
    return res.json(formatSuccess(null, '删除角色成功'));
    
  } catch (error) {
    console.error('删除角色失败:', error);
    return res.status(500).json(formatError('删除角色失败，请稍后重试', 500));
  }
});

// 更新角色状态（启用或禁用）
router.put('/roles/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 检查参数
    if (status === undefined || status === null) {
      return res.status(400).json(formatError('状态不能为空', 400));
    }
    
    // 确保status是有效的数字
    const validStatus = parseInt(status);
    if (isNaN(validStatus) || (validStatus !== 0 && validStatus !== 1)) {
      return res.status(400).json(formatError('状态值必须是0（禁用）或1（启用）', 400));
    }
    
    // 检查角色是否存在
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json(formatError('角色不存在', 404));
    }
    
    const role = roles[0];
    
    // 检查是否是超级管理员角色（不允许禁用）
    if (role.code === 'super_admin') {
      return res.status(400).json(formatError('不能禁用超级管理员角色', 400));
    }
    
    // 如果禁用角色，检查是否有管理员关联此角色
    if (validStatus === 0) {
      const [admins] = await pool.execute('SELECT * FROM admins WHERE role_id = ? AND status = 1', [id]);
      
      if (admins.length > 0) {
        return res.status(400).json(formatError('该角色下有活跃的管理员，不允许禁用', 400));
      }
    }
    
    // 更新角色状态
    await pool.execute('UPDATE roles SET status = ? WHERE id = ?', [validStatus, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, `${validStatus === 1 ? '启用' : '禁用'}角色`, '角色', id, { 
      roleName: role.name,
      oldStatus: role.status,
      newStatus: validStatus
    });
    
    return res.json(formatSuccess(null, `角色${validStatus === 1 ? '启用' : '禁用'}成功`));
    
  } catch (error) {
    console.error('更新角色状态失败:', error);
    return res.status(500).json(formatError('更新角色状态失败，请稍后重试', 500));
  }
});

// 获取角色权限
router.get('/roles/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查角色是否存在
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json(formatError('角色不存在', 404));
    }
    
    // 获取所有权限
    const [allPermissions] = await pool.execute('SELECT * FROM permissions ORDER BY id ASC');
    
    // 获取角色已分配的权限
    const [rolePermissions] = await pool.execute(
      'SELECT p.id, p.name, p.description FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [id]
    );
    
    // 标记已分配的权限
    const permissionIds = rolePermissions.map(p => p.id);
    allPermissions.forEach(permission => {
      permission.isAssigned = permissionIds.includes(permission.id);
    });
    
    return res.json(formatSuccess({
      allPermissions,
      assignedPermissions: rolePermissions
    }, '获取角色权限成功'));
    
  } catch (error) {
    console.error('获取角色权限失败:', error);
    return res.status(500).json(formatError('获取角色权限失败，请稍后重试', 500));
  }
});

// 分配角色权限
router.put('/roles/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    
    // 检查参数
    if (!Array.isArray(permissionIds)) {
      return res.status(400).json(formatError('权限ID必须是数组格式', 400));
    }
    
    // 检查角色是否存在
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    
    if (roles.length === 0) {
      return res.status(404).json(formatError('角色不存在', 404));
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 删除原有的权限关联
      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      
      // 插入新的权限关联
      if (permissionIds && permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [id, permissionId]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '分配角色权限', '角色', id, { permissionCount: permissionIds.length, permissionIds });
      
      return res.json(formatSuccess(null, '分配角色权限成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('分配角色权限失败:', error);
    return res.status(500).json(formatError('分配角色权限失败，请稍后重试', 500));
  }
});

// 获取登录日志
router.get('/login-logs', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username, loginStatus, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT * FROM login_logs';
    const whereClause = [];
    const params = [];
    
    if (username) {
      whereClause.push('username LIKE ?');
      params.push(`%${username}%`);
    }
    
    if (loginStatus) {
      whereClause.push('login_status = ?');
      params.push(loginStatus);
    }
    
    if (startDate) {
      whereClause.push('login_time >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause.push('login_time <= ?');
      params.push(endDate + ' 23:59:59');
    }
    
    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }
    
    query += ' ORDER BY login_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const [logs] = await pool.execute(query, params);
    
    // 获取总条数
    let countQuery = 'SELECT COUNT(*) as total FROM login_logs';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const paginatedData = {
      list: logs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    };
    
    return res.json(paginatedResponse(paginatedData, '获取登录日志成功'));
    
  } catch (error) {
    console.error('获取登录日志失败:', error);
    return res.status(500).json(formatError('获取登录日志失败，请稍后重试', 500));
  }
});

// 获取系统操作日志
router.get('/system-logs', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, action, keyword, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT sl.*, a.username FROM system_logs sl LEFT JOIN admins a ON sl.admin_id = a.id';
    const whereClause = [];
    const params = [];
    
    if (action) {
      whereClause.push('sl.action LIKE ?');
      params.push(`%${action}%`);
    }
    
    if (keyword) {
      whereClause.push('(sl.description LIKE ? OR a.username LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (startDate) {
      whereClause.push('sl.created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause.push('sl.created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }
    
    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }
    
    query += ' ORDER BY sl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const [logs] = await pool.execute(query, params);
    
    // 获取总条数
    let countQuery = 'SELECT COUNT(*) as total FROM system_logs sl LEFT JOIN admins a ON sl.admin_id = a.id';
    const countParams = params.slice(0, -2); // 移除LIMIT和OFFSET参数
    
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const paginatedData = {
      list: logs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    };
    
    return res.json(paginatedResponse(paginatedData, '获取系统操作日志成功'));
    
  } catch (error) {
    console.error('获取系统操作日志失败:', error);
    return res.status(500).json(formatError('获取系统操作日志失败，请稍后重试', 500));
  }
});

// 获取单个管理员详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [admins] = await pool.execute(
      'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?',
      [id]
    );
    
    if (admins.length === 0) {
      return res.status(404).json(formatError('管理员不存在', 404));
    }
    
    return res.json(formatSuccess(admins[0], '获取管理员详情成功'));
    
  } catch (error) {
    console.error('获取管理员详情失败:', error);
    return res.status(500).json(formatError('获取管理员详情失败，请稍后重试', 500));
  }
});

// 更新管理员状态（启用或禁用）
router.put('/status/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 检查参数
    if (status === undefined || status === null) {
      return res.status(400).json(formatError('状态不能为空', 400));
    }
    
    // 确保status是有效的数字
    const validStatus = parseInt(status);
    if (isNaN(validStatus) || (validStatus !== 0 && validStatus !== 1)) {
      return res.status(400).json(formatError('状态值必须是0（禁用）或1（启用）', 400));
    }
    
    // 检查管理员是否存在
    const [admins] = await pool.execute('SELECT * FROM admins WHERE id = ?', [id]);
    
    if (admins.length === 0) {
      return res.status(404).json(formatError('管理员不存在', 404));
    }
    
    const admin = admins[0];
    
    // 检查是否是超级管理员
    const [roleInfo] = await pool.execute(
      'SELECT r.code FROM roles r WHERE r.id = ?',
      [admin.role_id]
    );
    
    // 如果是超级管理员，检查是否是最后一个
    if (roleInfo.length > 0 && roleInfo[0].code === 'super_admin') {
      // 查询所有启用的超级管理员数量
      const [enabledSuperAdmins] = await pool.execute(
        'SELECT COUNT(*) as count FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE r.code = ? AND a.status = 1',
        ['super_admin']
      );
      
      // 如果当前要禁用的是最后一个启用的超级管理员，则不允许禁用
      if (validStatus === 0 && enabledSuperAdmins[0].count <= 1 && admin.status === 1) {
        return res.status(400).json(formatError('不能禁用最后一个启用的超级管理员', 400));
      }
    }
    
    // 更新状态
    await pool.execute('UPDATE admins SET status = ? WHERE id = ?', [validStatus, id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, validStatus === 1 ? '启用管理员' : '禁用管理员', '管理员', id, { status: validStatus });
    
    return res.json(formatSuccess(null, validStatus === 1 ? '管理员已启用' : '管理员已禁用'));
    
  } catch (error) {
    console.error('更新管理员状态失败:', error);
    return res.status(500).json(formatError('更新管理员状态失败，请稍后重试', 500));
  }
});

module.exports = router;
