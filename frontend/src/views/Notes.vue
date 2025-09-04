<template>
  <div class="notes-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h1>笔记管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateNote">
          <el-icon><Edit /></el-icon>
          <span>创建笔记</span>
        </el-button>
        <el-button @click="handleBatchPublish" :disabled="selectedRowKeys.length === 0">
          <el-icon><Share /></el-icon>
          <span>批量发布</span>
        </el-button>
        <el-button @click="handleBatchDraft" :disabled="selectedRowKeys.length === 0">
          <el-icon><Document /></el-icon>
          <span>批量存草稿</span>
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0">
          <el-icon><Delete /></el-icon>
          <span>批量删除</span>
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入笔记标题"
            clearable
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input
            v-model="searchForm.author"
            placeholder="请输入作者名称"
            clearable
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
            v-model="searchForm.categoryId"
            :data="categories"
            :props="{
              label: 'name',
              value: 'id',
              children: 'children'
            }"
            :filter-method="filterCategoryNode"
            placeholder="请选择分类"
            clearable
            class="search-select"
            style="width: 200px;"
            filterable
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            class="search-select"
          >
            <el-option label="草稿" value="0" />
            <el-option label="已发布" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="dateRange">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-range-picker"
          />
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
      </el-form>
    </el-card>
    
    <!-- 笔记列表 -->
    <el-card class="note-list-card">
      <el-table
        v-loading="loading"
        :data="noteList"
        style="width: 100%"
        border
        row-key="id"
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
          prop="title"
          label="标题"
          min-width="200"
          align="left"
          show-overflow-tooltip
        >
          <template #default="scope">
            <div class="title-container">
              <el-tag
                v-if="scope.row.isTop"
                size="small"
                type="success"
                class="top-tag"
              >
                置顶
              </el-tag>
              <span class="note-title" @click="viewNoteDetail(scope.row)">{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="categoryName"
          label="分类"
          min-width="100"
          align="center"
        />
        <el-table-column
          prop="views"
          label="浏览量"
          width="100"
          align="center"
        />
        <el-table-column
          prop="comments"
          label="评论数"
          width="100"
          align="center"
        />
        <el-table-column
          prop="status"
          label="状态"
          width="100"
          align="center"
          :formatter="formatStatus"
        >
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="已发布"
              inactive-text="草稿"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="isTop"
          label="置顶"
          width="100"
          align="center"
          :formatter="formatIsTop"
        >
          <template #default="scope">
            <el-switch
              :model-value="scope.row.isTop"
              :active-value="1"
              :inactive-value="0"
              @update:model-value="handleTopChange(scope.row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          min-width="160"
          align="center"
          :formatter="formatDate"
        />
        <el-table-column
          prop="updatedAt"
          label="更新时间"
          min-width="160"
          align="center"
          :formatter="formatDate"
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
              @click="handleEditNote(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              <span>编辑</span>
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteNote(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              <span>删除</span>
            </el-button>
            <el-button
              size="small"
              @click="handleViewNote(scope.row)"
            >
              <el-icon><View /></el-icon>
              <span>查看</span>
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
import { ElMessage, ElMessageBox } from 'element-plus';

import api from '../utils/api';
import auth from '../utils/auth';
import router from '../router/index.js';

// 加载状态
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  title: '',
  author: '',
  categoryId: '',
  status: '',
  dateRange: []
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 笔记列表
const noteList = ref([]);

// 分类列表
const categories = ref([]);

// 选中的行
const selectedRowKeys = ref([]);

// 格式化状态
const formatStatus = (row) => {
  return row.status === 1 ? '已发布' : '草稿';
};

// 格式化置顶状态
const formatIsTop = (row) => {
  return row.isTop === 1 ? '是' : '否';
};

// 树形选择器自定义过滤方法
const filterCategoryNode = (value, data) => {
  // 检查data是否存在
  if (!data) {
    return false;
  }
  
  // 基本过滤：检查当前节点的名称是否包含过滤值
  if (data.name && data.name.toLowerCase().includes(value.toLowerCase())) {
    return true;
  }
  
  // 递归检查子节点是否有匹配的
  if (data.children && data.children.length > 0) {
    return data.children.some(child => filterCategoryNode(value, child));
  }
  
  return false;
};

// 格式化日期
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return '-';
  const date = new Date(cellValue);
  return date.toLocaleString('zh-CN');
};

// 处理选中行变化
const handleSelectionChange = (selection) => {
  selectedRowKeys.value = selection.map(row => row.id);
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchNoteList();
};

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    title: '',
    author: '',
    categoryId: '',
    status: '',
    dateRange: []
  });
  pagination.currentPage = 1;
  pagination.pageSize = 10;
  fetchNoteList();
};

// 处理创建笔记
const handleCreateNote = () => {
  // 添加调试信息，记录是谁调用了创建笔记功能
  console.log('创建笔记功能被调用', {
    timestamp: new Date().toISOString(),
    caller: '用户点击按钮',
    stack: new Error().stack
  });
  router.push('/notes/create');
};

// 处理编辑笔记
const handleEditNote = (row) => {
  router.push(`/notes/edit/${row.id}`);
};

// 处理查看笔记详情（系统内）
const handleViewNote = (row) => {
  router.push(`/notes/${row.id}`);
};

// 查看笔记详情（预览）
const viewNoteDetail = (row) => {
  // 可以打开新窗口预览笔记，或者在当前页面查看
  router.push(`/notes/${row.id}`);
};

// 处理删除笔记
const handleDeleteNote = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除笔记《${row.title}》吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.note.deleteNote(row.id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      fetchNoteList();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    console.error('删除笔记失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('删除失败');
  }
};

// 处理批量删除
const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    ElMessage.warning('请选择要删除的笔记');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRowKeys.value.length} 篇笔记吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.note.batchDeleteNotes(selectedRowKeys.value);
    if (res.code === 200) {
      // 检查res.data是否存在且包含deletedCount属性
      if (res.data && res.data.deletedCount !== undefined) {
        ElMessage.success(`成功删除 ${res.data.deletedCount} 篇笔记`);
      } else {
        // 如果data为null或没有deletedCount属性，使用响应消息或选中的笔记数量
        ElMessage.success(res.msg || `成功删除 ${selectedRowKeys.value.length} 篇笔记`);
      }
      selectedRowKeys.value = [];
      fetchNoteList();
    } else {
      ElMessage.error(res.message || res.msg || '批量删除失败');
    }
  } catch (error) {
    console.error('批量删除笔记失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('批量删除失败');
  }
};

// 处理状态切换
const handleStatusChange = async (row) => {
  try {
    // 因为v-model已经更新了row.status的值，直接使用当前值
    const currentStatus = row.status;
    
    const res = await api.note.batchUpdateStatus([row.id], currentStatus);
    if (res.code !== 200) {
      // 如果失败，恢复原来的状态（切换回相反状态）
      row.status = currentStatus === 1 ? 0 : 1;
      ElMessage.error(res.message || '状态切换失败');
    } else {
      ElMessage.success(`笔记《${row.title}》已${currentStatus === 1 ? '发布' : '保存为草稿'}`);
      // 刷新列表以确保数据一致性
      fetchNoteList();
    }
  } catch (error) {
    console.error('状态切换失败:', error);
    // 出错时恢复原来的状态（切换回相反状态）
    row.status = row.status === 1 ? 0 : 1;
    ElMessage.error('状态切换失败');
  }
};

// 处理置顶状态切换
const handleTopChange = async (row, top) => {
  try {
    // 调用API更新置顶状态
    const res = await api.note.top(row.id, top);
    
    if (res.code === 200) {
      // API调用成功，更新本地状态
      row.isTop = top;
      ElMessage.success(`笔记《${row.title}》已${top === 1 ? '置顶' : '取消置顶'}`);
      // 刷新列表以确保数据一致性
      fetchNoteList();
    } else {
      ElMessage.error(res.message || '置顶状态切换失败');
    }
  } catch (error) {
    console.error('置顶状态切换失败:', error);
    ElMessage.error('置顶状态切换失败');
  }
};

// 处理批量发布
const handleBatchPublish = async () => {
  if (selectedRowKeys.value.length === 0) {
    ElMessage.warning('请选择要发布的笔记');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要发布选中的 ${selectedRowKeys.value.length} 篇笔记吗？`,
      '确认发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.note.batchUpdateStatus(selectedRowKeys.value, 1);
    if (res.code === 200) {
      ElMessage.success('批量发布成功');
      selectedRowKeys.value = [];
      fetchNoteList();
    } else {
      ElMessage.error(res.message || '批量发布失败');
    }
  } catch (error) {
    console.error('批量发布笔记失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('批量发布失败');
  }
};

// 处理批量存草稿
const handleBatchDraft = async () => {
  if (selectedRowKeys.value.length === 0) {
    ElMessage.warning('请选择要保存为草稿的笔记');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRowKeys.value.length} 篇笔记保存为草稿吗？`,
      '确认存草稿',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.note.batchUpdateStatus(selectedRowKeys.value, 0);
    if (res.code === 200) {
      ElMessage.success('批量存草稿成功');
      selectedRowKeys.value = [];
      fetchNoteList();
    } else {
      ElMessage.error(res.message || '批量存草稿失败');
    }
  } catch (error) {
    console.error('批量存草稿失败:', error);
    if (error === 'cancel') return;
    ElMessage.error('批量存草稿失败');
  }
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchNoteList();
};

// 处理当前页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  fetchNoteList();
};

// 获取笔记列表
const fetchNoteList = async () => {
  try {
    loading.value = true;
    
    const params = {
      title: searchForm.title,
      author: searchForm.author,
      categoryId: searchForm.categoryId,
      status: searchForm.status,
      startDate: searchForm.dateRange && searchForm.dateRange[0] ? searchForm.dateRange[0] : '',
      endDate: searchForm.dateRange && searchForm.dateRange[1] ? searchForm.dateRange[1] : '',
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    };
    
    // 调用API获取笔记列表
    const res = await api.note.getList(params);
    
    if (res.data && (res.data.code === 200 || res.data.code === 201)) {
      // 处理笔记数据，确保字段名匹配
      noteList.value = (res.data.data.list || []).map(note => ({
        ...note,
        // 转换分类字段格式 - 处理多种可能的字段名和格式
        categoryName: note.categories || // 优先使用后端返回的categories字段
                     (note.category_names && Array.isArray(note.category_names) ? note.category_names.join('、') : 
                     (typeof note.category_names === 'string' ? note.category_names : 
                     (note.category_name || 
                     (note.category && note.category.name) || '-'))),
        // 确保浏览量和评论数字段存在，默认为0
        views: note.views || 0,
        comments: note.comments || 0,
        // 确保置顶状态字段存在，默认为0
        isTop: note.is_top || 0,
        // 统一日期字段格式
        createdAt: note.created_at,
        updatedAt: note.updated_at
      }));
      pagination.total = res.data.data.total || 0;
      console.log('获取笔记列表成功，返回数据量:', noteList.value.length);
      ElMessage.success('获取笔记列表成功');
    } else {
      console.error('获取笔记列表失败，响应状态码:', res.data ? res.data.code : '未知', '消息:', res.data ? res.data.message : '无');
      ElMessage.error(res.data ? res.data.message || '获取笔记列表失败' : '获取笔记列表失败');
    }
  } catch (error) {
    console.error('获取笔记列表异常:', error);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      // 处理401认证错误
      if (error.response.status === 401) {
        console.warn('认证失败，清除登录状态并跳转到登录页');
        ElMessage.error('登录已过期，请重新登录');
        auth.logout();
        router.replace('/login');
        return;
      }
      
      // 其他错误状态码
      ElMessage.error(`获取笔记列表失败: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
      ElMessage.error('网络错误，无法连接到服务器');
    } else {
      console.error('请求配置错误:', error.message);
      ElMessage.error('请求错误: ' + error.message);
    }
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    // 添加调试信息
    console.log('准备请求分类列表');
    console.log('当前token:', auth.getToken());
    
    const res = await api.category.getList({ pageSize: 100 });
    if (res.code === 200) {
      categories.value = res.data.list || [];
      console.log('获取分类列表成功，返回分类数量:', categories.value.length);
    } else {
      console.error('获取分类列表失败，响应状态码:', res.code, '消息:', res.message);
      ElMessage.error('获取分类列表失败');
    }
  } catch (error) {
    console.error('获取分类列表异常:', error);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      // 处理401认证错误
      if (error.response.status === 401) {
        console.warn('认证失败，清除登录状态并跳转到登录页');
        ElMessage.error('登录已过期，请重新登录');
        auth.logout();
        router.replace('/login');
        return;
      }
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    ElMessage.error('获取分类列表失败');
  }
};

// 页面加载时获取笔记列表和分类列表
onMounted(() => {
  if (auth.isAuthenticated()) {
    fetchNoteList();
    fetchCategories();
  } else {
    router.replace('/login');
  }
});

// 不需要将方法导出到window，Vue3的script setup会自动将它们暴露给模板
</script>

<style scoped>
/* 笔记管理页面容器 */
.notes-container {
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
.search-select,
.date-range-picker {
  width: 180px;
}

/* 笔记列表卡片 */
.note-list-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 标题容器 */
.title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 置顶标签 */
.top-tag {
  margin-right: 8px;
}

/* 笔记标题 */
.note-title {
  cursor: pointer;
  color: #374151;
  transition: color 0.2s ease;
}

.note-title:hover {
  color: #4f46e5;
  text-decoration: underline;
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
  .search-select,
  .date-range-picker {
    width: 150px;
  }
  
  .header-actions {
    flex-wrap: wrap;
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
  .search-select,
  .date-range-picker {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>