/**
 * 存储服务
 * 提供统一的本地存储管理功能，包括localStorage、sessionStorage的封装
 */

// 存储类型常量
export const STORAGE_TYPES = {
  LOCAL: 'local',
  SESSION: 'session'
};

/**
 * 基础存储类
 */
class BaseStorage {
  constructor(type) {
    this.type = type;
    this.storage = type === STORAGE_TYPES.LOCAL ? localStorage : sessionStorage;
    this.prefix = 'admin_'; // 存储键前缀，避免与其他应用冲突
  }

  /**
   * 获取带前缀的存储键
   * @param {string} key - 原始键名
   * @returns {string} 带前缀的键名
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 保存数据到存储
   * @param {string} key - 键名
   * @param {any} value - 值（将被自动JSON序列化）
   */
  set(key, value) {
    try {
      const storageKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(storageKey, serializedValue);
      return true;
    } catch (error) {
      console.error(`存储数据失败 (${key}):`, error);
      // 处理存储容量已满的情况
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || 
           error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn('存储容量已满，尝试清理过期数据...');
        this.clearExpiredData();
        try {
          this.set(key, value);
          return true;
        } catch (retryError) {
          console.error(`重试存储数据失败 (${key}):`, retryError);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * 从存储获取数据
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值，当键不存在时返回
   * @returns {any} 解析后的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const storageKey = this.getKey(key);
      const serializedValue = this.storage.getItem(storageKey);
      
      if (serializedValue === null) {
        return defaultValue;
      }
      
      // 检查是否是带过期时间的数据
      try {
        const parsedValue = JSON.parse(serializedValue);
        // 如果是对象且包含_expire属性
        if (typeof parsedValue === 'object' && 
            parsedValue !== null && 
            '_expire' in parsedValue && 
            '_data' in parsedValue) {
          const now = Date.now();
          // 检查是否已过期
          if (parsedValue._expire < now) {
            // 数据已过期，删除并返回默认值
            this.remove(key);
            return defaultValue;
          }
          // 数据未过期，返回原始数据
          return parsedValue._data;
        }
        // 普通数据，直接返回解析后的值
        return parsedValue;
      } catch (parseError) {
        // JSON解析失败，返回原始字符串
        return serializedValue;
      }
    } catch (error) {
      console.error(`获取数据失败 (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 从存储删除数据
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      const storageKey = this.getKey(key);
      this.storage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`删除数据失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键名
   * @returns {boolean} 是否存在
   */
  has(key) {
    try {
      const storageKey = this.getKey(key);
      return this.storage.getItem(storageKey) !== null;
    } catch (error) {
      console.error(`检查键是否存在失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 清空所有存储数据（仅限于当前应用的前缀）
   */
  clear() {
    try {
      const keysToRemove = [];
      
      // 收集所有带前缀的键
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // 移除所有收集到的键
      keysToRemove.forEach(key => this.storage.removeItem(key));
      return true;
    } catch (error) {
      console.error('清空存储失败:', error);
      return false;
    }
  }

  /**
   * 获取所有存储的键（带前缀）
   * @returns {Array<string>} 键名数组
   */
  getKeys() {
    try {
      const keys = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          // 移除前缀，返回原始键名
          keys.push(key.replace(this.prefix, ''));
        }
      }
      
      return keys;
    } catch (error) {
      console.error('获取键列表失败:', error);
      return [];
    }
  }

  /**
   * 获取存储的使用情况
   * @returns {Object} 使用情况信息
   */
  getUsageInfo() {
    try {
      let usedSpace = 0;
      let itemCount = 0;
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = this.storage.getItem(key);
          usedSpace += new Blob([key + value]).size;
          itemCount++;
        }
      }
      
      return {
        usedSpace,
        usedSpaceFormatted: this.formatBytes(usedSpace),
        itemCount
      };
    } catch (error) {
      console.error('获取使用情况失败:', error);
      return {
        usedSpace: 0,
        usedSpaceFormatted: '0 B',
        itemCount: 0
      };
    }
  }

  /**
   * 格式化字节数
   * @private
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 存储带过期时间的数据
   * @param {string} key - 键名
   * @param {any} value - 值
   * @param {number} expireTime - 过期时间（毫秒）
   */
  setWithExpire(key, value, expireTime) {
    if (!expireTime || expireTime <= 0) {
      // 如果没有设置过期时间或过期时间无效，直接调用set方法
      return this.set(key, value);
    }
    
    const now = Date.now();
    const dataWithExpire = {
      _data: value,
      _expire: now + expireTime
    };
    
    return this.set(key, dataWithExpire);
  }

  /**
   * 清除过期的数据
   * @private
   */
  clearExpiredData() {
    try {
      const keys = this.getKeys();
      keys.forEach(key => {
        // 调用get方法会自动检查并清理过期数据
        this.get(key);
      });
    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }

  /**
   * 批量设置数据
   * @param {Object} dataObject - 包含多个键值对的对象
   */
  bulkSet(dataObject) {
    try {
      Object.entries(dataObject).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error('批量设置数据失败:', error);
      return false;
    }
  }

  /**
   * 批量获取数据
   * @param {Array<string>} keys - 键名数组
   * @returns {Object} 包含键值对的对象
   */
  bulkGet(keys) {
    const result = {};
    
    try {
      keys.forEach(key => {
        result[key] = this.get(key);
      });
    } catch (error) {
      console.error('批量获取数据失败:', error);
    }
    
    return result;
  }

  /**
   * 批量删除数据
   * @param {Array<string>} keys - 键名数组
   */
  bulkRemove(keys) {
    try {
      keys.forEach(key => {
        this.remove(key);
      });
      return true;
    } catch (error) {
      console.error('批量删除数据失败:', error);
      return false;
    }
  }

  /**
   * 增加数值
   * @param {string} key - 键名
   * @param {number} increment - 增量值，默认为1
   * @returns {number} 增加后的值
   */
  increment(key, increment = 1) {
    try {
      const currentValue = Number(this.get(key, 0));
      const newValue = isNaN(currentValue) ? increment : currentValue + increment;
      this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error(`增加数值失败 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 减少数值
   * @param {string} key - 键名
   * @param {number} decrement - 减量值，默认为1
   * @returns {number} 减少后的值
   */
  decrement(key, decrement = 1) {
    try {
      const currentValue = Number(this.get(key, 0));
      const newValue = isNaN(currentValue) ? -decrement : currentValue - decrement;
      this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error(`减少数值失败 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 向数组中添加元素
   * @param {string} key - 键名
   * @param {any} item - 要添加的元素
   * @returns {Array} 添加后的数组
   */
  pushArrayItem(key, item) {
    try {
      const array = this.get(key, []);
      if (!Array.isArray(array)) {
        throw new Error('存储的值不是数组');
      }
      array.push(item);
      this.set(key, array);
      return array;
    } catch (error) {
      console.error(`向数组添加元素失败 (${key}):`, error);
      return [];
    }
  }

  /**
   * 从数组中移除元素
   * @param {string} key - 键名
   * @param {any} item - 要移除的元素
   * @returns {Array} 移除后的数组
   */
  removeArrayItem(key, item) {
    try {
      const array = this.get(key, []);
      if (!Array.isArray(array)) {
        throw new Error('存储的值不是数组');
      }
      const index = array.indexOf(item);
      if (index > -1) {
        array.splice(index, 1);
        this.set(key, array);
      }
      return array;
    } catch (error) {
      console.error(`从数组移除元素失败 (${key}):`, error);
      return [];
    }
  }

  /**
   * 清空数组
   * @param {string} key - 键名
   */
  clearArray(key) {
    try {
      this.set(key, []);
      return true;
    } catch (error) {
      console.error(`清空数组失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 获取存储的所有数据
   * @returns {Object} 包含所有键值对的对象
   */
  getAllData() {
    const result = {};
    
    try {
      const keys = this.getKeys();
      keys.forEach(key => {
        result[key] = this.get(key);
      });
    } catch (error) {
      console.error('获取所有数据失败:', error);
    }
    
    return result;
  }
}

// 创建localStorage实例
export const local = new BaseStorage(STORAGE_TYPES.LOCAL);

// 创建sessionStorage实例
export const session = new BaseStorage(STORAGE_TYPES.SESSION);

// 默认导出local存储
export default local;

// 导出存储服务对象
export const storage = {
  local,
  session,
  types: STORAGE_TYPES,
  
  /**
   * 根据类型获取存储实例
   * @param {string} type - 存储类型
   * @returns {BaseStorage} 存储实例
   */
  getStorage(type = STORAGE_TYPES.LOCAL) {
    return type === STORAGE_TYPES.SESSION ? this.session : this.local;
  },
  
  /**
   * 检查存储是否可用
   * @param {string} type - 存储类型
   * @returns {boolean} 是否可用
   */
  isAvailable(type = STORAGE_TYPES.LOCAL) {
    try {
      const testKey = `${this.getStorage(type).prefix}test`;
      const storage = type === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn(`${type} storage is not available:`, error);
      return false;
    }
  }
};