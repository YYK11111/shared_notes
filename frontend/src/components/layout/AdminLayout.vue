<template>
  <div class="admin-layout">
    <div class="layout-container">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <router-link to="/admin">后台管理</router-link>
          </div>
        </div>
        
        <nav class="menu">
          <el-menu
            :default-active="activeRoute"
            class="el-menu-vertical-demo"
            router
            @open="handleMenuOpen"
            @close="handleMenuClose"
          >
            <el-menu-item index="dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            
            <el-sub-menu index="notes">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>笔记管理</span>
              </template>
              <el-menu-item index="notes">笔记列表</el-menu-item>
              <el-menu-item index="categories">分类管理</el-menu-item>
            </el-sub-menu>
            
            <el-menu-item index="feedback">
              <el-icon><Message /></el-icon>
              <span>反馈管理</span>
            </el-menu-item>
            
            <el-sub-menu index="system">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系统管理</span>
              </template>
              <el-menu-item index="admins">管理员管理</el-menu-item>
              <el-menu-item index="roles">角色管理</el-menu-item>
              <el-menu-item index="config">系统配置</el-menu-item>
              <el-menu-item index="routes">路由权限</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </nav>
      </aside>
      
      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 顶部导航 -->
        <header class="main-header">
          <div class="header-left">
            <el-button
              type="text"
              icon="el-icon-menu"
              @click="toggleSidebar"
              class="sidebar-toggle"
            />
          </div>
          
          <div class="header-right">
            <div class="user-info">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :size="32">
                    <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                  </el-avatar>
                  <span class="user-name">{{ userInfo?.username || '管理员' }}</span>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>个人中心</el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </header>
        
        <!-- 内容主体 -->
        <div class="content-wrapper">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { HomeFilled, Document, Message, Setting, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)
const activeRoute = computed(() => {
  const path = router.currentRoute.value.path
  return path.replace('/admin/', '') || 'dashboard'
})
const userInfo = computed(() => authStore.userInfo)

// 切换侧边栏
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// 菜单展开
const handleMenuOpen = () => {
  // 可以添加一些展开时的逻辑
}

// 菜单收起
const handleMenuClose = () => {
  // 可以添加一些收起时的逻辑
}

// 退出登录
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
    ElMessage.success('退出登录成功')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 240px;
  background-color: #2c3e50;
  color: #fff;
  transition: width 0.3s;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #34495e;
}

.sidebar .logo {
  font-size: 1.2rem;
  font-weight: bold;
}

.sidebar .logo a {
  color: #fff;
  text-decoration: none;
}

.menu {
  padding: 20px 0;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.main-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.sidebar-toggle {
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-name {
  margin: 0 8px;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}
</style>