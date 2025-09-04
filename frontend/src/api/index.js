// API服务统一出口
import authApi from './auth';
import adminApi from './admin';
import noteApi from './note';
import categoryApi from './category';
import systemApi from './system';
import logApi from './log';
import feedbackApi from './feedback';

// 导出所有API服务
export default {
  auth: authApi,
  admin: adminApi,
  note: noteApi,
  category: categoryApi,
  system: systemApi,
  log: logApi,
  feedback: feedbackApi
};

// 也可以直接导出各个API服务，方便单独使用
export { authApi, adminApi, noteApi, categoryApi, systemApi, logApi, feedbackApi };