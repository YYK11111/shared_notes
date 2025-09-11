// 缓存管理工具

const { createClient } = require('redis');
const { config } = require('dotenv');

config();

// 内存缓存存储
const memoryCache = new Map();

// Redis客户端配置
let redisClient = null;
let isRedisConnected = false;

// 初始化Redis连接
const initRedisClient = async () => {
  try {
    if (process.env.REDIS_ENABLED === 'true') {
      // 使用Redis 4.x的createClient方法，确保socket选项也正确设置主机和端口
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      
      redisClient = createClient({
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
        socket: {
          host: redisHost,
          port: parseInt(redisPort),
          connectTimeout: 10000 // 10秒连接超时
        }
      });
      
      console.log(`Redis客户端配置: 主机=${redisHost}, 端口=${redisPort}, 数据库=${process.env.REDIS_DB}`);

      // 错误处理
      redisClient.on('error', (error) => {
        console.error('Redis Error:', error);
        isRedisConnected = false;
      });

      // 连接成功
      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });

      redisClient.on('ready', () => {
        console.log('Redis client is ready to use');
        isRedisConnected = true;
      });

      redisClient.on('end', () => {
        console.log('Redis connection ended');
        isRedisConnected = false;
      });

      // 连接到Redis（Redis 4.x需要显式调用connect）
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    isRedisConnected = false;
  }
};

// 生成缓存键
const generateCacheKey = (prefix, key) => {
  return `${prefix}:${key}`;
};

// 缓存配置
const cacheConfig = {
  // 默认缓存过期时间（秒）
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'),
  // 笔记内容缓存时间（秒）
  noteContentTTL: parseInt(process.env.CACHE_NOTE_CONTENT_TTL || '3600'),
  // 分类列表缓存时间（秒）
  categoryListTTL: parseInt(process.env.CACHE_CATEGORY_LIST_TTL || '300'),
  // 热门搜索词缓存时间（秒）
  hotSearchTTL: parseInt(process.env.CACHE_HOT_SEARCH_TTL || '900'),
  // 系统配置缓存时间（秒）
  systemConfigTTL: parseInt(process.env.CACHE_SYSTEM_CONFIG_TTL || '1800')
};

// 安全地执行Redis操作
const safeRedisOperation = async (operation, fallbackValue = null) => {
  if (!process.env.REDIS_ENABLED || !redisClient || !isRedisConnected) {
    return fallbackValue;
  }

  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallbackValue;
  }
};

// 获取缓存
const getCache = async (key) => {
  try {
    // 优先从Redis获取
    const redisValue = await safeRedisOperation(async () => {
      const value = await redisClient.get(key);
      return value;
    });
    
    if (redisValue) {
      try {
        return JSON.parse(redisValue);
      } catch (e) {
        return redisValue;
      }
    }

    // Redis未启用或缓存未命中，从内存缓存获取
    if (memoryCache.has(key)) {
      const cachedItem = memoryCache.get(key);
      // 检查是否过期
      if (cachedItem.expiry > Date.now()) {
        return cachedItem.value;
      } else {
        // 删除过期缓存
        memoryCache.delete(key);
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

// 设置缓存
const setCache = async (key, value, ttl = cacheConfig.defaultTTL) => {
  try {
    // 将值序列化为JSON字符串
    const serializedValue = JSON.stringify(value);
    
    // 设置Redis缓存
    await safeRedisOperation(async () => {
      if (ttl > 0) {
        await redisClient.set(key, serializedValue, {
          EX: ttl
        });
      } else {
        await redisClient.set(key, serializedValue);
      }
    });

    // 设置内存缓存
    if (ttl > 0) {
      memoryCache.set(key, {
        value: value,
        expiry: Date.now() + (ttl * 1000)
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
};

// 删除缓存
const deleteCache = async (key) => {
  try {
    // 删除Redis缓存
    await safeRedisOperation(async () => {
      await redisClient.del(key);
    });

    // 删除内存缓存
    memoryCache.delete(key);

    return true;
  } catch (error) {
    console.error('Error deleting cache:', error);
    return false;
  }
};

// 清除所有缓存
const clearAllCache = async () => {
  try {
    // 清除Redis缓存
    await safeRedisOperation(async () => {
      await redisClient.flushAll();
    });

    // 清除内存缓存
    memoryCache.clear();

    console.log('All cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

// 批量获取缓存
const getMultiCache = async (keys) => {
  try {
    const results = {};

    // 优先从Redis批量获取
    const redisResults = await safeRedisOperation(async () => {
      return await redisClient.mGet(keys);
    }, []);
    
    if (Array.isArray(redisResults)) {
      keys.forEach((key, index) => {
        if (redisResults[index] !== null) {
          try {
            results[key] = JSON.parse(redisResults[index]);
          } catch (e) {
            results[key] = redisResults[index];
          }
        }
      });
    }

    // 检查内存缓存中是否有剩余的键
    keys.forEach(key => {
      if (!results[key] && memoryCache.has(key)) {
        const cachedItem = memoryCache.get(key);
        if (cachedItem.expiry > Date.now()) {
          results[key] = cachedItem.value;
        } else {
          memoryCache.delete(key);
        }
      }
    });

    return results;
  } catch (error) {
    console.error('Error getting multi cache:', error);
    return {};
  }
};

// 批量删除缓存
const deleteMultiCache = async (keys) => {
  try {
    // 批量删除Redis缓存
    await safeRedisOperation(async () => {
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    });

    // 批量删除内存缓存
    keys.forEach(key => {
      memoryCache.delete(key);
    });

    return true;
  } catch (error) {
    console.error('Error deleting multi cache:', error);
    return false;
  }
};

// 笔记相关缓存键生成器
const noteCacheKeys = {
  getNoteById: (id) => generateCacheKey('note', `id:${id}`),
  getNotesByCategory: (categoryId, page, pageSize, sort) => 
    generateCacheKey('note', `category:${categoryId}:page:${page}:size:${pageSize}:sort:${sort}`),
  getHotNotes: () => generateCacheKey('note', 'hot'),
  getRecommendedNotes: (type) => generateCacheKey('note', `recommended:${type}`),
  searchNotes: (keyword, category, timeRange, sort) => 
    generateCacheKey('note', `search:${keyword}:category:${category || 'all'}:time:${timeRange || 'all'}:sort:${sort || 'relevance'}`)
};

// 分类相关缓存键生成器
const categoryCacheKeys = {
  getCategoryList: (includeDisabled = false) => generateCacheKey('category', `list:${includeDisabled ? 'all' : 'active'}`),
  getCategoryById: (id) => generateCacheKey('category', `id:${id}`),
  getCategoryTree: () => generateCacheKey('category', 'tree')
};

// 搜索相关缓存键生成器
const searchCacheKeys = {
  getHotSearchTerms: () => generateCacheKey('search', 'hot_terms'),
  getSearchSuggestions: (keyword) => generateCacheKey('search', `suggestions:${keyword}`)
};

// 系统配置相关缓存键生成器
const configCacheKeys = {
  getSystemConfig: () => generateCacheKey('config', 'system'),
  getThemeConfig: () => generateCacheKey('config', 'theme')
};

// 缓存统计信息
const getCacheStats = () => {
  const stats = {
    memoryCacheSize: memoryCache.size,
    redisEnabled: process.env.REDIS_ENABLED === 'true',
    redisConnected: isRedisConnected,
    cacheConfig: {
      defaultTTL: cacheConfig.defaultTTL,
      noteContentTTL: cacheConfig.noteContentTTL,
      categoryListTTL: cacheConfig.categoryListTTL,
      hotSearchTTL: cacheConfig.hotSearchTTL,
      systemConfigTTL: cacheConfig.systemConfigTTL
    }
  };

  return stats;
};

// 清理过期的内存缓存
const cleanupExpiredCache = () => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, value] of memoryCache.entries()) {
    if (value.expiry < now) {
      memoryCache.delete(key);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} expired cache items`);
  }
};

// 定期清理过期缓存（每小时）
setInterval(cleanupExpiredCache, 3600000);

// 包装带缓存的查询函数
const withCache = async (cacheKey, ttl, queryFn) => {
  try {
    // 尝试从缓存获取数据
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        fromCache: true
      };
    }

    // 缓存未命中，执行查询函数
    const freshData = await queryFn();
    
    // 将结果存入缓存
    if (freshData !== null && freshData !== undefined) {
      await setCache(cacheKey, freshData, ttl);
    }

    return {
      data: freshData,
      fromCache: false
    };
  } catch (error) {
    console.error('Error in withCache:', error);
    
    // 发生错误时，尝试执行查询函数获取数据，不返回缓存结果
    try {
      const freshData = await queryFn();
      return {
        data: freshData,
        fromCache: false
      };
    } catch (queryError) {
      console.error('Query function failed as well:', queryError);
      throw queryError;
    }
  }
};

// 搜索匹配模式的缓存键（使用SCAN而不是KEYS，更安全）
const scanCacheKeys = async (pattern) => {
  try {
    const keys = [];
    
    // 仅在Redis启用且连接时执行
    if (process.env.REDIS_ENABLED === 'true' && redisClient && isRedisConnected) {
      let cursor = '0';
      
      do {
        const reply = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        
        cursor = reply.cursor;
        keys.push(...reply.keys);
      } while (cursor !== '0' && cursor !== 0);
    }
    
    // 同时检查内存缓存中的匹配键
    const memoryKeys = [];
    for (const key of memoryCache.keys()) {
      if (new RegExp(pattern.replace(/\*/g, '.*')).test(key)) {
        memoryKeys.push(key);
      }
    }
    
    return {
      redisKeys: keys,
      memoryKeys: memoryKeys,
      allKeys: [...new Set([...keys, ...memoryKeys])]
    };
  } catch (error) {
    console.error('Error scanning cache keys:', error);
    return {
      redisKeys: [],
      memoryKeys: [],
      allKeys: []
    };
  }
};

// 清除匹配模式的缓存
const clearPatternCache = async (pattern) => {
  try {
    const { allKeys } = await scanCacheKeys(pattern);
    
    if (allKeys.length > 0) {
      await deleteMultiCache(allKeys);
      console.log(`Cleared ${allKeys.length} cache items matching pattern: ${pattern}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing pattern cache:', error);
    return false;
  }
};

module.exports = {
  initRedisClient,
  getCache,
  setCache,
  deleteCache,
  clearAllCache,
  getMultiCache,
  deleteMultiCache,
  noteCacheKeys,
  categoryCacheKeys,
  searchCacheKeys,
  configCacheKeys,
  getCacheStats,
  cleanupExpiredCache,
  withCache,
  generateCacheKey,
  scanCacheKeys,
  clearPatternCache
};