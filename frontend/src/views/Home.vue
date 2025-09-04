<template>
  <el-container class="admin-container">
    <!-- 侧边栏 -->
    <el-aside
      :width="isCollapse ? '64px' : '240px'"
      class="sidebar"
      :class="{ 'sidebar-collapsed': isCollapse }"
    >
      <div class="sidebar-header">
        <el-image
          v-if="!isCollapse"
          src="/vite.svg"
          class="sidebar-logo"
          fit="contain"
        />
        <span v-if="!isCollapse" class="sidebar-title">笔记分享平台</span>
      </div>
      
      <el-menu
        :collapse="isCollapse"
        :collapse-transition="false"
        active-text-color="#4f46e5"
        background-color="#ffffff"
        text-color="#333333"
        unique-opened
        router
        :default-active="route.path"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <!-- 主导航 -->
        <el-sub-menu index="1">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span v-if="!isCollapse">首页</span>
          </template>
          <el-menu-item index="/" :to="{ path: '/' }">
            <el-icon><Grid /></el-icon>
            <span v-if="!isCollapse">仪表盘</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 内容管理 -->
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Document /></el-icon>
            <span v-if="!isCollapse">内容管理</span>
          </template>
          <el-menu-item index="/notes" :to="{ path: '/notes' }">
            <el-icon><Files /></el-icon>
            <span v-if="!isCollapse">笔记列表</span>
          </el-menu-item>
          <el-menu-item index="/notes/create" :to="{ path: '/notes/create' }">
            <el-icon><Edit /></el-icon>
            <span v-if="!isCollapse">创建笔记</span>
          </el-menu-item>
          <el-menu-item index="/categories" :to="{ path: '/categories' }">
            <el-icon><Collection /></el-icon>
            <span v-if="!isCollapse">分类管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 用户与权限 -->
        <el-sub-menu index="3">
          <template #title>
            <el-icon><User /></el-icon>
            <span v-if="!isCollapse">用户与权限</span>
          </template>
          <el-menu-item index="/admins" :to="{ path: '/admins' }">
            <el-icon><UserFilled /></el-icon>
            <span v-if="!isCollapse">管理员列表</span>
          </el-menu-item>
          <el-menu-item index="/admins/create" :to="{ path: '/admins/create' }">
            <el-icon><User /></el-icon>
            <span v-if="!isCollapse">创建管理员</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 系统设置 -->
        <el-sub-menu index="4">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span v-if="!isCollapse">系统设置</span>
          </template>
          <el-menu-item index="/settings/site">
            <el-icon><Monitor /></el-icon>
            <span v-if="!isCollapse">站点设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/database">
            <el-icon><Grid /></el-icon>
            <span v-if="!isCollapse">数据库设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/search">
            <el-icon><Search /></el-icon>
            <span v-if="!isCollapse">搜索设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/security">
            <el-icon><Lock /></el-icon>
            <span v-if="!isCollapse">安全设置</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 日志管理 -->
        <el-sub-menu index="5">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span v-if="!isCollapse">日志管理</span>
          </template>
          <el-menu-item index="/logs">
            <el-icon><DocumentCopy /></el-icon>
            <span v-if="!isCollapse">操作日志</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 反馈管理 -->
        <el-sub-menu index="6">
          <template #title>
            <el-icon><Message /></el-icon>
            <span v-if="!isCollapse">反馈管理</span>
          </template>
          <el-menu-item index="/feedback">
            <el-icon><Message /></el-icon>
            <span v-if="!isCollapse">用户反馈</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区域 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            icon="Menu"
            @click="toggleSidebar"
            class="collapse-btn"
          />
          <div class="breadcrumb">
            <el-breadcrumb :separator="'/'">
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumbList"
                :key="index"
                :to="item.path"
                class="breadcrumb-item"
              >
                <span v-if="index === breadcrumbList.length - 1" class="breadcrumb-item-active">{{ item.meta.title }}</span>
                <span v-else>{{ item.meta.title }}</span>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>
        
        <div class="header-right">
          <el-dropdown class="user-dropdown">
            <span class="user-info">
              <el-avatar
                :src="userInfo.avatar || '/vite.svg'"
                icon="UserFilled"
                class="user-avatar"
              />
              <span v-if="userInfo.nickname" class="user-name">{{ userInfo.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">
                  <el-icon><Lock /></el-icon>
                  <span>修改密码</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><Lock /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 主内容 -->
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import auth from '../utils/auth';
import api from '../utils/api';

// 路由实例
const router = useRouter();
const route = useRoute();

// 侧边栏折叠状态
const isCollapse = ref(false);

// 用户信息
const userInfo = ref(auth.getUserInfo() || {});

// 面包屑列表
const breadcrumbList = computed(() => {
  const matched = route.matched;
  return matched.filter(item => item.meta && item.meta.title);
});

// 处理菜单选择事件
const handleMenuSelect = (index, indexPath, item) => {
  console.log('菜单选择路径:', index);
  console.log('当前路由路径:', route.path);
  // 确保路由正常跳转
  if (index && index !== route.path) {
    console.log('执行路由跳转:', index);
    router.push(index).then(() => {
      console.log('路由跳转成功');
    }).catch(error => {
      console.error('路由跳转失败:', error);
    });
  }
};

// 切换侧边栏展开/折叠
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value;
};

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '确认退出',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        // 调用退出登录API
        await api.auth.logout();
      } catch (error) {
        console.error('退出登录失败:', error);
      } finally {
        // 清除用户认证信息
        auth.logout();
        
        // 跳转到登录页
        router.push('/login');
        
        // 显示退出登录成功消息
        ElMessage.success('退出登录成功');
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 处理修改密码
const handleChangePassword = () => {
  // 可以跳转到修改密码页面，或者弹出修改密码的对话框
  ElMessage.info('修改密码功能正在开发中...');
};

// 监听路由变化，更新面包屑
watch(
  () => route,
  () => {
    // 路由变化时，面包屑会自动更新
  },
  { deep: true }
);

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await api.auth.getCurrentUser();
    if (res.code === 200 && res.data) {
      userInfo.value = res.data;
      auth.setUserInfo(res.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
</script>

<style scoped>
/* 主容器样式 */
.admin-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
}

/* 侧边栏样式 */
.sidebar {
  background-color: #ffffff;
  border-right: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  background-color: #ffffff;
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border-radius: var(--border-radius-small);
  transition: all 0.3s ease;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  transition: opacity 0.3s ease;
}

.sidebar-menu {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 8px 0;
}

/* 侧边栏折叠状态 */
.sidebar-collapsed .sidebar-title {
  display: none;
}

.sidebar-collapsed .sidebar-menu {
  padding: 0;
}

/* Element Plus 菜单样式覆盖 */
:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  border-radius: var(--border-radius-base);
  margin: 2px 10px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #f0f9ff;
  color: var(--primary-color);
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background-color: #e6f7ff;
  color: var(--primary-color);
  font-weight: 500;
}

/* 主内容区域样式 */
.main-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background-color: var(--bg-color);
}

/* 顶部导航栏样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--box-shadow-base);
  transition: box-shadow 0.3s ease;
  z-index: 5;
}

.header:hover {
  box-shadow: var(--box-shadow-hover);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  margin-right: 20px;
  color: var(--text-secondary);
  font-size: 18px;
  transition: all 0.3s ease;
  padding: 6px;
  border-radius: var(--border-radius-small);
}

.collapse-btn:hover {
  color: var(--primary-color);
  background-color: #f0f9ff;
}

/* 面包屑样式 */
.breadcrumb {
  font-size: 14px;
}

:deep(.el-breadcrumb__item) {
  transition: all 0.3s ease;
}

:deep(.el-breadcrumb__separator) {
  color: var(--text-secondary);
  margin: 0 8px;
}

.breadcrumb-item {
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.breadcrumb-item:hover {
  color: var(--primary-color);
}

.breadcrumb-item-active {
  color: var(--primary-color);
  font-weight: 500;
}

/* 顶部右侧样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: var(--border-radius-base);
}

.user-dropdown:hover {
  background-color: #f5f5f5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.user-info:hover .user-avatar {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.user-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 主内容样式 */
.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--bg-color);
  transition: all 0.3s ease;
}

/* 自定义滚动条样式 */
.sidebar-menu::-webkit-scrollbar,
.content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track,
.content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-thumb,
.content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover,
.content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 1200px) {
  .content {
    padding: 16px;
  }
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 64px !important;
  }
  
  .sidebar-title {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .header {
    padding: 0 16px;
  }
  
  .content {
    padding: 12px;
  }
  
  .breadcrumb {
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .header-right {
    gap: 8px;
  }
  
  .collapse-btn {
    margin-right: 12px;
  }
}
</style>