import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import auth from '../utils/auth';

// 定义简化的路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: '数据仪表盘'
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 简单的路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '个人笔记分享平台';
  
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated()) {
      next({ name: 'Login' });
    } else {
      next();
    }
  } else {
    if (to.name === 'Login' && auth.isAuthenticated()) {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  }
});

export default router;