<template>
  <div class="routes-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">路由权限管理</h2>
        </div>
      </template>
      
      <!-- 路由权限说明 -->
      <div class="routes-info">
        <el-alert title="路由权限说明" type="info" :closable="false">
          <div class="info-content">
            <p>此页面用于展示系统中的路由权限配置信息。</p>
            <p>系统会根据用户角色自动分配可访问的路由权限。</p>
          </div>
        </el-alert>
      </div>
      
      <!-- 路由列表 -->
      <div class="routes-list-section">
        <h3 class="section-title">系统路由列表</h3>
        <el-table
          v-loading="loading"
          :data="routesData"
          style="width: 100%"
          border
        >
          <el-table-column prop="path" label="路由路径" width="200" />
          <el-table-column prop="name" label="路由名称" width="150" />
          <el-table-column prop="title" label="显示标题" width="150" />
          <el-table-column prop="permission" label="所需权限" min-width="180">
            <template #default="{ row }">
              <el-tag v-if="row.permission" type="primary">
                {{ row.permission }}
              </el-tag>
              <span v-else class="no-permission">无需权限</span>
            </template>
          </el-table-column>
          <el-table-column prop="accessible" label="当前可访问" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.accessible"
                disabled
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 权限说明 -->
      <div class="permissions-section">
        <h3 class="section-title">权限说明</h3>
        <div class="permissions-list">
          <el-tag
            v-for="permission in permissionsList"
            :key="permission"
            size="small"
            class="permission-tag"
          >
            {{ permission }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAccessibleRoutes } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const loading = ref(false)
const routesData = ref([])
const permissionsList = ref([])

// 获取路由权限数据
const fetchRoutesData = async () => {
  loading.value = true
  try {
    // 获取可访问路由
    const response = await getAccessibleRoutes()
    
    if (response.code === 200 && response.data) {
      // 构建路由数据
      const allRoutes = [
        { path: '/dashboard', name: 'Dashboard', title: '仪表盘', permission: null },
        { path: '/notes', name: 'NoteList', title: '笔记管理', permission: 'admin:note:list' },
        { path: '/categories', name: 'CategoryList', title: '分类管理', permission: 'category_manage' },
        { path: '/feedbacks', name: 'FeedbackList', title: '反馈管理', permission: 'feedback_manage' },
        { path: '/admins', name: 'AdminUserList', title: '管理员管理', permission: 'admin_manage' },
        { path: '/roles', name: 'RoleList', title: '角色管理', permission: 'admin:role:list' },
        { path: '/config', name: 'Config', title: '系统配置', permission: 'system_config' },
        { path: '/routes', name: 'Routes', title: '路由权限', permission: 'route_permission' },
        { path: '/search-management', name: 'SearchManagement', title: '搜索管理', permission: 'admin:search:manage' }
      ]
      
      // 确定哪些路由是可访问的
      const accessibleRouteNames = response.data.map(route => route.name)
      
      routesData.value = allRoutes.map(route => ({
        ...route,
        accessible: accessibleRouteNames.includes(route.name)
      }))
      
      // 获取当前用户的权限列表
      const userPermissions = authStore.userInfo?.permissions || []
      permissionsList.value = [...new Set(userPermissions)]
    } else {
      ElMessage.error('获取路由权限数据失败')
    }
  } catch (error) {
    console.error('Failed to fetch routes data:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRoutesData()
})
</script>

<style scoped>
.routes-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.routes-info {
  margin-bottom: 20px;
}

.info-content {
  margin-top: 10px;
  line-height: 1.6;
}

.routes-list-section,
.permissions-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.no-permission {
  color: #909399;
  font-size: 14px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.permission-tag {
  margin: 2px;
}
</style>