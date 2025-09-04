/**
 * 错误处理模块
 * 提供统一的错误处理机制，包括错误类型定义、错误代码映射和错误处理函数
 */

import { ElMessage, ElMessageBox } from 'element-plus';
import auth from './auth';
import { cancelAllRequests } from './request';
import { storage } from './storage';

// 错误类型常量
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  CANCEL: 'cancel',
  UNKNOWN: 'unknown'
};

// HTTP错误状态码映射
const HTTP_STATUS_MAP = {
  400: { type: ERROR_TYPES.VALIDATION, message: '请求参数错误' },
  401: { type: ERROR_TYPES.AUTH, message: '未授权，请重新登录' },
  403: { type: ERROR_TYPES.PERMISSION, message: '无权限执行此操作' },
  404: { type: ERROR_TYPES.CLIENT, message: '请求的资源不存在' },
  405: { type: ERROR_TYPES.CLIENT, message: '请求方法不允许' },
  406: { type: ERROR_TYPES.CLIENT, message: '请求的格式不可用' },
  408: { type: ERROR_TYPES.TIMEOUT, message: '请求超时' },
  409: { type: ERROR_TYPES.CLIENT, message: '请求冲突' },
  410: { type: ERROR_TYPES.CLIENT, message: '请求的资源已永久删除' },
  422: { type: ERROR_TYPES.VALIDATION, message: '请求参数验证失败' },
  429: { type: ERROR_TYPES.CLIENT, message: '请求过于频繁' },
  500: { type: ERROR_TYPES.SERVER, message: '服务器内部错误' },
  501: { type: ERROR_TYPES.SERVER, message: '服务器不支持该请求方法' },
  502: { type: ERROR_TYPES.SERVER, message: '网关错误' },
  503: { type: ERROR_TYPES.SERVER, message: '服务不可用' },
  504: { type: ERROR_TYPES.SERVER, message: '网关超时' }
};

// 自定义错误代码映射
const CUSTOM_ERROR_CODES = {
  1001: { type: ERROR_TYPES.AUTH, message: '登录已过期，请重新登录' },
  1002: { type: ERROR_TYPES.AUTH, message: '账号或密码错误' },
  1003: { type: ERROR_TYPES.AUTH, message: '账号被禁用' },
  1004: { type: ERROR_TYPES.AUTH, message: '账号在其他地方登录' },
  2001: { type: ERROR_TYPES.VALIDATION, message: '数据验证失败' },
  2002: { type: ERROR_TYPES.CLIENT, message: '数据已存在' },
  2003: { type: ERROR_TYPES.CLIENT, message: '数据不存在' },
  3001: { type: ERROR_TYPES.PERMISSION, message: '权限不足' },
  3002: { type: ERROR_TYPES.PERMISSION, message: '操作被拒绝' },
  4001: { type: ERROR_TYPES.SERVER, message: '数据库错误' },
  4002: { type: ERROR_TYPES.SERVER, message: '文件处理错误' },
  5000: { type: ERROR_TYPES.UNKNOWN, message: '未知错误' }
};

// 错误日志级别
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * 基础错误类
 */
export class BaseError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, code = null, data = null) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code;
    this.data = data;
    this.timestamp = Date.now();
    
    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends BaseError {
  constructor(message = '网络连接异常', code = null, data = null) {
    super(message, ERROR_TYPES.NETWORK, code, data);
  }
}

/**
 * 认证错误类
 */
export class AuthError extends BaseError {
  constructor(message = '认证失败', code = null, data = null) {
    super(message, ERROR_TYPES.AUTH, code, data);
  }
}

/**
 * 权限错误类
 */
export class PermissionError extends BaseError {
  constructor(message = '权限不足', code = null, data = null) {
    super(message, ERROR_TYPES.PERMISSION, code, data);
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends BaseError {
  constructor(message = '数据验证失败', code = null, data = null) {
    super(message, ERROR_TYPES.VALIDATION, code, data);
  }
}

/**
 * 服务器错误类
 */
export class ServerError extends BaseError {
  constructor(message = '服务器错误', code = null, data = null) {
    super(message, ERROR_TYPES.SERVER, code, data);
  }
}

/**
 * 客户端错误类
 */
export class ClientError extends BaseError {
  constructor(message = '客户端错误', code = null, data = null) {
    super(message, ERROR_TYPES.CLIENT, code, data);
  }
}

/**
 * 记录错误日志
 * @param {Error} error - 错误对象
 * @param {string} level - 日志级别
 * @param {Object} context - 错误上下文信息
 */
export function logError(error, level = LOG_LEVELS.ERROR, context = null) {
  try {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      level,
      type: error.type || ERROR_TYPES.UNKNOWN,
      code: error.code || null,
      message: error.message,
      stack: error.stack,
      context: context || {}
    };
    
    // 根据环境决定日志输出方式
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${errorInfo.type}: ${errorInfo.message}`, errorInfo);
    } else {
      // 生产环境可以发送到监控系统
      // sendErrorToMonitoringSystem(errorInfo);
      console.error(`[ERROR] ${errorInfo.type}: ${errorInfo.message}`);
    }
    
    // 存储错误日志到本地存储（可选）
    if (storage.isAvailable()) {
      const errorLogs = storage.local.get('errorLogs', []);
      errorLogs.push(errorInfo);
      // 只保留最近100条错误日志
      if (errorLogs.length > 100) {
        errorLogs.shift();
      }
      storage.local.set('errorLogs', errorLogs);
    }
  } catch (logError) {
    console.error('记录错误日志失败:', logError);
  }
}

/**
 * 处理HTTP响应错误
 * @param {Object} errorResponse - 错误响应对象
 * @param {Object} config - 请求配置
 * @returns {Error} 标准化的错误对象
 */
export function handleHttpError(errorResponse, config = null) {
  try {
    const { response, request, message } = errorResponse;
    
    let error;
    let context = { config };
    
    if (response) {
      // 服务器返回了错误状态码
      const { status, data } = response;
      const statusInfo = HTTP_STATUS_MAP[status] || { type: ERROR_TYPES.UNKNOWN, message: `HTTP错误: ${status}` };
      
      // 尝试从响应数据中获取更具体的错误信息
      const errorMessage = data?.msg || data?.error || data?.message || statusInfo.message;
      const errorCode = data?.code || status;
      
      context.response = {
        status,
        data
      };
      
      // 根据错误类型创建对应的错误对象
      switch (statusInfo.type) {
        case ERROR_TYPES.AUTH:
          error = new AuthError(errorMessage, errorCode, data);
          break;
        case ERROR_TYPES.PERMISSION:
          error = new PermissionError(errorMessage, errorCode, data);
          break;
        case ERROR_TYPES.VALIDATION:
          error = new ValidationError(errorMessage, errorCode, data);
          break;
        case ERROR_TYPES.SERVER:
          error = new ServerError(errorMessage, errorCode, data);
          break;
        case ERROR_TYPES.TIMEOUT:
          error = new NetworkError(errorMessage, errorCode, data);
          break;
        default:
          error = new ClientError(errorMessage, errorCode, data);
      }
    } else if (request) {
      // 请求已发送但没有收到响应
      error = new NetworkError('网络连接异常，请检查网络设置', null, { request });
    } else {
      // 请求配置出错
      error = new ClientError(message || '请求配置错误', null, { error: errorResponse });
    }
    
    // 记录错误日志
    logError(error, LOG_LEVELS.ERROR, context);
    
    return error;
  } catch (handleError) {
    console.error('处理HTTP错误失败:', handleError);
    return new Error('处理HTTP错误失败');
  }
}

/**
 * 处理自定义错误代码
 * @param {number} code - 错误代码
 * @param {string} message - 错误消息（可选，会覆盖默认消息）
 * @param {any} data - 附加数据
 * @returns {Error} 标准化的错误对象
 */
export function handleCustomError(code, message = null, data = null) {
  try {
    const errorInfo = CUSTOM_ERROR_CODES[code] || { type: ERROR_TYPES.UNKNOWN, message: '未知错误' };
    const finalMessage = message || errorInfo.message;
    
    let error;
    
    // 根据错误类型创建对应的错误对象
    switch (errorInfo.type) {
      case ERROR_TYPES.AUTH:
        error = new AuthError(finalMessage, code, data);
        break;
      case ERROR_TYPES.PERMISSION:
        error = new PermissionError(finalMessage, code, data);
        break;
      case ERROR_TYPES.VALIDATION:
        error = new ValidationError(finalMessage, code, data);
        break;
      case ERROR_TYPES.SERVER:
        error = new ServerError(finalMessage, code, data);
        break;
      default:
        error = new BaseError(finalMessage, errorInfo.type, code, data);
    }
    
    // 记录错误日志
    logError(error, LOG_LEVELS.ERROR, { code, data });
    
    return error;
  } catch (handleError) {
    console.error('处理自定义错误失败:', handleError);
    return new Error('处理自定义错误失败');
  }
}

/**
 * 显示错误消息
 * @param {Error|string} error - 错误对象或错误消息
 * @param {Object} options - 消息选项
 */
export function showError(error, options = {}) {
  try {
    const { type = 'error', duration = 3000, showClose = true } = options;
    let message = '';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message || '操作失败';
    } else if (error && typeof error === 'object') {
      message = error.message || error.msg || JSON.stringify(error);
    } else {
      message = '未知错误';
    }
    
    // 根据错误类型显示不同的消息
    switch (type) {
      case 'error':
        ElMessage.error({ message, duration, showClose });
        break;
      case 'warning':
        ElMessage.warning({ message, duration, showClose });
        break;
      case 'info':
        ElMessage.info({ message, duration, showClose });
        break;
      default:
        ElMessage.error({ message, duration, showClose });
    }
  } catch (showError) {
    console.error('显示错误消息失败:', showError);
  }
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {Object} options - 对话框选项
 * @returns {Promise} 确认结果Promise
 */
export function showConfirmDialog(message, options = {}) {
  const { 
    title = '确认操作',
    confirmButtonText = '确定',
    cancelButtonText = '取消',
    type = 'warning'
  } = options;
  
  return ElMessageBox.confirm(message, title, {
    confirmButtonText,
    cancelButtonText,
    type
  });
}

/**
 * 统一处理错误并显示消息
 * @param {Error|Object} error - 错误对象
 * @param {boolean} showToast - 是否显示提示消息
 * @returns {Error} 处理后的错误对象
 */
export function handleAndShowError(error, showToast = true) {
  try {
    let processedError = error;
    
    // 处理HTTP错误
    if (error.response || error.request) {
      processedError = handleHttpError(error);
    } 
    // 处理自定义错误代码
    else if (error.code && typeof error.code === 'number') {
      processedError = handleCustomError(error.code, error.message || error.msg, error.data);
    } 
    // 转换普通错误对象
    else if (error instanceof Error && !error.type) {
      processedError = new BaseError(error.message, ERROR_TYPES.UNKNOWN, null, { originalError: error });
      logError(processedError, LOG_LEVELS.ERROR);
    }
    
    // 显示错误消息
    if (showToast) {
      showError(processedError);
    }
    
    // 特殊处理认证错误
    if (processedError.type === ERROR_TYPES.AUTH) {
      handleAuthError(processedError);
    }
    
    // 特殊处理权限错误
    if (processedError.type === ERROR_TYPES.PERMISSION) {
      handlePermissionError(processedError);
    }
    
    return processedError;
  } catch (handleError) {
    console.error('统一处理错误失败:', handleError);
    
    if (showToast) {
      showError('处理错误时发生异常');
    }
    
    return handleError;
  }
}

/**
 * 处理认证错误
 * @param {Error} error - 认证错误对象
 */
export function handleAuthError(error) {
  try {
    console.warn('认证错误处理:', error);
    
    // 取消所有正在进行的请求
    cancelAllRequests();
    
    // 清除认证信息
    auth.logout();
    
    // 延迟跳转到登录页，让用户看到错误消息
    setTimeout(() => {
      // 记录当前页面，登录后可以跳转回来
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        storage.set('redirectAfterLogin', currentPath);
      }
      window.location.href = '/login';
    }, 1000);
  } catch (handleError) {
    console.error('处理认证错误失败:', handleError);
  }
}

/**
 * 处理权限错误
 * @param {Error} error - 权限错误对象
 */
export function handlePermissionError(error) {
  try {
    console.warn('权限错误处理:', error);
    
    // 可以根据需要添加更复杂的权限错误处理逻辑
    // 例如记录用户尝试访问的受限资源，或者提供申请权限的入口
  } catch (handleError) {
    console.error('处理权限错误失败:', handleError);
  }
}

/**
 * 清除本地错误日志
 */
export function clearErrorLogs() {
  try {
    storage.remove('errorLogs');
    return true;
  } catch (error) {
    console.error('清除错误日志失败:', error);
    return false;
  }
}

/**
 * 获取本地错误日志
 * @param {number} limit - 返回的日志数量限制
 * @returns {Array} 错误日志数组
 */
export function getErrorLogs(limit = 100) {
  try {
    const logs = storage.get('errorLogs', []);
    return logs.slice(-limit);
  } catch (error) {
    console.error('获取错误日志失败:', error);
    return [];
  }
}

// 默认导出错误处理函数
export default {
  ERROR_TYPES,
  LOG_LEVELS,
  BaseError,
  NetworkError,
  AuthError,
  PermissionError,
  ValidationError,
  ServerError,
  ClientError,
  logError,
  handleHttpError,
  handleCustomError,
  showError,
  showConfirmDialog,
  handleAndShowError,
  handleAuthError,
  handlePermissionError,
  clearErrorLogs,
  getErrorLogs
};