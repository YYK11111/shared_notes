import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import FrontLayout from '@/components/layout/FrontLayout.vue'

// 静态路由
const staticRoutes = [
  // 前台路由
  {
    path: '/',
    name: 'FrontLayout',
    component: FrontLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/front/Home.vue')
      },
      {
        path: 'notes/:id',
        name: 'NoteDetail',
        component: () => import('@/views/front/NoteDetail.vue')
      },
      {
        path: 'categories/:id',
        name: 'CategoryNotes',
        component: () => import('@/views/front/CategoryDetail.vue')
      },
      {        
        path: 'search',
        name: 'Search',
        component: () => import('@/views/front/SearchResult.vue')
      },
      {        
        path: 'categories',
        name: 'CategoryList',
        component: () => import('@/views/front/CategoryList.vue')
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/front/Feedback.vue')
      }
    ]
  },
  
  // 认证相关路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  
  // admin 根路径重定向到仪表盘
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true }
  }]

// 管理员路由（需要权限控制）
const adminRoutes = {
  path: '/admin',
  name: 'AdminLayout',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [
    // 添加默认仪表盘路由，确保即使动态路由加载失败也能访问
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: {
        title: '仪表盘',
        icon: 'dashboard',
        requiresAuth: true
      }
    },
    // 分类创建和编辑路由
    {
      path: 'categories/create',
      name: 'CategoryCreate',
      component: () => import('@/views/admin/CategoryCreate.vue'),
      meta: {
        title: '创建分类',
        requiresAuth: true
      }
    },
    {
      path: 'categories/edit/:id',
      name: 'CategoryEdit',
      component: () => import('@/views/admin/CategoryEdit.vue'),
      meta: {
        title: '编辑分类',
        requiresAuth: true
      }
    },
    {
      path: 'notes',
      name: 'NoteList',
      component: () => import('@/views/admin/NoteList.vue'),
      meta: {
        title: '笔记管理',
        requiresAuth: true,
        permissions: ['admin:note:list']
      }
    },
    {
      path: 'notes/create',
      name: 'NoteCreate',
      component: () => import('@/views/admin/NoteEdit.vue'),
      meta: {
        title: '创建笔记',
        requiresAuth: true,
        permissions: ['admin:note:create']
      }
    },
    {
      path: 'notes/edit/:id',
      name: 'NoteEdit',
      component: () => import('@/views/admin/NoteEdit.vue'),
      meta: {
        title: '编辑笔记',
        requiresAuth: true,
        permissions: ['admin:note:edit']
      }
    },
    {
      path: 'notes/preview/:id',
      name: 'NotePreview',
      component: () => import('@/views/admin/NotePreview.vue'),
      meta: {
        title: '笔记预览',
        requiresAuth: true,
        permissions: ['admin:note:list']
      }
    },
    {
      path: 'admins/create',
      name: 'AdminCreate',
      component: () => import('@/views/admin/AdminCreate.vue'),
      meta: {
        title: '创建管理员',
        requiresAuth: true,
        permissions: ['admin:admin:create']
      }
    },
    // 编辑管理员
    {
      path: 'admins/edit/:id',
      name: 'AdminEdit',
      component: () => import('@/views/admin/AdminEdit.vue'),
      meta: {
        title: '编辑管理员',
        requiresAuth: true,
        permissions: ['admin:admin:edit']
      }
    },
    // 角色管理
    {
      path: 'roles',
      name: 'RoleList',
      component: () => import('@/views/admin/RoleList.vue'),
      meta: {
        title: '角色管理',
        requiresAuth: true,
        permissions: ['admin:role:list']
      }
    },
    // 系统配置路由组
    {          path: 'config',          name: 'Config',          component: () => import('@/views/admin/config/SystemConfig.vue'),          meta: {            title: '系统配置',            requiresAuth: true,            permissions: ['admin:system:config']          }        },
    // 路由管理
    {
      path: 'routes',
      name: 'Routes',
      component: () => import('@/views/admin/Routes.vue'),
      meta: {
        title: '路由管理',
        requiresAuth: true,
        permissions: ['admin:routes:view']
      }
    },
    // 搜索管理
    {
      path: 'search-management',
      name: 'SearchManagement',
      component: () => import('@/views/admin/SearchManagement.vue'),
      meta: {
        title: '搜索管理',
        requiresAuth: true,
        permissions: ['admin:search:manage']
      }
    },
    
    // 敏感词管理
    {
      path: 'sensitive-words',
      name: 'SensitiveWords',
      component: () => import('@/views/admin/SensitiveWords.vue'),
      meta: {
        title: '敏感词管理',
        requiresAuth: true,
        permissions: ['admin:system:config']
      }
    },
    
    // 轮播图管理
    {
      path: 'carousels',
      name: 'CarouselList',
      component: () => import('@/views/admin/CarouselList.vue'),
      meta: {
        title: '轮播图管理',
        requiresAuth: true,
        permissions: ['admin:carousel:list']
      }
    },
    {
      path: 'carousels/create',
      name: 'CarouselCreate',
      component: () => import('@/views/admin/CarouselEdit.vue'),
      meta: {
        title: '创建轮播图',
        requiresAuth: true,
        permissions: ['admin:carousel:create']
      }
    },
    {
      path: 'carousels/edit/:id',
      name: 'CarouselEdit',
      component: () => import('@/views/admin/CarouselEdit.vue'),
      meta: {
        title: '编辑轮播图',
        requiresAuth: true,
        permissions: ['admin:carousel:edit']
      }
    }
  ]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)
  
  // 未登录访问需要认证的页面，跳转到登录页
  if (requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }
  
  // 已登录访问登录页，跳转到仪表盘
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/admin/dashboard')
  }

  // 重定向旧的dashboard路径到带admin前缀的路径
  if (to.path === '/dashboard') {
    return next('/admin/dashboard')
  }
  
  // 处理管理员路由
  if (to.path.startsWith('/admin') && authStore.isLoggedIn) {
    // 如果还没有加载动态路由
    if (authStore.routes.length === 0) {
      try {
        // 获取可访问的路由
        const accessibleRoutes = await authStore.getAccessibleRoutes()
        
        // 动态添加路由
        accessibleRoutes.forEach(route => {
          // 使用直接导入函数替代模板字符串导入，避免路径解析问题
          const getComponent = (componentName) => {
            switch(componentName) {
              case 'Dashboard': return () => import('@/views/admin/Dashboard.vue');
              case 'Admins': return () => import('@/views/admin/AdminUserList.vue');
              case 'Notes': return () => import('@/views/admin/NoteList.vue');
              case 'Categories': return () => import('@/views/admin/CategoryList.vue');
              case 'Feedbacks': return () => import('@/views/admin/FeedbackList.vue');
              case 'Logs': return () => import('@/views/admin/Dashboard.vue'); // 暂无Logs组件
              case 'System': return () => import('@/views/admin/config/SystemConfig.vue');
              case 'Roles': return () => import('@/views/admin/RoleList.vue');
              default: return () => import('@/views/admin/Dashboard.vue');
            }
          };
          
          // 确保子路由路径格式正确 - 移除前导斜杠，因为父路由已经有路径前缀
          const routePath = route.path.startsWith('/') ? route.path.substring(1) : route.path;
          
          adminRoutes.children.push({
            path: routePath,
            name: route.name,
            component: getComponent(route.component),
            meta: route.meta
          })
        })
        
        router.addRoute(adminRoutes)
        
        // 重新导航到目标路由
        return next({ ...to, replace: true })
      } catch (error) {
        console.error('Failed to load routes:', error)
        return next('/login')
      }
    }
  }
  
  next()
})

export default router