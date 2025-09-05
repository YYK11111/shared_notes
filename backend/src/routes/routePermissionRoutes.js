const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');

/**
 * 获取用户可访问的路由列表
 * 此接口用于前端动态构建路由表
 */
router.get('/accessible-routes', authMiddleware, async (req, res) => {
  try {
    const admin = req.admin;
    const permissions = req.permissions || [];
    
    // 如果是超级管理员，返回所有路由
    if (admin && admin.role_code === 'super_admin') {
      return res.json(formatSuccess(getAllRoutes(), '获取所有路由成功'));
    }
    
    // 非超级管理员，根据权限过滤路由
    const accessibleRoutes = filterRoutesByPermissions(getAllRoutes(), permissions);
    
    return res.json(formatSuccess(accessibleRoutes, '获取可访问路由成功'));
  } catch (error) {
    console.error('获取可访问路由失败:', error);
    return res.status(500).json(formatError('获取可访问路由失败，请稍后重试', 500));
  }
});

/**
 * 获取所有系统路由配置
 * 这里定义了系统支持的所有路由，前端可以根据这个列表和用户权限动态构建路由表
 */
function getAllRoutes() {
  return [
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: 'Dashboard',
      meta: {
        title: '仪表盘',
        icon: 'dashboard',
        requiresAuth: true,
        permission: null // 仪表盘不需要特定权限
      }
    },
    {
      path: '/admins',
      name: 'Admins',
      component: 'Admins',
      meta: {
        title: '管理员管理',
        icon: 'users',
        requiresAuth: true,
        permission: 'admin_manage' // 需要管理员管理权限
      }
    },
    {
      path: '/notes',
      name: 'Notes',
      component: 'Notes',
      meta: {
        title: '笔记管理',
        icon: 'file-text',
        requiresAuth: true,
        permission: 'article_manage' // 需要文章管理权限
      }
    },
    {
      path: '/categories',
      name: 'Categories',
      component: 'Categories',
      meta: {
        title: '分类管理',
        icon: 'list',
        requiresAuth: true,
        permission: 'category_manage' // 需要分类管理权限
      }
    },
    {
      path: '/feedbacks',
      name: 'Feedbacks',
      component: 'Feedbacks',
      meta: {
        title: '反馈管理',
        icon: 'message-circle',
        requiresAuth: true,
        permission: 'feedback_manage' // 需要反馈管理权限
      }
    },
    {
      path: '/logs',
      name: 'Logs',
      component: 'Logs',
      meta: {
        title: '日志管理',
        icon: 'file-exclamation',
        requiresAuth: true,
        permission: 'log_view' // 需要日志查看权限
      }
    },
    {
      path: '/system',
      name: 'System',
      component: 'System',
      meta: {
        title: '系统设置',
        icon: 'settings',
        requiresAuth: true,
        permission: 'system_config' // 需要系统配置权限
      }
    }
  ];
}

/**
 * 根据用户权限过滤路由
 */
function filterRoutesByPermissions(routes, permissions) {
  return routes.filter(route => {
    // 不需要特定权限的路由，所有已登录用户都可以访问
    if (!route.meta.permission) {
      return true;
    }
    
    // 需要特定权限的路由，检查用户是否拥有该权限
    return permissions && permissions.includes(route.meta.permission);
  });
}

module.exports = router;