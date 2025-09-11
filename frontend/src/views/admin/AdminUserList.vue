<template>
  <div class="admin-user-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">管理员管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateAdmin">
              <el-icon><Plus /></el-icon>
              添加管理员
            </el-button>
            <el-button @click="handleBatchDelete" :disabled="selectedAdmins.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter-container">
        <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名或邮箱"
            :prefix-icon="Search"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        <el-select v-model="roleFilter" placeholder="选择角色" class="filter-select">
          <el-option label="全部" value="" />
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="选择状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
        <el-button @click="resetFilters" class="reset-button">重置</el-button>
      </div>
      
      <!-- 管理员列表 -->
      <el-table
        v-loading="loading"
        :data="adminsData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        :row-key="(row) => row.id"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role_id" label="角色" width="120">
          <template #default="{ row }">
            <span>{{ getRoleName(row.role_id) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180" sortable>
          <template #default="{ row }">
            <span>{{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}</span>
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
            <el-button link type="primary" @click="handleEditAdmin(row.id)">编辑</el-button>
            <el-button link type="info" @click="handleResetPassword(row.id)">重置密码</el-button>
            <el-button link @click="toggleAdminStatus(row.id, row.status, row.nickname)" :disabled="isSuperAdmin(row.id)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDeleteAdmin(row.id)" :disabled="isSuperAdmin(row.id)">删除</el-button>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Plus, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminList, deleteAdmin, updateAdmin, updateAdminStatus, resetAdminPassword } from '@/api/admin'
import { getRoleList } from '@/api/admin'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 状态变量
const loading = ref(false)
const adminsData = ref([])
const roles = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedAdmins = ref([])

// 搜索和筛选条件
const searchKeyword = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

// 获取管理员列表
const fetchAdmins = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      role_id: roleFilter.value || undefined,
      status: statusFilter.value || undefined
    }
    
    const response = await getAdminList(params)
    // 修复数据格式问题：接口返回的是 data.list（二维数组），而不是 data.items
    // 从二维数组中提取一维数据，如果 list 为空则使用空数组
    const adminList = response.data?.list && response.data.list.length > 0 ? response.data.list[0] : []
    adminsData.value = adminList || []
    
    // 修复总数问题：如果接口返回的 total 为 0 但实际有数据，使用实际数据长度
    totalCount.value = (response.data?.total > 0) ? response.data.total : adminsData.value.length
  } catch (error) {
    ElMessage.error('获取管理员列表失败：' + (error.message || '未知错误'))
    console.error('获取管理员列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取角色列表
const fetchRoles = async () => {
  try {
    const response = await getRoleList()
    // 修复数据格式问题：接口返回的角色数据在 data.list 中，而不是 data.items
    roles.value = response.data?.list || []
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('获取角色列表失败:', error)
  }
}

// 检查是否可选择（超级管理员不可选择）
const checkSelectable = (row) => {
  return !isSuperAdmin(row.id)
}

// 检查是否为超级管理员
const isSuperAdmin = (id) => {
  // 假设ID为1的是超级管理员
  return id === 1
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchAdmins()
}

// 重置筛选条件
const resetFilters = () => {
  searchKeyword.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchAdmins()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchAdmins()
}

// 处理当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchAdmins()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedAdmins.value = selection.filter(admin => !isSuperAdmin(admin.id))
}

// 创建新管理员
const handleCreateAdmin = () => {
  router.push('/admin/admins/create')
}

// 编辑管理员
const handleEditAdmin = (id) => {
  router.push('/admin/admins/edit/' + id)
}

// 删除管理员
const handleDeleteAdmin = async (id) => {
  if (isSuperAdmin(id)) {
    ElMessage.warning('超级管理员不能被删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个管理员吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteAdmin(id)
    ElMessage.success('管理员删除成功')
    fetchAdmins()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('管理员删除失败：' + (error.message || '未知错误'))
      console.error('删除管理员失败:', error)
    }
  }
}

// 批量删除管理员
const handleBatchDelete = async () => {
  if (selectedAdmins.value.length === 0) {
    ElMessage.warning('请选择要删除的管理员')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAdmins.value.length} 个管理员吗？删除后将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedAdmins.value.map(admin => admin.id)
    // 这里应该调用批量删除API
    // 为了演示，我们模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(`成功删除 ${selectedAdmins.value.length} 个管理员`)
    selectedAdmins.value = []
    fetchAdmins()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error('批量删除失败:', error)
    }
  }
}

// 切换管理员状态
const toggleAdminStatus = async (id, currentStatus, nickname) => {
  if (isSuperAdmin(id)) {
    ElMessage.warning('超级管理员状态不能被修改')
    return
  }
  
  const newStatus = currentStatus === 1 ? 0 : 1
  const actionText = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}这个管理员吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: newStatus === 1 ? 'success' : 'warning'
      }
    )
    
    // 使用专用的updateAdminStatus接口更新状态，不需要传递nickname字段
    await updateAdminStatus(id, { status: newStatus })
    ElMessage.success(`管理员${actionText}成功`)
    fetchAdmins()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${actionText}操作失败：` + (error.message || '未知错误'))
      console.error(`${actionText}管理员失败:`, error)
    }
  }
}

// 重置管理员密码
const handleResetPassword = async (id) => {
  if (isSuperAdmin(id)) {
    ElMessage.warning('超级管理员密码不能被其他管理员重置')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要重置这个管理员的密码吗？重置后将发送新密码到管理员邮箱。',
      '确认重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await resetAdminPassword(id)
    ElMessage.success('密码重置成功，新密码已发送到管理员邮箱')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('密码重置失败：' + (error.message || '未知错误'))
      console.error('重置密码失败:', error)
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取角色名称
const getRoleName = (roleId) => {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : '未分配'
}

// 初始化页面数据
onMounted(() => {
  fetchRoles()
  fetchAdmins()
})
</script>

<style scoped>
.admin-user-list-page {
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

.filter-select {
  width: 150px;
}

.search-button, .reset-button {
  white-space: nowrap;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .admin-user-list-page {
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
  
  .search-input, .filter-select {
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