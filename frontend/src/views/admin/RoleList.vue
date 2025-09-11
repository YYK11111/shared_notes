<template>
  <div class="role-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">角色管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateRole">
              <el-icon><Plus /></el-icon>
              创建角色
            </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedRoles.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索 -->
      <div class="search-filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索角色名称或描述"
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>
      
      <!-- 角色列表 -->
      <el-table
        v-loading="loading"
        :data="rolesData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        :row-key="(row) => row.id"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="name" label="角色名称" min-width="150">
          <template #default="{ row }">
            <span class="role-name" :class="{ 'super-admin': isSuperAdmin(row.id) }">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="user_count" label="用户数" width="100" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ formatDate(row.updated_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditRole(row.id)">编辑</el-button>
            <el-button link type="info" @click="handlePermissions(row.id)" :disabled="isSuperAdmin(row.id)">权限</el-button>
            <el-button link @click="toggleRoleStatus(row.id, row.status)" :disabled="isSuperAdmin(row.id)">
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDeleteRole(row.id)" :disabled="isSuperAdmin(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Plus, Delete, Search } from '@element-plus/icons-vue'
import { getRoleList, deleteRole, updateRoleStatus } from '@/api/admin'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 状态变量
const loading = ref(false)
const rolesData = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRoles = ref([])

// 搜索条件
const searchKeyword = ref('')

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    }
    
    const response = await getRoleList(params)
    // 使用后端返回的status值（0或1），转换为前端显示的'enabled'或'disabled'
    rolesData.value = (response.data?.list || []).map(role => ({
      ...role,
      status: role.status === 1 ? 'enabled' : 'disabled' // 将数字状态转换为字符串表示
    }))
    totalCount.value = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取角色列表失败：' + (error.message || '未知错误'))
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 检查是否可选择（超级管理员角色不可选择）
const checkSelectable = (row) => {
  return !isSuperAdmin(row.id)
}

// 检查是否为超级管理员角色
const isSuperAdmin = (id) => {
  // 假设ID为1的是超级管理员角色
  return id === 1
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRoles()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchRoles()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchRoles()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchRoles()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRoles.value = selection.filter(role => !isSuperAdmin(role.id))
}

// 创建新角色
const handleCreateRole = () => {
  router.push('/admin/role/create')
}

// 编辑角色
const handleEditRole = (id) => {
  router.push('/admin/role/edit/' + id)
}

// 设置角色权限
const handlePermissions = (id) => {
  router.push('/admin/role/permissions/' + id)
}

// 删除角色
const handleDeleteRole = async (id) => {
  if (isSuperAdmin(id)) {
    ElMessage.warning('超级管理员角色不能被删除')
    return
  }
  
  try {
    // 检查角色下是否有用户
    const role = rolesData.value.find(r => r.id === id)
    if (role && role.user_count > 0) {
      await ElMessageBox.alert(
        `该角色下有 ${role.user_count} 个用户，无法删除。请先将用户移除或分配到其他角色。`,
        '删除失败',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      )
      return
    }
    
    await ElMessageBox.confirm(
      '确定要删除这个角色吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteRole(id)
    ElMessage.success('角色删除成功')
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('角色删除失败：' + (error.message || '未知错误'))
      console.error('删除角色失败:', error)
    }
  }
}

// 批量删除角色
const handleBatchDelete = async () => {
  if (selectedRoles.value.length === 0) {
    ElMessage.warning('请选择要删除的角色')
    return
  }
  
  // 检查是否有角色包含用户
  const hasUsersRoles = selectedRoles.value.filter(role => role.user_count > 0)
  if (hasUsersRoles.length > 0) {
    const roleNames = hasUsersRoles.map(role => role.name).join('、')
    await ElMessageBox.alert(
      `以下角色包含用户，无法删除：${roleNames}`,
      '删除失败',
      {
        confirmButtonText: '确定',
        type: 'error'
      }
    )
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRoles.value.length} 个角色吗？删除后将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRoles.value.map(role => role.id)
    // 这里应该调用批量删除API
    // 为了演示，我们模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(`成功删除 ${selectedRoles.value.length} 个角色`)
    selectedRoles.value = []
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error('批量删除失败:', error)
    }
  }
}

// 切换角色状态
const toggleRoleStatus = async (id, currentStatus) => {
  if (isSuperAdmin(id)) {
    ElMessage.warning('超级管理员角色状态不能被修改')
    return
  }
  
  try {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled'
    const actionText = newStatus === 'enabled' ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${actionText}这个角色吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: newStatus === 'enabled' ? 'success' : 'warning'
      }
    )
    
    // 将前端的字符串状态转换为后端需要的数字状态
    const statusValue = newStatus === 'enabled' ? 1 : 0
    await updateRoleStatus(id, { status: statusValue })
    ElMessage.success(`角色${actionText}成功`)
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${actionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${actionText}角色失败:`, error)
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 初始化页面数据
onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.role-list-page {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-filter-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 300px;
}

.search-button, .reset-button {
  white-space: nowrap;
}

.role-name {
  font-weight: 500;
  color: #333;
}

.role-name.super-admin {
  color: #f59e0b;
  font-weight: 600;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .role-list-page {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
}
</style>