// 日期时间处理工具

// 格式化日期为指定格式
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  // 如果是字符串，转换为Date对象
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  let result = format;
  result = result.replace('YYYY', year);
  result = result.replace('MM', month);
  result = result.replace('DD', day);
  result = result.replace('HH', hours);
  result = result.replace('mm', minutes);
  result = result.replace('ss', seconds);
  
  return result;
};

// 格式化时间戳为相对时间（如：3分钟前，2小时前，1天前）
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = Date.now();
  const date = typeof timestamp === 'string' || typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const diffInSeconds = Math.floor((now - date.getTime()) / 1000);
  
  if (diffInSeconds < 0) return '未来';
  
  // 小于1分钟
  if (diffInSeconds < 60) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  }
  
  // 小于30天
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}周前`;
  }
  
  // 小于365天
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}个月前`;
  }
  
  // 大于等于1年
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years}年前`;
};

// 获取今天的日期（开始时间）
const getTodayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// 获取今天的日期（结束时间）
const getTodayEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

// 获取昨天的日期
const getYesterday = () => {
  const now = new Date();
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
};

// 获取本周的开始日期（周一）
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay() || 7; // 将周日转换为7
  const diff = now.getDate() - day + 1;
  return new Date(now.setDate(diff));
};

// 获取本周的结束日期（周日）
const getWeekEnd = () => {
  const now = new Date(getWeekStart());
  return new Date(now.setDate(now.getDate() + 6));
};

// 获取本月的开始日期
const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// 获取本月的结束日期
const getMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

// 获取上月的开始日期
const getLastMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

// 获取上月的结束日期
const getLastMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0);
};

// 获取今年的开始日期
const getYearStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
};

// 获取今年的结束日期
const getYearEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), 11, 31);
};

// 计算两个日期之间的天数
const daysBetween = (date1, date2) => {
  const d1 = typeof date1 === 'string' || typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' || typeof date2 === 'number' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// 增加或减少天数
const addDays = (date, days) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  d.setDate(d.getDate() + days);
  return d;
};

// 增加或减少月数
const addMonths = (date, months) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  d.setMonth(d.getMonth() + months);
  return d;
};

// 增加或减少年数
const addYears = (date, years) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  d.setFullYear(d.getFullYear() + years);
  return d;
};

// 检查是否是闰年
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// 获取指定月份的天数
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// 检查两个日期是否在同一天
const isSameDay = (date1, date2) => {
  const d1 = typeof date1 === 'string' || typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' || typeof date2 === 'number' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// 检查两个日期是否在同一月
const isSameMonth = (date1, date2) => {
  const d1 = typeof date1 === 'string' || typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' || typeof date2 === 'number' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
};

// 检查两个日期是否在同一年
const isSameYear = (date1, date2) => {
  const d1 = typeof date1 === 'string' || typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' || typeof date2 === 'number' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear();
};

// 获取日期的季度
const getQuarter = (date) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const month = d.getMonth() + 1;
  return Math.ceil(month / 3);
};

// 生成时间范围（如最近7天、最近30天等）
const generateDateRange = (type) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (type) {
    case 'today':
      startDate = getTodayStart();
      endDate = getTodayEnd();
      break;
    case 'yesterday':
      const yesterday = getYesterday();
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      break;
    case 'thisWeek':
      startDate = getWeekStart();
      endDate = getWeekEnd();
      break;
    case 'lastWeek':
      const lastWeekStart = addDays(getWeekStart(), -7);
      startDate = lastWeekStart;
      endDate = new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      break;
    case 'thisMonth':
      startDate = getMonthStart();
      endDate = getMonthEnd();
      break;
    case 'lastMonth':
      startDate = getLastMonthStart();
      endDate = getLastMonthEnd();
      break;
    case 'thisYear':
      startDate = getYearStart();
      endDate = getYearEnd();
      break;
    case 'last7Days':
      startDate = addDays(now, -6);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      endDate = getTodayEnd();
      break;
    case 'last30Days':
      startDate = addDays(now, -29);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      endDate = getTodayEnd();
      break;
    case 'last90Days':
      startDate = addDays(now, -89);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      endDate = getTodayEnd();
      break;
    default:
      startDate = getTodayStart();
      endDate = getTodayEnd();
  }
  
  return {
    startDate,
    endDate,
    startStr: formatDate(startDate),
    endStr: formatDate(endDate)
  };
};

// 格式化持续时间（秒数转换为时分秒）
const formatDuration = (seconds) => {
  if (seconds < 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const format = (num) => String(num).padStart(2, '0');
  
  if (hours > 0) {
    return `${format(hours)}:${format(minutes)}:${format(remainingSeconds)}`;
  } else {
    return `${format(minutes)}:${format(remainingSeconds)}`;
  }
};

// 转换ISO格式日期时间为MySQL兼容的datetime格式
const convertIsoToMysqlDateTime = (dateTime) => {
  if (!dateTime) return null;
  
  // 如果是字符串，转换为Date对象
  const d = typeof dateTime === 'string' || typeof dateTime === 'number' ? new Date(dateTime) : dateTime;
  
  if (isNaN(d.getTime())) return null;
  
  // 格式化为YYYY-MM-DD HH:mm:ss格式
  return formatDate(d, 'YYYY-MM-DD HH:mm:ss');
};

// 验证日期时间格式是否符合MySQL的datetime类型
const isValidMysqlDateTime = (dateTime) => {
  if (!dateTime) return true; // 允许空值
  
  // 检查是否是YYYY-MM-DD HH:mm:ss格式
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!regex.test(dateTime)) return false;
  
  // 验证日期时间的有效性
  const parts = dateTime.split(/[-\s:]/);
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const hours = parseInt(parts[3]);
  const minutes = parseInt(parts[4]);
  const seconds = parseInt(parts[5]);
  
  const date = new Date(year, month, day, hours, minutes, seconds);
  return date.getFullYear() === year &&
         date.getMonth() === month &&
         date.getDate() === day &&
         date.getHours() === hours &&
         date.getMinutes() === minutes &&
         date.getSeconds() === seconds;
};

module.exports = {
  formatDate,
  formatRelativeTime,
  getTodayStart,
  getTodayEnd,
  getYesterday,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getLastMonthStart,
  getLastMonthEnd,
  getYearStart,
  getYearEnd,
  daysBetween,
  addDays,
  addMonths,
  addYears,
  isLeapYear,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isSameYear,
  getQuarter,
  generateDateRange,
  formatDuration,
  convertIsoToMysqlDateTime,
  isValidMysqlDateTime
};