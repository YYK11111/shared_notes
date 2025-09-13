<template>
  <div class="front-layout">
    <!-- 头部导航 -->
    <header class="header">
      <div class="container">
        <div class="header-inner">
          <div class="logo">
            <router-link to="/">笔记管理系统</router-link>
          </div>
          
          <nav class="nav">
            <router-link to="/" class="nav-item" active-class="active">首页</router-link>
            <router-link to="/categories" class="nav-item" active-class="active">分类</router-link>
            <router-link to="/search" class="nav-item" active-class="active">搜索</router-link>
          </nav>
          
          <div class="header-right">
            <div class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索笔记..."
                size="small"
                @keypress.enter="handleSearch"
              >
                <template #append>
                  <el-icon @click="handleSearch"><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 主内容区域 -->
    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <p>&copy; 2024 笔记管理系统. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const searchKeyword = ref('')

// 搜索功能
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { keyword: searchKeyword.value.trim() } })
    searchKeyword.value = ''
  }
}
</script>

<style scoped>
.container {
  width: 90%;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.logo a {
  color: #42b983;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-item {
  color: #333;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s;
}

.nav-item:hover,
.nav-item.active {
  color: #42b983;
}

.header-right {
  display: flex;
  align-items: center;
}

.search-box {
  width: 200px;
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 180px);
}

.footer {
  background-color: #f5f5f5;
  padding: 1.5rem 0;
  text-align: center;
}

.footer-inner p {
  color: #666;
  font-size: 0.9rem;
}
</style>