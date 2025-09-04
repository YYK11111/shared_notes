import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import Dashboard from '../views/Dashboard.vue';
import Admins from '../views/Admins.vue';
import AdminForm from '../views/AdminForm.vue';
import Notes from '../views/Notes.vue';
import NoteForm from '../views/NoteForm.vue';
import Categories from '../views/Categories.vue';
import System from '../views/System.vue';
import Logs from '../views/Logs.vue';
import Feedbacks from '../views/Feedbacks.vue';
import NotFound from '../views/NotFound.vue';
import auth from '../utils/auth';

// 定义路由
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
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: '首页'
    },
    children: [
      // 仪表盘
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          requiresAuth: true,
          title: '数据仪表盘',
          permission: 'article_manage' // 使用用户已有的权限
        }
      },
      
      // 管理员管理
      {
        path: '/admins',
        name: 'Admins',
        component: Admins,
        meta: {
          requiresAuth: true,
          title: '管理员列表',
          permission: 'admin.view'
        }
      },
      {
        path: '/admins/create',
        name: 'AdminCreate',
        component: AdminForm,
        meta: {
          requiresAuth: true,
          title: '创建管理员',
          permission: 'admin.create'
        }
      },
      {
        path: '/admins/edit/:id',
        name: 'AdminEdit',
        component: AdminForm,
        meta: {
          requiresAuth: true,
          title: '编辑管理员',
          permission: 'admin.edit'
        }
      },
      
      // 笔记管理
      {
        path: '/notes',
        name: 'Notes',
        component: Notes,
        meta: {
          requiresAuth: true,
          title: '笔记列表',
          permission: 'article_manage' // 使用用户已有的权限
        }
      },
      {
        path: '/notes/create',
        name: 'NoteCreate',
        component: NoteForm,
        meta: {
          requiresAuth: true,
          title: '创建笔记',
          permission: 'article_manage' // 使用用户已有的权限
        }
      },
      {
        path: '/notes/:id',
        name: 'NoteDetail',
        component: NoteForm,
        meta: {
          requiresAuth: true,
          title: '笔记详情',
          permission: 'article_manage' // 使用用户已有的权限
        }
      },
      {
        path: '/notes/edit/:id',
        name: 'NoteEdit',
        component: NoteForm,
        meta: {
          requiresAuth: true,
          title: '编辑笔记',
          permission: 'article_manage' // 使用用户已有的权限
        }
      },
      
      // 分类管理
      {
        path: '/categories',
        name: 'Categories',
        component: Categories,
        meta: {
          requiresAuth: true,
          title: '分类管理',
          permission: 'category.view'
        }
      },
      
      // 系统设置
      {
        path: '/system',
        name: 'System',
        component: System,
        meta: {
          requiresAuth: true,
          title: '系统设置',
          permission: 'system.view'
        }
      },
      
      // 日志管理
      {
        path: '/logs',
        name: 'Logs',
        component: Logs,
        meta: {
          requiresAuth: true,
          title: '日志管理',
          permission: 'log.view'
        }
      },
      
      // 反馈管理
      {
        path: '/feedbacks',
        name: 'Feedbacks',
        component: Feedbacks,
        meta: {
          requiresAuth: true,
          title: '反馈管理',
          permission: 'feedback.view'
        }
      }
    ]
  },
  {    path: '/:pathMatch(.*)*',    name: 'NotFound',    component: NotFound,    meta: {      requiresAuth: false,      title: '页面不存在'    }  },  
  // 特别处理 /node 路由，避免被错误重定向到登录页  
  {    path: '/node',    name: 'NodeNotFound',    component: NotFound,    meta: {      requiresAuth: false,      title: '页面不存在'    }  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 路由守卫
 * 处理登录验证、权限检查、页面标题设置等
 */
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '个人笔记分享平台 - 管理后台';
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 检查登录状态
    if (!auth.isAuthenticated()) {
      // 如果未登录且尝试访问需要登录的页面，重定向到登录页
      // 保存当前路由，登录成功后可以跳回
      localStorage.setItem('redirect_after_login', to.fullPath);
      next({ name: 'Login' });
      return;
    }
    
    // 检查令牌是否过期
    if (auth.isTokenExpired()) {
      // 令牌已过期，清除登录状态并跳转到登录页
      auth.logout();
      localStorage.setItem('redirect_after_login', to.fullPath);
      next({ name: 'Login' });
      return;
    }
    
    // 检查权限
    if (to.meta.permission) {
      // 如果用户是超级管理员，跳过权限检查
      if (auth.isSuperAdmin()) {
        console.log('超级管理员，跳过权限检查');
        next();
        return;
      }
      
      const hasPerm = auth.hasPermission(to.meta.permission);
      console.log(`检查权限: ${to.meta.permission}, 结果: ${hasPerm}`);
      console.log('用户拥有的权限:', auth.getUserPermissions());
      
      // 检查用户是否有访问权限
      if (!hasPerm) {
        // 没有权限，显示提示信息并跳转到首页
        console.warn(`无权限访问: ${to.path} (需要权限: ${to.meta.permission})`);
        next({ name: 'Dashboard' });
        // 使用全局提示组件显示无权限信息
        if (window.app) {
          window.app.$notify.error({
            title: '权限不足',
            message: `您没有访问${to.meta.title}的权限`,
            duration: 3000
          });
        }
        return;
      }
    }
    
    // 验证通过，允许访问
    next();
  } else {
    // 不需要认证的页面，直接允许访问
    // 如果已登录，并且尝试访问登录页，重定向到首页
    if (to.name === 'Login' && auth.isAuthenticated()) {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  }
});

/**
 * 路由跳转后处理
 */
router.afterEach((to, from) => {
  // 记录路由访问日志（实际项目中可以发送到服务器）
  if (to.meta.requiresAuth && auth.isAuthenticated()) {
    console.log(`用户 ${auth.getUsername()} 访问了页面: ${to.meta.title}(${to.path})`);
  }
  
  // 滚动到页面顶部
  window.scrollTo(0, 0);
});

/**
 * 路由错误处理
 */
router.onError((error) => {
  console.error('路由加载错误:', error);
  // 可以在这里处理路由加载错误，如显示错误页面
});

export default router;