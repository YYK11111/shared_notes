// 字符串处理工具

// 去除字符串两端的空格
const trim = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim();
};

// 去除字符串左侧的空格
const ltrim = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/^\s+/, '');
};

// 去除字符串右侧的空格
const rtrim = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\s+$/, '');
};

// 将字符串转换为小写
const toLowerCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.toLowerCase();
};

// 将字符串转换为大写
const toUpperCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.toUpperCase();
};

// 将字符串转换为驼峰命名法
const toCamelCase = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
};

// 将字符串转换为下划线命名法
const toSnakeCase = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
};

// 将字符串转换为连字符命名法
const toKebabCase = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
};

// 截断字符串并添加省略号
const truncate = (str, maxLength = 100, suffix = '...') => {
  if (typeof str !== 'string') return str;
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + suffix;
};

// 限制字符串长度
const limitLength = (str, maxLength = 100, defaultValue = '') => {
  if (typeof str !== 'string') return defaultValue;
  if (str.length > maxLength) return str.substring(0, maxLength);
  return str;
};

// 重复字符串指定次数
const repeat = (str, times = 1) => {
  if (typeof str !== 'string') return '';
  return str.repeat(Math.max(0, times));
};

// 生成随机字符串
const randomString = (length = 16, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
  let result = '';
  const charsetLength = charset.length;
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  return result;
};

// 生成随机数字字符串
const randomNumberString = (length = 8) => {
  return randomString(length, '0123456789');
};

// 验证是否是邮箱地址
const isEmail = (str) => {
  if (typeof str !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

// 验证是否是手机号码（中国）
const isPhoneNumber = (str) => {
  if (typeof str !== 'string') return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(str);
};

// 验证是否是URL
const isUrl = (str) => {
  if (typeof str !== 'string') return false;
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(str);
};

// 验证是否是身份证号码（中国，18位）
const isIdCard = (str) => {
  if (typeof str !== 'string') return false;
  const idCardRegex = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)/;
  return idCardRegex.test(str);
};

// 验证是否是纯数字
const isNumber = (str) => {
  if (typeof str !== 'string') return false;
  const numberRegex = /^\d+$/;
  return numberRegex.test(str);
};

// 验证是否是纯字母
const isLetter = (str) => {
  if (typeof str !== 'string') return false;
  const letterRegex = /^[a-zA-Z]+$/;
  return letterRegex.test(str);
};

// 验证是否是字母和数字组合
const isAlphanumeric = (str) => {
  if (typeof str !== 'string') return false;
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
};

// 将HTML特殊字符转义
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>'"\/]/g, (char) => htmlEscapes[char]);
};

// 将转义的HTML特殊字符还原
const unescapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/'
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g, (entity) => htmlUnescapes[entity]);
};

// 移除HTML标签
const stripHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
};

// 提取HTML中的文本内容
const extractTextFromHtml = (html) => {
  if (typeof html !== 'string') return html;
  // 先移除脚本和样式标签
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // 移除HTML注释
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // 移除HTML标签
  text = text.replace(/<[^>]*>/g, '');
  // 合并多个空格
  text = text.replace(/\s+/g, ' ');
  // 去除两端空格
  return text.trim();
};

// 生成指定长度的填充字符串
const padLeft = (str, length, char = ' ') => {
  if (typeof str !== 'string') str = String(str);
  const padding = repeat(char, Math.max(0, length - str.length));
  return padding + str;
};

// 右侧填充字符串
const padRight = (str, length, char = ' ') => {
  if (typeof str !== 'string') str = String(str);
  const padding = repeat(char, Math.max(0, length - str.length));
  return str + padding;
};

// 居中填充字符串
const padCenter = (str, length, char = ' ') => {
  if (typeof str !== 'string') str = String(str);
  const padding = Math.max(0, length - str.length);
  const padLeft = Math.floor(padding / 2);
  const padRight = padding - padLeft;
  return repeat(char, padLeft) + str + repeat(char, padRight);
};

// 将字符串首字母大写
const capitalize = (str) => {
  if (typeof str !== 'string' || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 将字符串每个单词首字母大写
const capitalizeWords = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// 替换字符串中的模板变量
const formatString = (template, data) => {
  if (typeof template !== 'string') return template;
  if (!data || typeof data !== 'object') return template;
  
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match;
  });
};

// 计算字符串的字节长度（中文算2个字节）
const getByteLength = (str) => {
  if (typeof str !== 'string') return 0;
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    length += charCode > 255 ? 2 : 1;
  }
  return length;
};

// 检查字符串是否包含敏感词
const containsSensitiveWord = (str, sensitiveWords = []) => {
  if (typeof str !== 'string' || !Array.isArray(sensitiveWords)) return false;
  
  return sensitiveWords.some(word => 
    str.toLowerCase().includes(word.toLowerCase())
  );
};

// 过滤字符串中的敏感词
const filterSensitiveWords = (str, sensitiveWords = [], replacement = '***') => {
  if (typeof str !== 'string' || !Array.isArray(sensitiveWords)) return str;
  
  let filteredStr = str;
  sensitiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredStr = filteredStr.replace(regex, replacement);
  });
  
  return filteredStr;
};

// 生成摘要（从HTML或纯文本中提取）
const generateSummary = (content, maxLength = 100) => {
  if (typeof content !== 'string') return '';
  
  // 移除HTML标签
  const plainText = stripHtml(content);
  
  // 截取指定长度的文本
  if (plainText.length <= maxLength) return plainText;
  
  // 尝试在句子结束处截断
  const truncated = plainText.substring(0, maxLength + 20);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastComma = truncated.lastIndexOf(',');
  const lastSpace = truncated.lastIndexOf(' ');
  
  let endIndex = maxLength;
  if (lastPeriod >= maxLength - 20) {
    endIndex = lastPeriod + 1;
  } else if (lastComma >= maxLength - 20) {
    endIndex = lastComma + 1;
  } else if (lastSpace >= maxLength - 20) {
    endIndex = lastSpace;
  }
  
  return plainText.substring(0, endIndex) + '...';
};

module.exports = {
  trim,
  ltrim,
  rtrim,
  toLowerCase,
  toUpperCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  truncate,
  limitLength,
  repeat,
  randomString,
  randomNumberString,
  isEmail,
  isPhoneNumber,
  isUrl,
  isIdCard,
  isNumber,
  isLetter,
  isAlphanumeric,
  escapeHtml,
  unescapeHtml,
  stripHtml,
  extractTextFromHtml,
  padLeft,
  padRight,
  padCenter,
  capitalize,
  capitalizeWords,
  formatString,
  getByteLength,
  containsSensitiveWord,
  filterSensitiveWords,
  generateSummary
};