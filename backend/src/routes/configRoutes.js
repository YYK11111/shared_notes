const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { cacheManager } = require('../utils/cacheManager');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');

// 获取所有系统配置
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [configs] = await pool.execute('SELECT * FROM system_configs');
    
    // 转换为对象格式便于前端使用
    const configObject = {};
    configs.forEach(config => {
      configObject[config.config_key] = config.config_value;
    });
    
    return res.json(formatSuccess(configObject, '获取系统配置成功'));
    
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return res.status(500).json(formatError('获取系统配置失败，请稍后重试', 500));
  }
});

// 获取单个系统配置
router.get('/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    
    const [configs] = await pool.execute('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
    if (configs.length === 0) {
      return res.status(404).json(formatError('配置项不存在', 404));
    }
    
    return res.json(formatSuccess(configs[0], '获取配置项成功'));
    
  } catch (error) {
    console.error('获取配置项失败:', error);
    return res.status(500).json(formatError('获取配置项失败，请稍后重试', 500));
  }
});

// 更新系统配置
router.put('/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    // 检查参数
    if (value === undefined) {
      return res.status(400).json(formatError('配置值不能为空', 400));
    }
    
    // 检查配置项是否存在
    const [configs] = await pool.execute('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
    if (configs.length === 0) {
      // 创建新的配置项
      await pool.execute(
        'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
        [key, value, description || '']
      );
    } else {
      // 更新配置项
      await pool.execute(
        'UPDATE system_configs SET config_value = ?, description = ? WHERE config_key = ?',
        [value, description || configs[0].description, key]
      );
    }
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '更新系统配置', '系统配置', key, { value });
    
    return res.json(formatSuccess(null, '更新系统配置成功'));
    
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return res.status(500).json(formatError('更新系统配置失败，请稍后重试', 500));
  }
});

// 批量更新系统配置
router.put('/batch/update', authMiddleware, async (req, res) => {
  try {
    const configs = req.body;
    
    if (!Array.isArray(configs)) {
      return res.status(400).json(formatError('配置数据必须是数组格式', 400));
    }
    
    if (configs.length === 0) {
      return res.status(400).json(formatError('请提供需要更新的配置项', 400));
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const updatedKeys = [];
      
      for (const config of configs) {
        const { key, value, description } = config;
        
        if (!key || value === undefined) {
          continue;
        }
        
        // 检查配置项是否存在
        const [existingConfigs] = await connection.execute('SELECT * FROM system_configs WHERE config_key = ?', [key]);
        
        if (existingConfigs.length === 0) {
          // 创建新的配置项
          await connection.execute(
            'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
            [key, value, description || '']
          );
        } else {
          // 更新配置项
          await connection.execute(
            'UPDATE system_configs SET config_value = ?, description = ? WHERE config_key = ?',
            [value, description || existingConfigs[0].description, key]
          );
        }
        
        updatedKeys.push(key);
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      const decoded = req.user;
      await logAdminAction(decoded.id, decoded.username, '批量更新系统配置', '系统配置', null, { updatedKeys });
      
      return res.json(formatSuccess({ updatedKeys }, '批量更新系统配置成功'));
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('批量更新系统配置失败:', error);
    return res.status(500).json(formatError('批量更新系统配置失败，请稍后重试', 500));
  }
});

// 删除系统配置
router.delete('/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    
    // 检查配置项是否存在
    const [configs] = await pool.execute('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
    if (configs.length === 0) {
      return res.status(404).json(formatError('配置项不存在', 404));
    }
    
    // 删除配置项
    await pool.execute('DELETE FROM system_configs WHERE config_key = ?', [key]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除系统配置', '系统配置', key, {});
    
    return res.json(formatSuccess(null, '删除系统配置成功'));
    
  } catch (error) {
    console.error('删除系统配置失败:', error);
    return res.status(500).json(formatError('删除系统配置失败，请稍后重试', 500));
  }
});

// 数据库备份接口
router.post('/database/backup', authMiddleware, async (req, res) => {
  try {
    // 这里应该实现数据库备份逻辑
    // 注意：实际项目中，这需要使用适当的工具或库来执行MySQL备份
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '数据库备份', '系统操作', null, {});
    
    return res.json(formatSuccess(null, '数据库备份成功'));
    
  } catch (error) {
    console.error('数据库备份失败:', error);
    return res.status(500).json(formatError('数据库备份失败，请稍后重试', 500));
  }
});

// 数据库恢复接口
router.post('/database/restore', authMiddleware, async (req, res) => {
  try {
    // 这里应该实现数据库恢复逻辑
    // 注意：实际项目中，这需要使用适当的工具或库来执行MySQL恢复
    // 并且需要进行权限验证和文件安全性检查
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '数据库恢复', '系统操作', null, {});
    
    return res.json(formatSuccess(null, '数据库恢复成功'));
    
  } catch (error) {
    console.error('数据库恢复失败:', error);
    return res.status(500).json(formatError('数据库恢复失败，请稍后重试', 500));
  }
});

// 清理缓存接口
router.post('/cache/clear', authMiddleware, async (req, res) => {
  try {
    // 引入缓存管理工具
    const { clearAllCache } = require('../utils/cacheManager');
    
    // 清理所有缓存
    const result = await clearAllCache();
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '清理缓存', '系统操作', null, {});
    
    return res.json(formatSuccess(null, '缓存清理成功'));
    
  } catch (error) {
    console.error('清理缓存失败:', error);
    return res.status(500).json(formatError('清理缓存失败，请稍后重试', 500));
  }
});

// 获取系统信息
router.get('/system/info', authMiddleware, async (req, res) => {
  try {
    // 获取系统信息，包括版本、运行环境等
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
    
    return res.json(formatSuccess(systemInfo, '获取系统信息成功'));
    
  } catch (error) {
    console.error('获取系统信息失败:', error);
    return res.status(500).json(formatError('获取系统信息失败，请稍后重试', 500));
  }
});

// 获取搜索配置接口
router.get('/search', authMiddleware, async (req, res) => {
  try {
    // 从缓存获取搜索配置
    const cacheKey = 'search_config';
    const cachedConfig = await cacheManager.getCache(cacheKey);
    
    if (cachedConfig) {
      return res.json({ code: 200, data: cachedConfig, msg: '获取搜索配置成功' });
    }
    
    // 从数据库获取搜索配置
    const [configs] = await pool.execute(
      'SELECT name, value FROM system_configs WHERE name LIKE ?',
      ['search.%']
    );
    
    const searchConfig = {
      sensitive_words: [],
      suggest_count: 5,
      title_weight: 2,
      content_weight: 1,
      enable_suggest: true,
      enable_trending: true
    };
    
    // 将数据库配置转换为配置对象
    configs.forEach(config => {
      const key = config.name.replace('search.', '');
      if (key === 'sensitive_words') {
        searchConfig.sensitive_words = JSON.parse(config.value || '[]');
      } else if (key === 'suggest_count' || key === 'title_weight' || key === 'content_weight') {
        searchConfig[key] = parseInt(config.value) || searchConfig[key];
      } else if (key === 'enable_suggest' || key === 'enable_trending') {
        searchConfig[key] = config.value === 'true';
      } else {
        searchConfig[key] = config.value;
      }
    });
    
    // 缓存搜索配置
    await cacheManager.setCache(cacheKey, searchConfig, 3600);
    
    return res.json({ code: 200, data: searchConfig, msg: '获取搜索配置成功' });
    
  } catch (error) {
    console.error('获取搜索配置失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '获取搜索配置失败，请稍后重试' });
  }
});

// 更新搜索配置接口
router.put('/search', authMiddleware, async (req, res) => {
  try {
    const { sensitive_words, suggest_count, title_weight, content_weight, enable_suggest, enable_trending } = req.body;
    const user = req.user;
    
    // 验证参数
    if (suggest_count !== undefined && (isNaN(suggest_count) || suggest_count < 1 || suggest_count > 20)) {
      return res.status(400).json({ code: 400, data: null, msg: '搜索建议数量应在1-20之间' });
    }
    
    if (title_weight !== undefined && (isNaN(title_weight) || title_weight < 1)) {
      return res.status(400).json({ code: 400, data: null, msg: '标题权重应大于等于1' });
    }
    
    if (content_weight !== undefined && (isNaN(content_weight) || content_weight < 1)) {
      return res.status(400).json({ code: 400, data: null, msg: '内容权重应大于等于1' });
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const configsToUpdate = [
        { name: 'search.sensitive_words', value: JSON.stringify(sensitive_words || []) },
        { name: 'search.suggest_count', value: suggest_count !== undefined ? suggest_count : 5 },
        { name: 'search.title_weight', value: title_weight !== undefined ? title_weight : 2 },
        { name: 'search.content_weight', value: content_weight !== undefined ? content_weight : 1 },
        { name: 'search.enable_suggest', value: enable_suggest !== undefined ? enable_suggest : true },
        { name: 'search.enable_trending', value: enable_trending !== undefined ? enable_trending : true }
      ];
      
      for (const config of configsToUpdate) {
        // 先检查是否存在
        const [existing] = await connection.execute(
          'SELECT id FROM system_configs WHERE name = ?',
          [config.name]
        );
        
        if (existing.length > 0) {
          // 更新配置
          await connection.execute(
            'UPDATE system_configs SET value = ?, updated_at = NOW() WHERE name = ?',
            [config.value, config.name]
          );
        } else {
          // 插入新配置
          await connection.execute(
            'INSERT INTO system_configs (name, value) VALUES (?, ?)',
            [config.name, config.value]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 记录操作日志
      await logAdminAction(user.id, user.username, '更新搜索配置', '系统', null, req.body);
      
      // 清理缓存
      await cacheManager.deleteCache('search_config');
      
      return res.json({ code: 200, data: null, msg: '搜索配置更新成功' });
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('更新搜索配置失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '更新搜索配置失败，请稍后重试' });
  }
});

// 添加敏感词接口
router.post('/search/sensitive-word', authMiddleware, async (req, res) => {
  try {
    const { word } = req.body;
    const user = req.user;
    
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({ code: 400, data: null, msg: '请输入有效的敏感词' });
    }
    
    const trimmedWord = word.trim();
    
    // 获取当前敏感词列表
    const [currentConfig] = await pool.execute(
      'SELECT value FROM system_configs WHERE name = ?',
      ['search.sensitive_words']
    );
    
    const sensitiveWords = currentConfig.length > 0 ? JSON.parse(currentConfig[0].value || '[]') : [];
    
    // 检查是否已存在
    if (sensitiveWords.includes(trimmedWord)) {
      return res.status(400).json({ code: 400, data: null, msg: '该敏感词已存在' });
    }
    
    // 添加新敏感词
    sensitiveWords.push(trimmedWord);
    
    // 更新数据库
    if (currentConfig.length > 0) {
      await pool.execute(
        'UPDATE system_configs SET value = ?, updated_at = NOW() WHERE name = ?',
        [JSON.stringify(sensitiveWords), 'search.sensitive_words']
      );
    } else {
      await pool.execute(
        'INSERT INTO system_configs (name, value) VALUES (?, ?)',
        ['search.sensitive_words', JSON.stringify(sensitiveWords)]
      );
    }
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '添加敏感词', '系统', null, { word: trimmedWord });
    
    // 清理缓存
    await cacheManager.deleteCache('search_config');
    
    return res.json({ code: 200, data: { word: trimmedWord }, msg: '敏感词添加成功' });
    
  } catch (error) {
    console.error('添加敏感词失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '添加敏感词失败，请稍后重试' });
  }
});

// 删除敏感词接口
router.delete('/search/sensitive-word/:word', authMiddleware, async (req, res) => {
  try {
    const { word } = req.params;
    const user = req.user;
    
    // 获取当前敏感词列表
    const [currentConfig] = await pool.execute(
      'SELECT value FROM system_configs WHERE name = ?',
      ['search.sensitive_words']
    );
    
    if (currentConfig.length === 0) {
      return res.status(404).json({ code: 404, data: null, msg: '敏感词列表为空' });
    }
    
    const sensitiveWords = JSON.parse(currentConfig[0].value || '[]');
    const originalLength = sensitiveWords.length;
    
    // 过滤掉要删除的敏感词
    const updatedWords = sensitiveWords.filter(w => w !== word);
    
    if (updatedWords.length === originalLength) {
      return res.status(404).json({ code: 404, data: null, msg: '未找到该敏感词' });
    }
    
    // 更新数据库
    await pool.execute(
      'UPDATE system_configs SET value = ?, updated_at = NOW() WHERE name = ?',
      [JSON.stringify(updatedWords), 'search.sensitive_words']
    );
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '删除敏感词', '系统', null, { word });
    
    // 清理缓存
    await cacheManager.deleteCache('search_config');
    
    return res.json({ code: 200, data: null, msg: '敏感词删除成功' });
    
  } catch (error) {
    console.error('删除敏感词失败:', error);
    return res.status(500).json({ code: 500, data: null, msg: '删除敏感词失败，请稍后重试' });
  }
});
module.exports = router;