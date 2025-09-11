const express = require('express');
const router = express.Router();
const { query, transaction, executeInTransaction } = require('../../database/dbConfig');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { deleteCache, getCache, setCache } = require('../utils/cacheManager');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');



// 获取首页配置接口
router.get('/home', authMiddleware, async (req, res) => {
  try {
    // 从缓存获取首页配置
    const cacheKey = 'home_config';
    const cachedConfig = await getCache(cacheKey);
    
    if (cachedConfig) {
      return res.json({ code: 200, data: cachedConfig, msg: '获取首页配置成功' });
    }
    
    // 从数据库获取首页配置
    const configs = await query(
      'SELECT config_key, config_value FROM system_configs WHERE config_key LIKE ?',
      ['homepage.%']
    );
    
    const homeConfig = {
      carousel_count: 3,
      recommended_notes_count: 6,
      latest_notes_count: 10,
      hot_categories_count: 5,
      hot_notes_count: 8
    };
    
    // 将数据库配置转换为配置对象
    configs.forEach(config => {
      const key = config.config_key.replace('homepage.', '');
      if (key in homeConfig) {
        homeConfig[key] = parseInt(config.config_value) || homeConfig[key];
      }
    });
    
    // 设置缓存
    await setCache(cacheKey, homeConfig, 3600);
    
    return res.json({ code: 200, data: homeConfig, msg: '获取首页配置成功' });
    
  } catch (error) {
    console.error('获取首页配置失败:', error);
    return res.status(500).json(formatError('获取首页配置失败，请稍后重试', 500));
  }
});

// 更新首页配置接口
router.put('/home', authMiddleware, async (req, res) => {
  try {
    const { carousel_count, recommended_notes_count, latest_notes_count, hot_categories_count, hot_notes_count } = req.body;
    const user = req.user;
    
    // 验证参数
    const paramsToValidate = {
      carousel_count,
      recommended_notes_count,
      latest_notes_count,
      hot_categories_count,
      hot_notes_count
    };
    
    for (const [key, value] of Object.entries(paramsToValidate)) {
      if (value !== undefined && (typeof value !== 'number' || value < 0)) {
        return res.status(400).json(formatError(`${key}必须是大于等于0的数字`, 400));
      }
    }
    
    // 使用dbConfig.js提供的事务处理方法
    await transaction(async (connection) => {
      // 更新或创建配置项
      const configMap = {
        'homepage.carousel_count': carousel_count,
        'homepage.recommended_notes_count': recommended_notes_count,
        'homepage.latest_notes_count': latest_notes_count,
        'homepage.hot_categories_count': hot_categories_count,
        'homepage.hot_notes_count': hot_notes_count
      };
      
      for (const [key, value] of Object.entries(configMap)) {
        if (value !== undefined) {
          const [existingConfigs] = await executeInTransaction(connection, 'SELECT * FROM system_configs WHERE config_key = ?', [key]);
          
          if (existingConfigs.length === 0) {
            await executeInTransaction(connection,
              'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
              [key, value.toString(), '首页配置']
            );
          } else {
            await executeInTransaction(connection,
              'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
              [value.toString(), key]
            );
          }
        }
      }
      
      // 记录操作日志
      await logAdminAction(user.id, user.username, '更新首页配置', '系统', null, req.body);
      
      // 清理缓存
      await deleteCache('home_config');
    });
    
    // 事务成功完成后返回响应
    return res.json({ code: 200, data: null, msg: '首页配置更新成功' });
    
  } catch (error) {
    console.error('更新首页配置失败:', error);
    return res.status(500).json(formatError('更新首页配置失败，请稍后重试', 500));
  }
});

// 搜索相关接口已移至 searchService.js 中实现
// 请在 searchRoutes.js 中调用相应的服务方法


// 获取文件上传配置接口
router.get('/file-upload', authMiddleware, async (req, res) => {
  try {
    // 引入文件上传配置服务
    const { getFileUploadConfig } = require('../services/configService');
    
    // 获取文件上传配置
    const config = await getFileUploadConfig();
    
    return res.json(formatSuccess(config, '获取文件上传配置成功'));
    
  } catch (error) {
    console.error('获取文件上传配置失败:', error);
    return res.status(500).json(formatError('获取文件上传配置失败，请稍后重试', 500));
  }
});

// 更新文件上传配置接口
router.post('/file-upload/update', authMiddleware, async (req, res) => {
  try {
    const configData = req.body;
    const user = req.user;
    
    // 使用dbConfig.js提供的事务处理方法
    await transaction(async (connection) => {
      // 配置映射，用于保存到数据库
      const configMap = {
        'file.max_size': configData.max_size,
        'file.max_size_bytes': configData.max_size_bytes,
        'file.allowed_types': JSON.stringify(configData.allowed_types || []),
        'file.max_count': configData.max_count,
        'file.enable': configData.enable,
        'file.storage_path': configData.storage_path
      };
      
      // 更新或创建配置项
      for (const [key, value] of Object.entries(configMap)) {
        if (value !== undefined) {
          const [existingConfigs] = await executeInTransaction(connection, 'SELECT * FROM system_configs WHERE config_key = ?', [key]);
          
          if (existingConfigs.length === 0) {
            await connection.execute(
              'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
              [key, value.toString(), '文件上传配置']
            );
          } else {
            await executeInTransaction(connection, 
              'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
              [value.toString(), key]
            );
          }
        }
      }
      
      // 记录操作日志
      await logAdminAction(user.id, user.username, '更新文件上传配置', '系统配置', null, configData);
      
      // 清理相关缓存
      const { clearConfigCache } = require('../services/configService');
      await clearConfigCache('file.max_size');
      await clearConfigCache('file.max_size_bytes');
      await clearConfigCache('file.allowed_types');
      await clearConfigCache('file.max_count');
      await clearConfigCache('file.enable');
      await clearConfigCache('file.storage_path');
    });
    
    // 事务成功完成后返回响应
    return res.json(formatSuccess(null, '文件上传配置更新成功'));
    
  } catch (error) {
    console.error('更新文件上传配置失败:', error);
    return res.status(500).json(formatError('更新文件上传配置失败，请稍后重试', 500));
  }
});


// 获取所有系统配置
router.get('/', authMiddleware, async (req, res) => {
  try {
// 获取所有系统配置
    const configs = await query('SELECT * FROM system_configs');
    
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
    
    const configs = await query('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
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
    const configs = await query('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
    if (configs.length === 0) {
      // 创建新的配置项
      await query(
        'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
        [key, value, description || '']
      );
    } else {
      // 更新配置项
      await query(
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
    
    // 使用dbConfig.js提供的事务处理方法
    const updatedKeys = await transaction(async (connection) => {
      const keys = [];
      
      for (const config of configs) {
        const { key, value, description } = config;
        
        if (!key || value === undefined) {
          continue;
        }
        
        // 检查配置项是否存在
        const [existingConfigs] = await executeInTransaction(connection, 'SELECT * FROM system_configs WHERE config_key = ?', [key]);
        
        if (existingConfigs.length === 0) {
          // 创建新的配置项
          await executeInTransaction(connection,
            'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
            [key, value, description || '']
          );
        } else {
          // 更新配置项
          await executeInTransaction(connection,
            'UPDATE system_configs SET config_value = ?, description = ? WHERE config_key = ?',
            [value, description || existingConfigs[0].description, key]
          );
        }
        
        keys.push(key);
      }
      
      return keys;
    });
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '批量更新系统配置', '系统配置', null, { updatedKeys });
    
    return res.json(formatSuccess({ updatedKeys }, '批量更新系统配置成功'));
    
  } catch (error) {
    console.error('批量更新系统配置失败:', error);
    return res.status(500).json(formatError('批量更新系统配置失败，请稍后重试', 500));
  }
});

// 删除系统配置
router.delete('/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    
    // 获取单个系统配置
    const configs = await query('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    
    if (configs.length === 0) {
      return res.status(404).json(formatError('配置项不存在', 404));
    }
    
    // 删除配置项
    await query('DELETE FROM system_configs WHERE config_key = ?', [key]);
    
    // 记录操作日志
    const decoded = req.user;
    await logAdminAction(decoded.id, decoded.username, '删除系统配置', '系统配置', key, {});
    
    return res.json(formatSuccess(null, '删除系统配置成功'));
    
  } catch (error) {
    console.error('删除系统配置失败:', error);
    return res.status(500).json(formatError('删除系统配置失败，请稍后重试', 500));
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


module.exports = router;