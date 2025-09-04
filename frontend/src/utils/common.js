/**
 * 通用工具函数
 * 包含日期格式化、字符串处理、数字格式化等常用功能
 */

/**
 * 日期时间格式化
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {string} format - 格式化模板，例如：'yyyy-MM-dd HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
  if (!date) return '';
  
  // 将输入转换为日期对象
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  
  // 检查是否是有效日期
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  return format
    .replace('yyyy', year)
    .replace('MM', padZero(month))
    .replace('dd', padZero(day))
    .replace('HH', padZero(hours))
    .replace('mm', padZero(minutes))
    .replace('ss', padZero(seconds))
    .replace('M', month)
    .replace('d', day)
    .replace('H', hours)
    .replace('m', minutes)
    .replace('s', seconds);
}

/**
 * 数字补零
 * @param {number} num - 需要补零的数字
 * @param {number} length - 补零后的长度，默认为2
 * @returns {string} 补零后的字符串
 */
export function padZero(num, length = 2) {
  return String(num).padStart(length, '0');
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件字节数
 * @returns {string} 格式化后的文件大小字符串
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化数字（千分位）
 * @param {number|string} num - 需要格式化的数字
 * @param {number} decimal - 保留的小数位数，默认为2
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num, decimal = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  // 转换为数字
  num = Number(num);
  
  // 保留指定小数位数
  num = num.toFixed(decimal);
  
  // 添加千分位
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {number} decimal - 保留的小数位数，默认为2
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(value, decimal = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return (value * 100).toFixed(decimal) + '%';
}

/**
 * 字符串截断
 * @param {string} str - 需要截断的字符串
 * @param {number} length - 截断的长度
 * @param {string} suffix - 截断后的后缀，默认为'...'
 * @returns {string} 截断后的字符串
 */
export function truncateString(str, length, suffix = '...') {
  if (!str || str.length <= length) {
    return str;
  }
  
  return str.substring(0, length) + suffix;
}

/**
 * 随机生成字符串
 * @param {number} length - 生成的字符串长度，默认为10
 * @param {string} chars - 可选字符集，默认为大小写字母和数字
 * @returns {string} 生成的随机字符串
 */
export function generateRandomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  const charsLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  
  return result;
}

/**
 * 深拷贝对象
 * @param {any} obj - 需要深拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @param {string} url - URL字符串，默认为当前页面URL
 * @returns {string|null} 参数值，不存在则返回null
 */
export function getUrlParam(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  
  if (!results) return null;
  if (!results[2]) return '';
  
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export function isValidEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号码
 * @returns {boolean} 是否为有效手机号
 */
export function isValidPhone(phone) {
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
}

/**
 * 验证身份证号格式
 * @param {string} idCard - 身份证号码
 * @returns {boolean} 是否为有效身份证号
 */
export function isValidIdCard(idCard) {
  const re = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return re.test(idCard);
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否为有效URL
 */
export function isValidUrl(url) {
  const re = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return re.test(url);
}

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} filename - 文件名
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || '';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名（小写）
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * 判断是否为图片文件
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为图片文件
 */
export function isImageFile(filename) {
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return extensions.includes(ext);
}

/**
 * 计算数组对象的属性总和
 * @param {Array} array - 数组
 * @param {string} property - 属性名
 * @returns {number} 属性总和
 */
export function sumArrayProperty(array, property) {
  if (!Array.isArray(array)) {
    return 0;
  }
  
  return array.reduce((sum, item) => {
    const value = parseFloat(item[property]);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

/**
 * 计算数组对象的属性平均值
 * @param {Array} array - 数组
 * @param {string} property - 属性名
 * @returns {number} 属性平均值
 */
export function averageArrayProperty(array, property) {
  if (!Array.isArray(array) || array.length === 0) {
    return 0;
  }
  
  const sum = sumArrayProperty(array, property);
  return sum / array.length;
}

/**
 * 数组去重
 * @param {Array} array - 数组
 * @param {string} key - 根据对象的哪个属性去重（可选）
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(array, key) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (!seen.has(value)) {
        seen.add(value);
        return true;
      }
      return false;
    });
  } else {
    return [...new Set(array)];
  }
}

/**
 * 滚动到页面顶部
 * @param {number} duration - 动画持续时间（毫秒），默认为300
 */
export function scrollToTop(duration = 300) {
  const start = window.pageYOffset;
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();
  
  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, ((now - startTime) / duration));
    const easeInOutQuad = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
    window.scrollTo(0, start * (1 - easeInOutQuad));
    
    if (window.pageYOffset > 0) {
      requestAnimationFrame(scroll);
    }
  }
  
  scroll();
}

/**
 * 获取浏览器信息
 * @returns {Object} 浏览器信息对象
 */
export function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = {
    name: 'Unknown',
    version: 'Unknown',
    platform: 'Unknown',
    isMobile: false
  };
  
  // 检测浏览器名称和版本
  if (userAgent.match(/MSIE|Trident/)) {
    browser.name = 'Internet Explorer';
    browser.version = userAgent.match(/MSIE (\d+\.\d+)|rv:(\d+\.\d+)/)[1] || userAgent.match(/MSIE (\d+\.\d+)|rv:(\d+\.\d+)/)[2];
  } else if (userAgent.match(/Edge/)) {
    browser.name = 'Microsoft Edge';
    browser.version = userAgent.match(/Edge\/(\d+\.\d+)/)[1];
  } else if (userAgent.match(/Chrome/)) {
    browser.name = 'Google Chrome';
    browser.version = userAgent.match(/Chrome\/(\d+\.\d+)/)[1];
  } else if (userAgent.match(/Firefox/)) {
    browser.name = 'Mozilla Firefox';
    browser.version = userAgent.match(/Firefox\/(\d+\.\d+)/)[1];
  } else if (userAgent.match(/Safari/)) {
    browser.name = 'Apple Safari';
    browser.version = userAgent.match(/Version\/(\d+\.\d+)/)[1];
  }
  
  // 检测平台
  if (userAgent.match(/Windows/)) {
    browser.platform = 'Windows';
  } else if (userAgent.match(/Macintosh/)) {
    browser.platform = 'macOS';
  } else if (userAgent.match(/Linux/)) {
    browser.platform = 'Linux';
  } else if (userAgent.match(/iPhone|iPad|iPod/)) {
    browser.platform = 'iOS';
    browser.isMobile = true;
  } else if (userAgent.match(/Android/)) {
    browser.platform = 'Android';
    browser.isMobile = true;
  }
  
  return browser;
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 需要复制的文本
 * @returns {Promise} 复制操作的Promise
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  } else {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 避免在页面上可见
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 休眠函数
 * @param {number} ms - 休眠时间（毫秒）
 * @returns {Promise} 休眠操作的Promise
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为空对象
 * @param {Object} obj - 需要检查的对象
 * @returns {boolean} 是否为空对象
 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * 合并多个对象
 * @param {...Object} objects - 需要合并的对象
 * @returns {Object} 合并后的对象
 */
export function mergeObjects(...objects) {
  return objects.reduce((acc, obj) => {
    return {
      ...acc,
      ...obj
    };
  }, {});
}

// 导出所有工具函数
export default {
  formatDate,
  padZero,
  formatFileSize,
  formatNumber,
  formatPercentage,
  truncateString,
  generateRandomString,
  deepClone,
  getUrlParam,
  debounce,
  throttle,
  isValidEmail,
  isValidPhone,
  isValidIdCard,
  isValidUrl,
  downloadFile,
  getFileExtension,
  isImageFile,
  sumArrayProperty,
  averageArrayProperty,
  uniqueArray,
  scrollToTop,
  getBrowserInfo,
  copyToClipboard,
  generateId,
  sleep,
  isEmptyObject,
  mergeObjects
};