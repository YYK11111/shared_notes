
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';
import auth from './auth';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:3000', // 直接设置后端服务地址
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('创建axios实例，baseURL设置为:', request.defaults.baseURL);

// 存储正在请求的URL，用于防抖
const pendingRequests = new Map();

/**
 * 生成请求的唯一标识
 * @param {Object} config - 请求配置
 * @returns {string} 请求标识
 */
const generateRequestKey = (config) => {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
};

/**
 * 添加请求到待处理列表
 * @param {Object} config - 请求配置
 */
const addPendingRequest = (config) => {
  // 检查是否禁用重复请求检测
  if (config.disableDuplicateCheck) {
    return;
  }
  
  // 对于/auth/me这类需要频繁调用的接口，默认禁用重复请求检测
  const disableByDefault = ['/auth/me'].includes(config.url);
  if (disableByDefault) {
    return;
  }
  
  const requestKey = generateRequestKey(config);
  if (!pendingRequests.has(requestKey)) {
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(requestKey, controller);
  } else {
    // 如果请求已存在，则取消新的请求
    config.cancelToken = new axios.CancelToken(cancel => {
      cancel(`重复请求被取消: ${config.url}`);
    });
  }
};

/**
 * 移除待处理请求
 * @param {Object} config - 请求配置
 */
const removePendingRequest = (config) => {
  const requestKey = generateRequestKey(config);
  if (pendingRequests.has(requestKey)) {
    pendingRequests.delete(requestKey);
  }
};

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    // 处理重复请求
    addPendingRequest(config);
    
    // 检查是否需要认证
    const requiresAuth = config.requiresAuth !== false; // 默认需要认证
    
    if (requiresAuth) {
      // 检查登录状态
      if (!auth.isAuthenticated()) {
        // 未登录，先移除待处理请求
        removePendingRequest(config);
        // 保存当前路由，用于登录后跳转
        const currentPath = router.currentRoute.value.fullPath;
        if (!currentPath.includes('/login')) {
          localStorage.setItem('redirect_after_login', currentPath);
        }
        // 延迟跳转，确保取消请求操作完成
        setTimeout(() => {
          router.push({ name: 'Login' });
        }, 100);
        throw new axios.Cancel('未登录，取消请求');
      }
      
      // 检查令牌是否即将过期，如果是则尝试刷新
      if (auth.isTokenExpired()) {
        try {
          await auth.refreshAccessToken();
        } catch (error) {
          console.error('刷新令牌失败，跳转到登录页:', error);
          auth.logout();
          // 先移除待处理请求
          removePendingRequest(config);
          // 保存当前路由，用于登录后跳转
          const currentPath = router.currentRoute.value.fullPath;
          if (!currentPath.includes('/login')) {
            localStorage.setItem('redirect_after_login', currentPath);
          }
          // 延迟跳转，确保取消请求操作完成
          setTimeout(() => {
            router.push({ name: 'Login' });
          }, 100);
          throw new axios.Cancel('刷新令牌失败，取消请求');
        }
      }
      
      // 设置Authorization头 - 确保在设置前检查请求是否被取消
      const token = auth.getToken();
      console.log(`为请求 ${config.url} 设置Authorization头:`, token ? '已设置' : '未设置');
      if (token && !config.cancelToken && !config.signal?.aborted) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`请求 ${config.url} 已添加Authorization头`);
        console.log('完整请求头:', JSON.stringify(config.headers));
      } else {
        console.warn(`请求 ${config.url} 未添加Authorization头，原因:`, token ? '请求已取消' : '无令牌');
      }
    }
    
    // 显示请求详细信息（用于调试）
    console.log(`[API请求] ${config.method?.toUpperCase()} ${config.url}${config.requiresAuth === false ? ' (无需认证)' : ''}`);
    console.log('请求配置 - baseURL:', config.baseURL || request.defaults.baseURL);
    console.log('请求配置 - URL:', config.url);
    console.log('请求配置 - 完整URL:', config.baseURL ? config.baseURL + config.url : config.url);
    
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 移除已完成的请求
    removePendingRequest(response.config);
    
    // 检查是否是blob类型的响应
    if (response.config.responseType === 'blob') {
      // 对于blob类型的响应（如验证码图片），直接返回完整的response对象
      return response;
    }
    
    // 统一处理响应数据
    const { data } = response;
    
    // 检查响应是否符合预期格式
    if (data && typeof data === 'object') {
      // 成功状态码处理
      if (data.code === 200) {
        return data;
      }
      
      // 处理业务错误
      ElMessage.error(data.msg || data.message || '请求失败');
      return Promise.reject(data);
    }
    
    return response;
  },
  async (error) => {
    // 移除已完成的请求
    if (error.config) {
      removePendingRequest(error.config);
    }
    
    // 处理取消请求的情况
    if (axios.isCancel(error)) {
      console.log('请求已取消:', error.message);
      return Promise.reject(error);
    }
    
    // 处理网络错误
    if (!error.response) {
      ElMessage.error('网络连接异常，请检查网络设置');
      return Promise.reject(error);
    }
    
    const { status, data } = error.response;
    console.error('[HTTP错误]', status, error.response.statusText);
    console.error('请求URL:', error.config.url);
    console.error('请求头:', JSON.stringify(error.config.headers));
    console.error('响应数据:', data);
    
    // 根据状态码处理不同的错误
    switch (status) {
      case 400:
        ElMessage.error(data?.msg || data?.message || '请求参数错误');
        break;
      
      case 401:
        // 未授权，可能是令牌过期或无效
        // 避免重复触发登出操作
        if (window.isLoggingOut) return Promise.reject(error);
        window.isLoggingOut = true;
        
        try {
          // 尝试刷新令牌
          await auth.refreshAccessToken();
          // 刷新成功后重试请求
          return request(error.config);
        } catch (refreshError) {
          // 刷新令牌失败，登出并跳转到登录页
          ElMessage.error('登录已过期，请重新登录');
          auth.logout();
          
          // 保存当前路由，登录成功后可以跳转回来
          const currentPath = router.currentRoute.value.fullPath;
          if (!currentPath.includes('/login')) {
            localStorage.setItem('redirect_after_login', currentPath);
          }
          
          router.push({ name: 'Login' });
        } finally {
          window.isLoggingOut = false;
        }
        break;
      
      case 403:
        ElMessage.error(data?.msg || data?.message || '无权限访问该资源');
        break;
      
      case 404:
        ElMessage.error(data?.msg || data?.message || '请求的资源不存在');
        break;
      
      case 500:
      case 502:
      case 503:
      case 504:
        ElMessage.error(data?.msg || data?.message || '服务器错误，请稍后重试');
        break;
      
      default:
        ElMessage.error(data?.msg || data?.message || `请求失败: ${status}`);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 封装get请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} options - 额外配置
 * @returns {Promise}
 */
export const get = (url, params = {}, options = {}) => {
  return request({
    url,
    method: 'get',
    params,
    ...options
  });
};

/**
 * 封装post请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 额外配置
 * @returns {Promise}
 */
export const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'post',
    data,
    ...options
  });
};

/**
 * 封装put请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 额外配置
 * @returns {Promise}
 */
export const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'put',
    data,
    ...options
  });
};

/**
 * 封装delete请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} options - 额外配置
 * @returns {Promise}
 */
export const del = (url, params = {}, options = {}) => {
  return request({
    url,
    method: 'delete',
    params,
    ...options
  });
};

/**
 * 封装文件上传请求
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {Object} options - 额外配置
 * @returns {Promise}
 */
export const upload = (url, formData, options = {}) => {
  return request({
    url,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...options.headers
    },
    timeout: 60000, // 上传文件超时时间延长到60秒
    ...options
  });
};

/**
 * 取消所有待处理的请求
 */
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort();
  });
  pendingRequests.clear();
};

export default request;