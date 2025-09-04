
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import auth from './utils/auth';
import './style.css';

// 应用初始化前的准备工作
const initializeApp = async () => {
  // 检查是否有令牌，并且是否即将过期
  if (auth.getToken()) {
    // 立即检查令牌是否过期
    if (auth.isTokenExpired()) {
      try {
        // 尝试刷新令牌
        await auth.refreshAccessToken();
        console.log('应用启动时刷新令牌成功');
      } catch (error) {
        console.error('应用启动时刷新令牌失败:', error);
        // 刷新失败，清除登录状态
        auth.logout();
      }
    }
  }

  // 设置全局请求拦截器，为所有XMLHttpRequest和fetch请求添加Authorization头
  // 拦截XMLHttpRequest - 修复版本：在open()之后设置请求头
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    // 先调用原始的open方法
    const result = originalXhrOpen.apply(this, arguments);
    
    // 检查URL是否需要添加令牌
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const token = auth.getToken();
      if (token) {
        try {
          this.setRequestHeader('Authorization', `Bearer ${token}`);
        } catch (error) {
          // 忽略在特殊状态下设置请求头失败的错误
          console.warn('设置Authorization头失败:', error);
        }
      }
    }
    return result;
  };

  // 拦截fetch请求
  const originalFetch = window.fetch;
  window.fetch = async function(resource, options = {}) {
    // 确保options存在并有headers对象
    options.headers = options.headers || {};
    if (typeof options.headers !== 'object' || options.headers === null) {
      options.headers = {};
    }

    // 检查是否是相对路径请求
    if (typeof resource === 'string' && !resource.startsWith('http://') && !resource.startsWith('https://')) {
      const token = auth.getToken();
      if (token) {
        // 如果headers是Headers对象
        if (options.headers instanceof Headers) {
          options.headers.set('Authorization', `Bearer ${token}`);
        } else {
          // 如果headers是普通对象
          options.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    try {
      return await originalFetch(resource, options);
    } catch (error) {
      console.error('Fetch请求失败:', error);
      throw error;
    }
  };

  // 创建Vue应用实例
  const app = createApp(App);

  // 注册Element Plus组件库
  app.use(ElementPlus);

  // 注册路由
  app.use(router);

  // 挂载应用
  app.mount('#app');

  // 全局存储app实例，便于在路由守卫等地方访问
  window.app = app;

  // 设置自动刷新令牌
  const tokenRefreshInterval = auth.setupTokenAutoRefresh();

  // 在应用卸载时清除定时器
  window.addEventListener('beforeunload', () => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }
  });
};

// 启动应用
initializeApp().catch(error => {
  console.error('应用初始化失败:', error);
  // 如果初始化失败，仍然创建一个基本的应用实例，以显示错误信息
  const app = createApp({
    template: `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5;">
        <div style="text-align: center;">
          <h1 style="color: #ff4d4f;">应用启动失败</h1>
          <p style="color: #666; margin-top: 16px;">请刷新页面重试，如果问题持续，请联系管理员</p>
          <button 
            style="margin-top: 24px; padding: 8px 16px; background-color: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;"
            onclick="location.reload()"
          >
            刷新页面
          </button>
        </div>
      </div>
    `
  });
  app.mount('#app');
});
