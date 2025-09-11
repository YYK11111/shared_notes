const { pool, query } = require('../database/db');
const { getCache, setCache, deleteCache, clearPatternCache } = require('../utils/cacheManager');
const xss = require('xss');
const sensitiveWordService = require('./sensitiveWordService');

class SearchService {
  constructor() {
    this.cachePrefix = 'search';
    this.defaultPageSize = 10;
    this.maxPageSize = 50;
  }

  /**
   * 执行搜索操作
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页条数
   * @param {string} params.sortBy - 排序方式
   * @param {string} params.categoryIds - 分类ID列表
   * @param {string} params.timeRange - 时间范围
   * @param {boolean} params.useIndex - 是否使用索引
   * @returns {Promise<Object>} 搜索结果
   */
  async search(params) {
    const {
      keyword,
      page = 1,
      pageSize = this.defaultPageSize,
      sortBy = 'relevance',
      categoryIds,
      timeRange,
      useIndex = true
    } = params;

    // 参数验证
    if (!keyword || keyword.trim() === '') {
      throw new Error('搜索关键词不能为空');
    }

    const safeKeyword = xss(keyword.trim());
    const normalizedPage = Math.max(1, parseInt(page));
    const normalizedPageSize = Math.min(this.maxPageSize, Math.max(1, parseInt(pageSize)));
    const offset = (normalizedPage - 1) * normalizedPageSize;

    // 检查搜索配置
    const searchConfig = await this.getSearchConfig();

    // 敏感词检查
    const hasSensitiveWord = await sensitiveWordService.containsSensitiveWords(safeKeyword);
    if (hasSensitiveWord) {
      return {
        list: [],
        total: 0,
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalPages: 0,
        recommendedNotes: []
      };
    }

    // 记录搜索日志
    this.logSearch(safeKeyword).catch(err => {
      console.error('记录搜索日志失败:', err);
    });

    // 使用缓存键
    const cacheKey = this.generateSearchCacheKey(safeKeyword, normalizedPage, normalizedPageSize, sortBy, categoryIds, timeRange);

    // 尝试从缓存获取结果
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 执行搜索查询
    let searchResult;
    try {
      // 检查索引是否可用
      const indexStatus = await this.getIndexStatus();
      
      if (useIndex && indexStatus.index_exists) {
        searchResult = await this.searchWithIndex(safeKeyword, normalizedPage, normalizedPageSize, sortBy, categoryIds, timeRange, searchConfig);
      } else {
        searchResult = await this.searchWithLike(safeKeyword, normalizedPage, normalizedPageSize, sortBy, categoryIds, timeRange, searchConfig);
      }

      // 缓存搜索结果
      await setCache(cacheKey, searchResult, 300); // 缓存5分钟

      return searchResult;
    } catch (error) {
      console.error('搜索执行失败:', error);
      throw error;
    }
  }

  /**
   * 使用全文索引搜索
   */
  async searchWithIndex(keyword, page, pageSize, sortBy, categoryIds, timeRange, searchConfig) {
    const offset = (page - 1) * pageSize;
    const params = [keyword, keyword];

    // 构建基础查询
    let queryStr = `
      SELECT 
        n.id, n.title, n.content, n.cover_image, n.views, n.created_at, 
        c.name as category_name,
        MATCH(n.title, n.content) AGAINST(?) AS relevance_score
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 
      AND MATCH(n.title, n.content) AGAINST(? IN NATURAL LANGUAGE MODE)
    `;

    // 添加分类筛选
    if (categoryIds) {
      const ids = categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        queryStr += ' AND nc.category_id IN (?)';
        params.push(ids);
      }
    }

    // 添加时间范围筛选
    if (timeRange === '30days') {
      queryStr += ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (timeRange === '90days') {
      queryStr += ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // 添加搜索屏蔽检查
    queryStr += ' AND n.id NOT IN (SELECT note_id FROM search_blocked_notes)';

    // 确定排序方式
    let orderBy = 'relevance_score DESC';
    if (sortBy === 'newest') {
      orderBy = 'n.created_at DESC';
    } else if (sortBy === 'mostViewed') {
      orderBy = 'n.views DESC';
    }

    // 应用权重配置
    if (sortBy === 'relevance' && searchConfig.title_weight !== 1 && searchConfig.content_weight !== 1) {
      queryStr = queryStr.replace(
        'MATCH(n.title, n.content) AGAINST(?) AS relevance_score',
        `(MATCH(n.title) AGAINST(?) * ${searchConfig.title_weight} + MATCH(n.content) AGAINST(?) * ${searchConfig.content_weight}) AS relevance_score`
      );
      params.splice(2, 0, keyword); // 插入额外的关键词参数
    }

    queryStr += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [notes] = await query(queryStr, params);

    // 获取总条数
    const countQuery = `
      SELECT COUNT(*) as total FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      WHERE n.status = 1 
      AND MATCH(n.title, n.content) AGAINST(? IN NATURAL LANGUAGE MODE)
    ` + (categoryIds ? ' AND nc.category_id IN (?)' : '') + 
      (timeRange === '30days' ? ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)' : '') + 
      (timeRange === '90days' ? ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)' : '') + 
      ' AND n.id NOT IN (SELECT note_id FROM search_blocked_notes)';
    
    const countParams = [keyword].concat(categoryIds ? [params[2]] : []);
    const [countResult] = await query(countQuery, countParams);
    const total = countResult[0].total;

    // 高亮关键词和生成摘要
    const processedNotes = this.processSearchResults(notes, keyword);

    // 如果没有搜索结果，推荐热门笔记
    let recommendedNotes = [];
    if (total === 0) {
      recommendedNotes = await this.getRecommendedNotes(5);
    }

    return {
      list: processedNotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      recommendedNotes
    };
  }

  /**
   * 使用LIKE查询搜索（备用方案）
   */
  async searchWithLike(keyword, page, pageSize, sortBy, categoryIds, timeRange, searchConfig) {
    const offset = (page - 1) * pageSize;
    const params = [`%${keyword}%`, `%${keyword}%`];

    // 构建基础查询
    let queryStr = `
      SELECT 
        n.id, n.title, n.content, n.cover_image, n.views, n.created_at, 
        c.name as category_name
      FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      LEFT JOIN categories c ON nc.category_id = c.id 
      WHERE n.status = 1 
      AND (n.title LIKE ? OR n.content LIKE ?)
    `;

    // 添加分类筛选
    if (categoryIds) {
      const ids = categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        queryStr += ' AND nc.category_id IN (?)';
        params.push(ids);
      }
    }

    // 添加时间范围筛选
    if (timeRange === '30days') {
      queryStr += ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (timeRange === '90days') {
      queryStr += ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // 添加搜索屏蔽检查
    queryStr += ' AND n.id NOT IN (SELECT note_id FROM search_blocked_notes)';

    // 确定排序方式并应用权重配置
    let orderBy = 'CASE WHEN n.title LIKE ? THEN 1 ELSE 2 END, n.created_at DESC';
    params.push(`%${keyword}%`); // 用于标题权重

    if (sortBy === 'newest') {
      orderBy = 'n.created_at DESC';
    } else if (sortBy === 'mostViewed') {
      orderBy = 'n.views DESC';
    }

    queryStr += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [notes] = await query(queryStr, params);

    // 获取总条数
    const countQuery = `
      SELECT COUNT(DISTINCT n.id) as total FROM notes n 
      LEFT JOIN note_categories nc ON n.id = nc.note_id 
      WHERE n.status = 1 
      AND (n.title LIKE ? OR n.content LIKE ?)
    ` + (categoryIds ? ' AND nc.category_id IN (?)' : '') + 
      (timeRange === '30days' ? ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)' : '') + 
      (timeRange === '90days' ? ' AND n.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)' : '') + 
      ' AND n.id NOT IN (SELECT note_id FROM search_blocked_notes)';
    
    const countParams = params.slice(0, -3); // 移除排序、LIMIT和OFFSET参数
    const [countResult] = await query(countQuery, countParams);
    const total = countResult[0].total;

    // 高亮关键词和生成摘要
    const processedNotes = this.processSearchResults(notes, keyword);

    // 如果没有搜索结果，推荐热门笔记
    let recommendedNotes = [];
    if (total === 0) {
      recommendedNotes = await this.getRecommendedNotes(5);
    }

    return {
      list: processedNotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      recommendedNotes
    };
  }

  /**
   * 处理搜索结果：高亮关键词和生成摘要
   */
  processSearchResults(notes, keyword) {
    return notes.map(note => {
      // 高亮标题中的关键词
      if (note.title.includes(keyword)) {
        note.highlightedTitle = note.title.replace(
          new RegExp(keyword, 'gi'),
          match => `<mark>${match}</mark>`
        );
      } else {
        note.highlightedTitle = note.title;
      }

      // 生成摘要
      if (note.content) {
        const plainContent = note.content.replace(/<[^>]*>/g, '');
        const keywordIndex = plainContent.toLowerCase().indexOf(keyword.toLowerCase());
        let summary = plainContent.slice(0, 100);

        if (keywordIndex >= 0) {
          const start = Math.max(0, keywordIndex - 30);
          const end = Math.min(plainContent.length, keywordIndex + 70);
          summary = (start > 0 ? '...' : '') + 
                    plainContent.slice(start, end).replace(
                      new RegExp(keyword, 'gi'),
                      match => `<mark>${match}</mark>`
                    ) + 
                    (end < plainContent.length ? '...' : '');
        }
        note.summary = summary;
      }

      return note;
    });
  }

  /**
   * 获取搜索配置
   */
  async getSearchConfig() {
    const cacheKey = 'search_config';
    
    // 尝试从缓存获取
    const cachedConfig = await getCache(cacheKey);
    if (cachedConfig) {
      return cachedConfig;
    }

    // 从数据库获取搜索配置
    const [configs] = await query(
      'SELECT config_key, config_value FROM system_configs WHERE config_key LIKE ?',
      ['search.%']
    );
    
    const defaultConfig = {
      suggest_count: 5,
      title_weight: 2,
      content_weight: 1,
      enable_suggest: true,
      enable_trending: true
    };
    
    // 将数据库配置转换为配置对象
    configs.forEach(config => {
      const key = config.config_key.replace('search.', '');
      if (key === 'suggest_count' || key === 'title_weight' || key === 'content_weight') {
        defaultConfig[key] = parseInt(config.config_value) || defaultConfig[key];
      } else if (key === 'enable_suggest' || key === 'enable_trending') {
        defaultConfig[key] = config.config_value === 'true';
      } else {
        defaultConfig[key] = config.config_value;
      }
    });

    // 缓存搜索配置
    await setCache(cacheKey, defaultConfig, 3600);

    return defaultConfig;
  }

  /**
   * 获取索引状态
   */
  async getIndexStatus() {
    const cacheKey = 'search_index_status';
    
    // 尝试从缓存获取
    const cachedStatus = await getCache(cacheKey);
    if (cachedStatus) {
      return cachedStatus;
    }

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
    
    const status = {
      index_exists: indexCheck[0].index_exists > 0,
      indexed_count: indexCount[0].count,
      total_active_notes: noteCount[0].count,
      index_coverage: (indexCount[0].count / Math.max(1, noteCount[0].count) * 100).toFixed(2) + '%'
    };

    // 缓存索引状态
    await setCache(cacheKey, status, 300);

    return status;
  }

  /**
   * 记录搜索日志
   */
  async logSearch(keyword) {
    try {
      await pool.execute(
        'INSERT INTO search_logs (keyword, search_time) VALUES (?, NOW())',
        [keyword]
      );
      
      // 清理相关缓存
      await deleteCache('hot_search_keywords');
    } catch (error) {
      console.error('记录搜索日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取推荐笔记
   */
  async getRecommendedNotes(limit = 5) {
    const cacheKey = `recommended_notes_${limit}`;
    
    // 尝试从缓存获取
    const cachedNotes = await getCache(cacheKey);
    if (cachedNotes) {
      return cachedNotes;
    }

    const [notes] = await query(
      'SELECT n.id, n.title, n.cover_image, n.views, n.created_at, c.name as category_name FROM notes n LEFT JOIN note_categories nc ON n.id = nc.note_id LEFT JOIN categories c ON nc.category_id = c.id WHERE n.status = 1 ORDER BY n.views DESC LIMIT ?',
      [limit]
    );

    // 缓存推荐笔记
    await setCache(cacheKey, notes, 1800);

    return notes;
  }

  /**
   * 生成搜索缓存键
   */
  generateSearchCacheKey(keyword, page, pageSize, sortBy, categoryIds, timeRange) {
    return `${this.cachePrefix}:${keyword}:${page}:${pageSize}:${sortBy}:${categoryIds || 'all'}:${timeRange || 'all'}`;
  }

  /**
   * 清理搜索相关缓存
   */
  async clearSearchCache() {
    try {
      // 使用clearPatternCache清理所有与搜索相关的缓存键
      // 1. 清理所有以search:开头的搜索结果缓存
      await clearPatternCache(`${this.cachePrefix}:*`);
      
      // 2. 清理特定的搜索相关缓存键
      await deleteCache('search_config');
      await deleteCache('search_index_status');
      await deleteCache('hot_search_keywords');
      
      // 3. 清理搜索建议相关缓存
      await clearPatternCache('search:suggestions:*');
      
      // 4. 清理搜索日志相关缓存
      await clearPatternCache('search:log:*');
      
      console.log('搜索相关缓存清理完成');
    } catch (error) {
      console.error('清理搜索缓存失败:', error);
      // 即使出现错误，也不抛出异常，继续执行后续逻辑
    }
  }

  /**
   * 更新搜索配置
   * @param {Object} configData - 配置数据
   * @param {Array} configData.sensitive_words - 敏感词列表
   * @param {number} configData.suggest_count - 搜索建议数量
   * @param {number} configData.title_weight - 标题权重
   * @param {number} configData.content_weight - 内容权重
   * @param {boolean} configData.enable_suggest - 是否启用搜索建议
   * @param {boolean} configData.enable_trending - 是否启用热门搜索
   * @returns {Promise<void>}
   */
  async updateSearchConfig(configData) {
    const { sensitive_words, suggest_count, title_weight, content_weight, enable_suggest, enable_trending } = configData;

    // 验证参数
    if (suggest_count !== undefined && (isNaN(suggest_count) || suggest_count < 1 || suggest_count > 20)) {
      throw new Error('搜索建议数量应在1-20之间');
    }
    
    if (title_weight !== undefined && (isNaN(title_weight) || title_weight < 1)) {
      throw new Error('标题权重应大于等于1');
    }
    
    if (content_weight !== undefined && (isNaN(content_weight) || content_weight < 1)) {
      throw new Error('内容权重应大于等于1');
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 处理敏感词更新（如果提供了）
      if (sensitive_words !== undefined) {
        await connection.execute('TRUNCATE TABLE sensitive_words');
        
        if (Array.isArray(sensitive_words) && sensitive_words.length > 0) {
          const insertPromises = sensitive_words
            .filter(word => word && typeof word === 'string' && word.trim())
            .map(word => connection.execute('INSERT IGNORE INTO sensitive_words (word) VALUES (?)', [word.trim()]));
          
          await Promise.all(insertPromises);
        }
      }
      
      // 更新其他搜索配置
      const configsToUpdate = [
        { config_key: 'search.suggest_count', config_value: suggest_count !== undefined ? suggest_count : 5 },
        { config_key: 'search.title_weight', config_value: title_weight !== undefined ? title_weight : 2 },
        { config_key: 'search.content_weight', config_value: content_weight !== undefined ? content_weight : 1 },
        { config_key: 'search.enable_suggest', config_value: enable_suggest !== undefined ? enable_suggest : true },
        { config_key: 'search.enable_trending', config_value: enable_trending !== undefined ? enable_trending : true }
      ];
      
      for (const config of configsToUpdate) {
        // 先检查是否存在
        const [existing] = await connection.execute(
          'SELECT id FROM system_configs WHERE config_key = ?',
          [config.config_key]
        );
        
        if (existing.length > 0) {
          // 更新配置
          await connection.execute(
            'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
            [config.config_value, config.config_key]
          );
        } else {
          // 插入新配置
          await connection.execute(
            'INSERT INTO system_configs (config_key, config_value) VALUES (?, ?)',
            [config.config_key, config.config_value]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 清理缓存
      await deleteCache('search_config');
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

}

module.exports = new SearchService();