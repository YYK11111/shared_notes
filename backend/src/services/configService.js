const { pool } = require('../database/db');
const { getCache, setCache, deleteCache } = require('../utils/cacheManager');

// 配置缓存键前缀
const CONFIG_CACHE_PREFIX = 'config_';
// 配置缓存有效期（秒）
const CONFIG_CACHE_TTL = 3600;

/**
 * 获取单个配置项
 * @param {string} key - 配置键名
 * @param {*} defaultValue - 默认值
 * @returns {Promise<*>} - 配置值
 */
async function getConfig(key, defaultValue = null) {
  try {
    // 尝试从缓存获取
    const cacheKey = `${CONFIG_CACHE_PREFIX}${key}`;
    const cachedValue = await getCache(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // 从数据库获取
    const [rows] = await pool.execute(
      'SELECT config_value FROM system_configs WHERE config_key = ?',
      [key]
    );

    // 如果配置不存在，返回默认值
    if (rows.length === 0) {
      return defaultValue;
    }

    // 缓存配置值
    await setCache(cacheKey, rows[0].config_value, CONFIG_CACHE_TTL);

    return rows[0].config_value;
  } catch (error) {
    console.error('获取配置失败:', error);
    // 出错时返回默认值
    return defaultValue;
  }
}

/**
 * 获取多个配置项
 * @param {string[]} keys - 配置键名数组
 * @returns {Promise<object>} - 配置对象
 */
async function getConfigs(keys) {
  try {
    const configs = {};
    const uncachedKeys = [];

    // 先尝试从缓存获取
    for (const key of keys) {
      const cacheKey = `${CONFIG_CACHE_PREFIX}${key}`;
      const cachedValue = await getCache(cacheKey);
      if (cachedValue !== null) {
        configs[key] = cachedValue;
      } else {
        uncachedKeys.push(key);
      }
    }

    // 如果有未缓存的配置，从数据库获取
    if (uncachedKeys.length > 0) {
      const placeholders = uncachedKeys.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT config_key, config_value FROM system_configs WHERE config_key IN (${placeholders})`,
        uncachedKeys
      );

      // 更新缓存并添加到结果中
      for (const row of rows) {
        const cacheKey = `${CONFIG_CACHE_PREFIX}${row.config_key}`;
        await setCache(cacheKey, row.config_value, CONFIG_CACHE_TTL);
        configs[row.config_key] = row.config_value;
      }
    }

    return configs;
  } catch (error) {
    console.error('批量获取配置失败:', error);
    // 出错时返回空对象
    return {};
  }
}

/**
 * 获取文件上传相关配置
 * @returns {Promise<object>} - 文件上传配置对象
 */
async function getFileUploadConfig() {
  const keys = [
    'file.max_size',
    'file.max_size_bytes',
    'file.allowed_types',
    'file.max_count',
    'file.enable',
    'file.storage_path'
  ];

  const configs = await getConfigs(keys);

  // 解析配置值并提供默认值
  // 优先使用file.max_size_bytes，如果不存在则使用file.max_size转换为字节
  const maxSizeMB = parseInt(configs['file.max_size']) || 5;
  const maxSizeBytes = parseInt(configs['file.max_size_bytes']) || (maxSizeMB * 1024 * 1024);
  
  return {
    // 文件最大大小（字节）
    maxSize: maxSizeBytes,
    // 文件最大大小（MB）
    maxSizeMB: maxSizeMB,
    // 允许的文件类型数组
    allowedTypes: configs['file.allowed_types'] ? 
      JSON.parse(configs['file.allowed_types']) : 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    // 最大文件数量
    maxCount: parseInt(configs['file.max_count']) || 5,
    // 是否启用文件上传
    enable: parseInt(configs['file.enable']) !== 0,
    // 文件存储路径
    storagePath: configs['file.storage_path'] || 'uploads'
  };
}

/**
 * 清理配置缓存
 * @param {string} key - 配置键名，可选，不提供则清理所有配置缓存
 */
async function clearConfigCache(key = null) {
  try {
    if (key) {
      const cacheKey = `${CONFIG_CACHE_PREFIX}${key}`;
      await deleteCache(cacheKey);
    } else {
      // 清理所有配置缓存
      // 注意：这里只是概念实现，实际需要根据缓存实现方式调整
      await deleteCache('config_*');
    }
  } catch (error) {
    console.error('清理配置缓存失败:', error);
  }
}

module.exports = {
  getConfig,
  getConfigs,
  getFileUploadConfig,
  clearConfigCache
};