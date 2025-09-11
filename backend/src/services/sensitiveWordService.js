// 敏感词管理服务

const { query, transaction, executeInTransaction } = require('../../database/dbConfig');
const { getCache, setCache, deleteCache } = require('../utils/cacheManager');

class SensitiveWordService {
  constructor() {
    this.cacheKey = 'sensitive_words';
    this.cacheExpiration = 300; // 5分钟
  }

  /**
   * 获取敏感词列表
   * @returns {Promise<Array>} 敏感词列表
   */
  async getAllSensitiveWords() {
    try {
      // 尝试从缓存获取
      const cachedWords = await getCache(this.cacheKey);
      if (cachedWords) {
        return cachedWords;
      }

      // 从数据库获取敏感词列表
      const words = await query('SELECT id, word, created_at FROM sensitive_words');
      const sensitiveWords = words.map(item => ({
        id: item.id,
        word: item.word,
        created_at: item.created_at
      })).filter(item => item.word && item.word.trim());

      // 缓存敏感词列表
      await setCache(this.cacheKey, sensitiveWords, this.cacheExpiration);

      return sensitiveWords;
    } catch (error) {
      console.error('获取敏感词列表失败:', error);
      throw error;
    }
  }

  /**
   * 添加敏感词
   * @param {string} word - 敏感词
   * @returns {Promise<Object>} 添加的敏感词信息
   */
  async addSensitiveWord(word) {
    try {
      if (!word || typeof word !== 'string' || word.trim().length === 0) {
        throw new Error('请输入有效的敏感词');
      }

      const trimmedWord = word.trim();

      // 检查敏感词是否已存在
      const allWords = await this.getAllSensitiveWords();
      if (allWords.some(item => item.word === trimmedWord)) {
        throw new Error('该敏感词已存在');
      }

      // 添加敏感词到数据库
      await query('INSERT IGNORE INTO sensitive_words (word, created_at) VALUES (?, NOW())', [trimmedWord]);

      // 清除缓存
      await this.clearCache();

      // 获取添加后的敏感词信息
      const updatedWords = await this.getAllSensitiveWords();
      const newWord = updatedWords.find(item => item.word === trimmedWord);

      return newWord;
    } catch (error) {
      console.error('添加敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 删除敏感词
   * @param {string} word - 要删除的敏感词
   * @returns {Promise<boolean>} 删除是否成功
   */
  async removeSensitiveWord(word) {
    try {
      if (!word || typeof word !== 'string' || word.trim().length === 0) {
        throw new Error('敏感词不能为空');
      }

      const trimmedWord = word.trim();

      // 从数据库删除敏感词
      const result = await query('DELETE FROM sensitive_words WHERE word = ?', [trimmedWord]);

      if (result.affectedRows === 0) {
        throw new Error('未找到该敏感词');
      }

      // 清除缓存
      await this.clearCache();

      return true;
    } catch (error) {
      console.error('删除敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新敏感词列表
   * @param {Array<string>} words - 新的敏感词列表
   * @returns {Promise<void>}
   */
  async updateSensitiveWords(words) {
    try {
      // 使用事务处理
      await transaction(async (connection) => {
        // 清空敏感词表
        await executeInTransaction(connection, 'TRUNCATE TABLE sensitive_words');

        // 插入新的敏感词列表
        if (Array.isArray(words) && words.length > 0) {
          const insertPromises = words
            .filter(word => word && typeof word === 'string' && word.trim())
            .map(word => executeInTransaction(connection, 'INSERT IGNORE INTO sensitive_words (word, created_at) VALUES (?, NOW())', [word.trim()]));

          await Promise.all(insertPromises);
        }
      });

      // 清除缓存
      await this.clearCache();
    } catch (error) {
      console.error('更新敏感词列表失败:', error);
      throw error;
    }
  }

  /**
   * 检查文本是否包含敏感词
   * @param {string} text - 要检查的文本
   * @returns {Promise<boolean>} 是否包含敏感词
   */
  async containsSensitiveWords(text) {
    try {
      if (!text || typeof text !== 'string') {
        return false;
      }

      const sensitiveWords = await this.getAllSensitiveWords();

      return sensitiveWords.some(word => {
        if (word && word.word && word.word.trim()) {
          const regex = new RegExp(word.word.trim(), 'gi');
          return regex.test(text);
        }
        return false;
      });
    } catch (error) {
      console.error('检查敏感词失败:', error);
      // 出错时返回false，避免影响主要功能
      return false;
    }
  }

  /**
   * 过滤文本中的敏感词
   * @param {string} text - 要过滤的文本
   * @param {string} replacement - 替换字符
   * @returns {Promise<string>} 过滤后的文本
   */
  async filterSensitiveWords(text, replacement = '*') {
    try {
      if (!text || typeof text !== 'string') {
        return text;
      }

      const sensitiveWords = await this.getAllSensitiveWords();
      let filteredText = text;

      sensitiveWords.forEach(word => {
        if (word && word.word && word.word.trim()) {
          const regex = new RegExp(word.word.trim(), 'gi');
          const replaceChars = replacement.repeat(word.word.length);
          filteredText = filteredText.replace(regex, replaceChars);
        }
      });

      return filteredText;
    } catch (error) {
      console.error('过滤敏感词失败:', error);
      // 出错时返回原文本
      return text;
    }
  }

  /**
   * 清除缓存
   * @private
   */
  async clearCache() {
    try {
      await deleteCache(this.cacheKey);
      await deleteCache('search_config');
    } catch (error) {
      console.error('清除敏感词缓存失败:', error);
    }
  }
}

module.exports = new SensitiveWordService();