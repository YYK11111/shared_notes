import api from './api';

// 令牌存储常量定义
const TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const USER_INFO_KEY = 'admin_user_info';
const TOKEN_EXPIRY_BUFFER = 300; // 令牌过期前5分钟自动刷新

// 并发控制锁
let refreshTokenLock = false;
let refreshTokenCallbacks = [];

/**
 * 保存令牌
 * @param {string} token - 访问令牌
 * @param {string} refreshToken - 刷新令牌
 */
export const setToken = (token, refreshToken) => {
  console.log('保存令牌:', { token: token ? '已设置' : '未设置', refreshToken: refreshToken ? '已设置' : '未设置' });
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    const tokenInfo = parseToken(token);
    console.log('保存的令牌信息:', {
      username: tokenInfo?.username,
      role: tokenInfo?.role,
      expiry: tokenInfo?.exp ? new Date(tokenInfo.exp * 1000).toISOString() : '无效'
    });
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * 获取访问令牌
 * @returns {string|null} 访问令牌
 */
export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY) || null;
  console.log(`获取令牌: ${token ? '存在' : '不存在'}`);
  if (token) {
    const tokenInfo = parseToken(token);
    console.log('令牌有效期:', tokenInfo && tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : '无效');
  }
  return token;
};

/**
 * 获取刷新令牌
 * @returns {string|null} 刷新令牌
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
};

/**
 * 清除令牌
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 保存用户信息
 * @param {object} userInfo - 用户信息对象
 */
export const setUserInfo = (userInfo) => {
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  }
};

/**
 * 获取用户信息
 * @returns {object|null} 用户信息对象
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 清除用户信息
 */
export const removeUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * 解析JWT令牌
 * @param {string} token - JWT令牌
 * @returns {object|null} 令牌解析后的对象
 */
export const parseToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('解析令牌失败:', error);
    return null;
  }
};

/**
 * 获取令牌过期时间
 * @returns {number|null} 过期时间戳
 */
export const getTokenExpiry = () => {
  const token = getToken();
  if (!token) return null;
  
  const parsedToken = parseToken(token);
  return parsedToken && parsedToken.exp ? parsedToken.exp * 1000 : null; // 转换为毫秒
};

/**
 * 检查令牌是否已过期
 * @returns {boolean} 是否过期
 */
export const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  // 考虑提前5分钟刷新
  return Date.now() > expiry - TOKEN_EXPIRY_BUFFER * 1000;
};

/**
 * 检查是否已认证
 * @returns {boolean} 是否已认证
 */
export const isAuthenticated = () => {
  const token = getToken();
  const userInfo = getUserInfo();
  const isExpired = isTokenExpired();
  
  console.log(`认证检查: 令牌${token ? '存在' : '不存在'}, 用户信息${userInfo ? '存在' : '不存在'}, 令牌${isExpired ? '已过期' : '有效'}`);
  
  return !!token && !!userInfo && !isTokenExpired();
};

/**
 * 刷新令牌
 * @returns {Promise<string>} 新的访问令牌
 */
export const refreshAccessToken = async () => {
  // 如果已经有刷新请求在进行中，加入回调队列
  if (refreshTokenLock) {
    return new Promise((resolve, reject) => {
      refreshTokenCallbacks.push({ resolve, reject });
    });
  }
  
  // 获取刷新令牌
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('没有可用的刷新令牌');
  }
  
  refreshTokenLock = true;
  
  try {
    const response = await api.refreshToken({ refreshToken });
    
    if (response.code === 200 && response.data && response.data.token) {
      // 保存新的令牌
      setToken(response.data.token, response.data.refreshToken || refreshToken);
      
      // 处理所有等待的回调
      refreshTokenCallbacks.forEach(({ resolve }) => {
        resolve(response.data.token);
      });
      
      return response.data.token;
    } else {
      throw new Error(response.msg || '刷新令牌失败');
    }
  } catch (error) {
    // 处理所有等待的回调
    refreshTokenCallbacks.forEach(({ reject }) => {
      reject(error);
    });
    
    throw error;
  } finally {
    // 重置锁和回调队列
    refreshTokenLock = false;
    refreshTokenCallbacks = [];
  }
};

/**
 * 获取用户名
 * @returns {string|null} 用户名
 */
export const getUsername = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.username : null;
};

/**
 * 获取用户角色
 * @returns {string|null} 用户角色
 */
export const getUserRole = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.role : null;
};

/**
 * 检查是否是超级管理员
 * @returns {boolean} 是否是超级管理员
 */
export const isSuperAdmin = () => {
  const role = getUserRole();
  return role === 'superadmin';
};

/**
 * 获取用户权限列表
 * @returns {Array<string>} 权限列表
 */
export const getUserPermissions = () => {
  const userInfo = getUserInfo();
  return userInfo && userInfo.permissions ? userInfo.permissions : [];
};

/**
 * 检查是否有权限
 * @param {string} permission - 权限名称
 * @returns {boolean} 是否有权限
 */
export const hasPermission = (permission) => {
  // 超级管理员拥有所有权限
  if (isSuperAdmin()) {
    return true;
  }
  
  const permissions = getUserPermissions();
  return permissions.includes(permission);
};

/**
 * 登出
 */
export const logout = () => {
  removeToken();
  removeUserInfo();
  // 清除其他可能的认证相关存储
  localStorage.removeItem('remembered_username');
};

/**
 * 自动刷新令牌检查（应该在应用初始化时调用）
 */
export const setupTokenAutoRefresh = () => {
  // 每分钟检查一次令牌是否即将过期
  const checkToken = () => {
    if (isAuthenticated() && isTokenExpired()) {
      console.log('令牌即将过期，自动刷新...');
      refreshAccessToken().catch(error => {
        console.error('自动刷新令牌失败:', error);
        // 刷新失败时执行登出操作
        logout();
        // 可以在这里添加重定向到登录页的逻辑
        window.location.href = '/login';
      });
    }
  };
  
  // 立即检查一次
  checkToken();
  
  // 设置定时检查
  return setInterval(checkToken, 60000); // 每分钟检查一次
};

// 导出所有函数
export default {
  setToken,
  getToken,
  getRefreshToken,
  removeToken,
  setUserInfo,
  getUserInfo,
  removeUserInfo,
  parseToken,
  getTokenExpiry,
  isTokenExpired,
  isAuthenticated,
  refreshAccessToken,
  getUsername,
  getUserRole,
  isSuperAdmin,
  getUserPermissions,
  hasPermission,
  logout,
  setupTokenAutoRefresh
};