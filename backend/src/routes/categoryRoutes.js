const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');

// 获取分类列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 10, parent_id } = req.query;
    
    let query = 'SELECT * FROM categories';
    const params = [];
    let whereClause = '';
    
    // 构建WHERE条件
    if (status !== undefined || keyword) {
      whereClause = ' WHERE';
      
      if (status !== undefined) {
        whereClause += ' status = ?';
        params.push(status);
      }
      
      if (keyword) {
        if (status !== undefined) whereClause += ' AND';
        whereClause += ' name LIKE ?';
        params.push(`%${keyword}%`);
      }
    }
    
    // 添加分页
    const offset = (page - 1) * pageSize;
    
    // 执行查询获取符合条件的所有数据
    const [allCategories] = await pool.execute(query + whereClause + ' ORDER BY priority ASC, id ASC', params);
    
    // 构建分类树函数
    const buildCategoryTree = (categories, parentId = 0) => {
      const tree = [];
      
      categories.forEach(category => {
        if (category.parent_id === parentId) {
          const children = buildCategoryTree(categories, category.id);
          if (children.length > 0) {
            category.children = children;
          }
          tree.push(category);
        }
      });
      
      return tree;
    };
    
    // 构建分类树 - 如果提供了parent_id，则从该parent_id开始构建
    let categoryTree;
    if (parent_id !== undefined && parent_id !== '') {
      const targetParentId = parseInt(parent_id);
      
      // 先检查目标父分类是否存在
      const [parentCategoryCheck] = await pool.execute('SELECT * FROM categories WHERE id = ?', [targetParentId]);
      
      if (parentCategoryCheck.length === 0) {
        // 父分类不存在，返回空数组
        categoryTree = [];
      } else {
        // 构建完整树
        const fullTree = buildCategoryTree(allCategories);
        
        // 找到包含父分类ID的子树
        const findSubtree = (categories, id) => {
          for (const category of categories) {
            if (category.id === id) {
              return [category]; // 包装成数组以便保持一致的返回格式
            }
            if (category.children && category.children.length > 0) {
              const found = findSubtree(category.children, id);
              if (found) {
                return found;
              }
            }
          }
          return null;
        };
        
        categoryTree = findSubtree(fullTree, targetParentId) || [];
      }
    } else {
      // 正常构建分类树
      categoryTree = buildCategoryTree(allCategories);
    }
    
    // 对分类树进行分页
    const paginatedCategories = categoryTree.slice(offset, offset + parseInt(pageSize));
    
    // 获取总数量（不进行分页前的总数）
    const totalCount = categoryTree.length;
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '获取分类列表', '分类', null, { status });
      
      return res.json(formatSuccess({
        list: paginatedCategories,
        total: totalCount
      }, '获取分类列表成功'));
    
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return res.status(500).json(formatError('获取分类列表失败，请稍后重试', 500));
  }
});

// 获取分类详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (categories.length === 0) {
      return res.status(404).json(formatError('分类不存在', 404));
    }
    
    return res.json(formatSuccess(categories[0], '获取分类详情成功'));
    
  } catch (error) {
    console.error('获取分类详情失败:', error);
    return res.status(500).json(formatError('获取分类详情失败，请稍后重试', 500));
  }
});

// 创建分类
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 同时支持驼峰命名和下划线命名的参数，解决前端传递parentId但后端期望parent_id的问题
    const { name, description, parent_id: parentIdFromBody, priority, status, icon, parentId } = req.body;
    const parent_id = parentId || parentIdFromBody;
    
    // 检查参数
    if (!name) {
      return res.status(400).json(formatError('分类名称不能为空', 400));
    }
    
    // 检查父分类是否存在
    if (parent_id && parent_id !== 0) {
      const [parentCategories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [parent_id]);
      
      if (parentCategories.length === 0) {
        return res.status(400).json(formatError('父分类不存在', 400));
      }
    }
    
    // 检查优先级范围
    if (priority && (priority < 1 || priority > 10)) {
      return res.status(400).json(formatError('优先级必须在1-10之间', 400));
    }
    
    // 插入分类
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, parent_id, priority, status, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', parent_id || 0, priority || 10, status || 1, icon || null]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '创建分类', '分类', result.insertId, { name, parent_id, priority });
    
    return res.status(201).json(formatSuccess({ id: result.insertId }, '创建分类成功'));
    
  } catch (error) {
    console.error('创建分类失败:', error);
    return res.status(500).json(formatError('创建分类失败，请稍后重试', 500));
  }
});

// 更新分类
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // 同时支持驼峰命名和下划线命名的参数
    const { name, description, parent_id: parentIdFromBody, priority, status, icon, parentId } = req.body;
    const parent_id = parentId || parentIdFromBody;
    
    // 检查参数
    if (!id || !name) {
      return res.status(400).json(formatError('分类ID和名称不能为空', 400));
    }
    
    // 检查分类是否存在
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (categories.length === 0) {
      return res.status(404).json(formatError('分类不存在', 404));
    }
    
    // 检查父分类是否存在且不是自身或子孙分类
    if (parent_id && parent_id !== 0) {
      if (parent_id === parseInt(id)) {
        return res.status(400).json(formatError('分类不能设置自身为父分类', 400));
      }
      
      // 检查是否存在循环引用
      const hasCircularReference = await checkCircularReference(parent_id, parseInt(id));
      if (hasCircularReference) {
        return res.status(400).json(formatError('分类不能设置自身或子孙分类为父分类', 400));
      }
      
      const [parentCategories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [parent_id]);
      
      if (parentCategories.length === 0) {
        return res.status(400).json(formatError('父分类不存在', 400));
      }
    }
    
    // 检查优先级范围
    if (priority && (priority < 1 || priority > 10)) {
      return res.status(400).json(formatError('优先级必须在1-10之间', 400));
    }
    
    // 更新分类
    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, parent_id = ?, priority = ?, status = ?, icon = ? WHERE id = ?',
      [name, description || '', parent_id || 0, priority || 10, status || 1, icon || null, id]
    );
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '更新分类', '分类', id, { name, parent_id, priority, status });
    
    return res.json(formatSuccess(null, '更新分类成功'));
    
  } catch (error) {
    console.error('更新分类失败:', error);
    return res.status(500).json(formatError('更新分类失败，请稍后重试', 500));
  }
});

// 删除分类
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查分类是否存在
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (categories.length === 0) {
      return res.status(404).json(formatError('分类不存在', 404));
    }
    
    // 检查是否有子分类
    const [subCategories] = await pool.execute('SELECT * FROM categories WHERE parent_id = ?', [id]);
    
    if (subCategories.length > 0) {
      return res.status(400).json(formatError('该分类下存在子分类，请先删除子分类', 400));
    }
    
    // 检查是否有笔记关联
    const [noteCategories] = await pool.execute('SELECT * FROM note_categories WHERE category_id = ?', [id]);
    
    if (noteCategories.length > 0) {
      return res.status(400).json(formatError('该分类下存在笔记，请先移除笔记关联', 400));
    }
    
    // 删除分类
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除分类', '分类', id, {});
    
    return res.json(formatSuccess(null, '删除分类成功'));
    
  } catch (error) {
    console.error('删除分类失败:', error);
    return res.status(500).json(formatError('删除分类失败，请稍后重试', 500));
  }
});

// 获取分类笔记数量统计
router.get('/stats/note-count', authMiddleware, async (req, res) => {
  try {
    const [stats] = await pool.execute(
      'SELECT c.id, c.name, COUNT(nc.note_id) as note_count FROM categories c LEFT JOIN note_categories nc ON c.id = nc.category_id GROUP BY c.id, c.name ORDER BY note_count DESC'
    );
    
    return res.json(formatSuccess(stats, '获取分类统计数据成功'));
    
  } catch (error) {
    console.error('获取分类统计数据失败:', error);
    return res.status(500).json(formatError('获取统计数据失败，请稍后重试', 500));
  }
});

// 检查循环引用
async function checkCircularReference(parentId, targetId) {
  try {
    // 查找parentId的父分类链
    let currentId = parentId;
    while (currentId !== 0) {
      const [parents] = await pool.execute('SELECT parent_id FROM categories WHERE id = ?', [currentId]);
      if (parents.length === 0) break;
      
      currentId = parents[0].parent_id;
      
      // 如果在父链中找到了目标ID，说明存在循环引用
      if (currentId === targetId) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('检查循环引用失败:', error);
    return false;
  }
}

module.exports = router;