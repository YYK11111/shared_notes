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
      }
    ]
  },
  
  // 认证相关路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  }
]

// 管理员路由（需要权限控制）
const adminRoutes = {
  path: '/admin',
  name: 'AdminLayout',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [] // 动态添加
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
  
  // 已登录访问登录页，跳转到首页
  if (to.path === '/login' && authStore.isLoggedIn) {
    return next('/admin')
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
              case 'System': return () => import('@/views/admin/Config.vue');
              default: return () => import('@/views/admin/Dashboard.vue');
            }
          };
          
          adminRoutes.children.push({
            path: route.path,
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