<template>
  <div class="admins-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h1>管理员管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateAdmin">
            <el-icon><User /></el-icon>
            <span>创建管理员</span>
          </el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            class="search-select"
          >
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            <span>重置</span>
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0">
            <el-icon><Delete /></el-icon>
            <span>批量删除</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 管理员列表 -->
    <el-card class="admin-list-card">
      <el-table
        v-loading="loading"
        :data="adminList"
        style="width: 100%"
        border
        row-key="id"
        :row-class-name="tableRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          :reserve-selection="true"
        />
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
        />
        <el-table-column
          prop="username"
          label="用户名"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="nickname"
          label="昵称"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="email"
          label="邮箱"
          min-width="180"
          align="center"
        />
        <el-table-column
          prop="phone"
          label="手机号"
          min-width="120"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="role"
          label="角色"
          min-width="100"
          align="center"
          formatter="formatRole"
        />
        <el-table-column
          prop="status"
          label="状态"
          width="100"
          align="center"
          formatter="formatStatus"
        >
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
              :disabled="isSelf(scope.row.id)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          min-width="160"
          align="center"
          formatter="formatDate"
        />
        <el-table-column
          prop="updatedAt"
          label="更新时间"
          min-width="160"
          align="center"
          formatter="formatDate"
        />
        <el-table-column
          label="操作"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEditAdmin(scope.row)"
              :disabled="isSelf(scope.row.id) && !isSuperAdmin"
            >
              <el-icon><Edit /></el-icon>
              <span>编辑</span>
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteAdmin(scope.row)"
              :disabled="isSelf(scope.row.id) || adminList.length <= 1"
            >
              <el-icon><Delete /></el-icon>
              <span>删除</span>
            </el-button>
            <el-button
              size="small"
              @click="handleResetPassword(scope.row)"
            >
              <el-icon><Lock /></el-icon>
              <span>重置密码</span>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';
import auth from '../utils/auth';

// 路由实例
const router = useRouter();

// 加载状态
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  username: '',
  status: ''
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 管理员列表
const adminList = ref([]);

// 选中的行
const selectedRowKeys = ref([]);

// 当前用户信息
const currentUser = computed(() => auth.getUserInfo() || {});

// 是否是超级管理员
const isSuperAdmin = computed(() => currentUser.value.role === 'super_admin');

// 格式化角色
const formatRole = (row) => {
  const roleMap = {
    'super_admin': '超级管理员',
    'admin': '管理员'
  };
  return roleMap[row.role] || '普通用户';
};

// 格式化状态
const formatStatus = (row) => {
  return row.status === 1 ? '启用' : '禁用';
};

// 格式化日期
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return '-';
  const date = new Date(cellValue);
  return date.toLocaleString('zh-CN');
};

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (isSelf(row.id)) {
    return 'self-row';
  }
  return '';
};

// 判断是否是当前用户
const isSelf = (userId) => {
  return currentUser.value.id === userId;
};

// 处理选中行变化
const handleSelectionChange = (selection) => {
  selectedRowKeys.value = selection.map(row => row.id);
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchAdminList();
};

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    status: ''
  });
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  fetchAdminList();
};

// 处理创建管理员
const handleCreateAdmin = () => {
  router.push('/admins/create');
};

// 处理编辑管理员
const handleEditAdmin = (row) => {
  router.push(`/admins/edit/${row.id}`);
};

// 处理删除管理员
const handleDeleteAdmin = async (row) => {
  // 不能删除最后一个管理员
  if (adminList.value.length <= 1) {
    ElMessage.warning('系统至少需要保留一个管理员');
    return;
  }
  
  // 不能删除当前登录用户
  if (isSelf(row.id)) {
    ElMessage.warning('不能删除当前登录的管理员');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员 ${row.username} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.admin.deleteAdmin(row.id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      fetchAdminList();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    console.error('删除管理员失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('删除失败');
  }
};

// 处理批量删除
const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    ElMessage.warning('请选择要删除的管理员');
    return;
  }
  
  // 检查是否包含当前用户
  if (selectedRowKeys.value.includes(currentUser.value.id)) {
    ElMessage.warning('不能删除当前登录的管理员');
    return;
  }
  
  // 检查是否删除所有管理员
  if (selectedRowKeys.value.length === adminList.value.length && adminList.value.length <= 1) {
    ElMessage.warning('系统至少需要保留一个管理员');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRowKeys.value.length} 个管理员吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.admin.batchDeleteAdmins(selectedRowKeys.value);
    if (res.code === 200) {
      ElMessage.success(`成功删除 ${res.data.deletedCount} 个管理员`);
      selectedRowKeys.value = [];
      fetchAdminList();
    } else {
      ElMessage.error(res.message || '批量删除失败');
    }
  } catch (error) {
    console.error('批量删除管理员失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('批量删除失败');
  }
};

// 处理状态切换
const handleStatusChange = async (row) => {
  try {
    const res = await api.admin.toggleAdminStatus(row.id, row.status);
    if (res.code !== 200) {
      // 如果失败，恢复原来的状态
      row.status = row.status === 1 ? 0 : 1;
      ElMessage.error(res.message || '状态切换失败');
    } else {
      ElMessage.success(`管理员 ${row.username} 已${row.status === 1 ? '启用' : '禁用'}`);
    }
  } catch (error) {
    console.error('状态切换失败:', error);
    // 如果失败，恢复原来的状态
    row.status = row.status === 1 ? 0 : 1;
    ElMessage.error('状态切换失败');
  }
};

// 处理重置密码
const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置管理员 ${row.username} 的密码吗？`,
      '确认重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.admin.resetAdminPassword(row.id);
    if (res.code === 200) {
      ElMessage.success(`管理员 ${row.username} 的密码已重置为：${res.data.newPassword}`);
    } else {
      ElMessage.error(res.message || '重置密码失败');
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('重置密码失败');
  }
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchAdminList();
};

// 处理当前页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  fetchAdminList();
};

// 获取管理员列表
const fetchAdminList = async () => {
  try {
    loading.value = true;
    
    const params = {
      username: searchForm.username,
      status: searchForm.status,
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    };
    
    // 调用API获取管理员列表
    const res = await api.admin.getAdminList(params);
    
    if (res.code === 200) {
      adminList.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取管理员列表失败');
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    ElMessage.error('获取管理员列表失败');
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取管理员列表
onMounted(() => {
  fetchAdminList();
});

// 导出需要在模板中使用的方法
window.formatRole = formatRole;
window.formatStatus = formatStatus;
window.formatDate = formatDate;
</script>

<style scoped>
/* 管理员管理页面容器 */
.admins-container {
  padding: 0 0 20px 0;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 搜索筛选卡片 */
.search-filter-card {
  margin-bottom: 24px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-form {
  padding: 20px;
}

.search-input,
.search-select {
  width: 180px;
}

/* 管理员列表卡片 */
.admin-list-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 当前用户行样式 */
:deep(.el-table .self-row) {
  background-color: #f0f9ff !important;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式调整 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 500;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 8px;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 1200px) {
  .search-input,
  .search-select {
    width: 150px;
  }
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
  
  .search-input,
  .search-select {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>