// 缓存管理工具

const redis = require('redis');
const { promisify } = require('util');
const { config } = require('dotenv');
const { serverErrorResponse } = require('./responseFormatter');

config();

// 内存缓存存储
const memoryCache = new Map();

// Redis客户端配置
let redisClient = null;
let getAsync = null;
let setAsync = null;
let delAsync = null;
let expireAsync = null;

// 初始化Redis连接
const initRedisClient = async () => {
  try {
    if (process.env.REDIS_ENABLED === 'true') {
      redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0
      });

      // 错误处理
      redisClient.on('error', (error) => {
        console.error('Redis Error:', error);
      });

      // 连接成功
      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });

      // 转换回调风格API为Promise风格
      getAsync = promisify(redisClient.get).bind(redisClient);
      setAsync = promisify(redisClient.set).bind(redisClient);
      delAsync = promisify(redisClient.del).bind(redisClient);
      expireAsync = promisify(redisClient.expire).bind(redisClient);
    }
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
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

// 获取缓存
const getCache = async (key) => {
  try {
    // 优先从Redis获取
    if (process.env.REDIS_ENABLED === 'true' && redisClient && getAsync) {
      const redisValue = await getAsync(key);
      if (redisValue) {
        try {
          return JSON.parse(redisValue);
        } catch (e) {
          return redisValue;
        }
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
    if (process.env.REDIS_ENABLED === 'true' && redisClient && setAsync) {
      await setAsync(key, serializedValue);
      if (ttl > 0) {
        await expireAsync(key, ttl);
      }
    }

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
    if (process.env.REDIS_ENABLED === 'true' && redisClient && delAsync) {
      await delAsync(key);
    }

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
    if (process.env.REDIS_ENABLED === 'true' && redisClient) {
      const flushAllAsync = promisify(redisClient.flushAll).bind(redisClient);
      await flushAllAsync();
    }

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
    if (process.env.REDIS_ENABLED === 'true' && redisClient) {
      const mgetAsync = promisify(redisClient.mget).bind(redisClient);
      const redisResults = await mgetAsync(keys);
      
      keys.forEach((key, index) => {
        if (redisResults[index]) {
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
    if (process.env.REDIS_ENABLED === 'true' && redisClient) {
      const delMultiAsync = promisify(redisClient.del).bind(redisClient);
      await delMultiAsync(keys);
    }

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
  generateCacheKey
};