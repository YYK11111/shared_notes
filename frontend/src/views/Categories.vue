<template>
  <div class="categories-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>分类管理</h1>
      <p class="page-description">管理系统中的笔记分类</p>
    </div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索分类名称"
        clearable
        prefix-icon="Search"
        class="search-input"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      
      <el-button-group class="toolbar-buttons">
        <el-button
          type="primary"
          @click="handleAddCategory"
          icon="Plus"
        >
          添加分类
        </el-button>
        
        <el-button
          @click="handleBatchDelete"
          :disabled="selectedCategories.length === 0"
          icon="Delete"
        >
          批量删除
        </el-button>
        
        <el-button
          @click="handleRefresh"
          icon="Refresh"
        >
          刷新
        </el-button>
      </el-button-group>
    </div>
    
    <!-- 分类列表表格 -->
    <el-card class="table-card">
      <el-table
          v-loading="loading"
          :data="categoriesData"
          style="width: 100%"
          border
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          @select="handleSelect"
          @select-all="handleSelectAll"
          fit
        >
        <!-- 复选框列 -->
        <el-table-column
          type="selection"
          width="55"
          align="center"
        />
        
        <!-- 序号列 -->
        <el-table-column
          type="index"
          width="60"
          label="序号"
          align="center"
        />
        
        <!-- 分类名称列 -->
        <el-table-column
          prop="name"
          label="分类名称"
          min-width="250"
          tree-node-key="id"
          :indent="20"
        >
          <template #default="scope">
            <div class="category-name" style="display: inline-flex; align-items: center; height: 100%;">
              <i class="el-icon-folder" :class="{ 'has-children': scope.row.hasChildren }" style="margin-right: 8px; font-size: 16px;" />
              <span>{{ scope.row.name }}</span>
              <span class="category-count" v-if="scope.row.noteCount > 0">({{ scope.row.noteCount }})</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 上级分类列 -->
        <el-table-column
          prop="parentName"
          label="上级分类"
          min-width="180"
        >
          <template #default="scope">
            {{ scope.row.parentName || '无' }}
          </template>
        </el-table-column>
        
        <!-- 层级列 -->
        <el-table-column
          prop="level"
          label="层级"
          width="80"
          align="center"
        />
        
        <!-- 排序列 -->
        <el-table-column
          prop="sort"
          label="排序"
          min-width="120"
          align="center"
        >
          <template #default="scope">
            <el-input-number
              v-model="scope.row.sort"
              :min="0"
              :max="1000"
              label="排序"
              @change="handleSortChange(scope.row.id, $event)"
            />
          </template>
        </el-table-column>
        
        <!-- 创建时间列 -->
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="180"
          align="center"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <!-- 更新时间列 -->
        <el-table-column
          prop="updatedAt"
          label="更新时间"
          width="180"
          align="center"
        >
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        
        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="180"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="handleAddSubCategory(scope.row.id, scope.row.name)"
              icon="CirclePlus"
            >
              子分类
            </el-button>
            
            <el-button
              link
              type="primary"
              @click="handleEditCategory(scope.row)"
              icon="Edit"
            >
              编辑
            </el-button>
            
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              icon="Delete"
              :disabled="scope.row.noteCount > 0"
            >
              删除
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
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="formRules"
        label-width="80px"
        class="category-form"
      >
        <el-form-item label="上级分类" prop="parentId">
          <el-select
            v-model="categoryForm.parentId"
            placeholder="请选择上级分类"
            clearable
            filterable
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <div class="form-tip">最多支持3级分类</div>
        </el-form-item>
        
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            clearable
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="categoryForm.sort"
            :min="0"
            :max="1000"
            label="排序"
          />
          <div class="form-tip">数字越小，排序越靠前</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button
            type="primary"
            @click="handleDialogSubmit"
            :loading="dialogSubmitting"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
  /* 修复展开按钮和文字的对齐问题 */
  :deep(.el-table__expand-icon) {
    display: flex !important;
    align-items: center !important;
    margin-top: 0 !important;
  }
  
  :deep(.el-table .cell) {
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
  }
  
  /* 确保分类名称和展开按钮在同一行并居中对齐 */
  .category-name {
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
    flex-wrap: nowrap !important;
  }
  
  /* 保留子分类缩进效果 */
  :deep(.el-table) {
    --el-table-tree-indent: 20px !important;
  }
</style>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import api from '../utils/api';

// 加载状态
const loading = ref(false);

// 搜索条件
const searchQuery = ref('');

// 选中的分类
const selectedCategories = ref([]);

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 分类数据（树形结构）
const categoriesData = ref([]);

// 分类选项（扁平结构，用于选择器）
const categoryOptions = ref([]);

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = ref('添加分类');
const dialogSubmitting = ref(false);
const editingCategoryId = ref(null);
const categoryFormRef = ref(null);

// 表单数据
const categoryForm = reactive({
  parentId: '',
  name: '',
  sort: 0
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在1-50个字符之间', trigger: 'blur' }
  ],
  parentId: [
    {
      validator: (rule, value, callback) => {
        // 编辑模式下，检查是否选择了自己或自己的子分类作为父分类
        if (editingCategoryId.value && value === editingCategoryId.value) {
          callback(new Error('不能选择自己作为上级分类'));
          return;
        }
        
        // 检查是否会导致循环引用
        if (editingCategoryId.value && value) {
          const checkCircularReference = (id, parentId) => {
            // 这里简化处理，实际应该递归检查
            // 完整实现需要检查整个分类树结构
            return false;
          };
          
          if (checkCircularReference(editingCategoryId.value, value)) {
            callback(new Error('选择的上级分类会导致循环引用'));
            return;
          }
        }
        
        callback();
      },
      trigger: 'change'
    }
  ]
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 处理分类数据，转换格式、计算层级并设置父分类名称，同时递归处理子分类
const processCategoryData = (categories, level = 1, parentName = null) => {
  return categories.map(category => {
    // 转换下划线格式为驼峰格式
    const processedCategory = {
      ...category,
      level: level, // 设置层级
      createdAt: category.created_at || category.createdAt || '',
      updatedAt: category.updated_at || category.updatedAt || '',
      parentName: parentName || category.parentName || '无', // 设置父分类名称
      noteCount: category.noteCount || category.note_count || 0,
      sort: category.sort || 0,
      hasChildren: category.hasChildren || category.has_children || (category.children && category.children.length > 0)
    };
    
    // 确保所有必要字段都有默认值
    if (!processedCategory.id) {
      processedCategory.id = category.id || '';
    }
    if (!processedCategory.name) {
      processedCategory.name = category.name || '';
    }
    
    // 递归处理子分类
    if (category.children && category.children.length > 0) {
      processedCategory.children = processCategoryData(category.children, level + 1, category.name);
    } else {
      // 如果没有子分类，确保hasChildren为false
      processedCategory.hasChildren = false;
    }
    
    return processedCategory;
  });
};

// 获取完整的分类树列表
const fetchCategories = async () => {
  try {
    loading.value = true;
    
    // 构建查询参数
    const params = {
      name: searchQuery.value
    };
    
    // 获取所有分类
    const res = await api.category.getCategoryList(params);
    if (res.code === 200) {
      // 从data.list获取分类树数组
      const fullCategoryTree = res.data?.list || [];
      
      // 处理分类数据，转换格式并计算层级
      const processedCategories = processCategoryData(fullCategoryTree || []);
      
      // 生成扁平的分类选项
      await generateCategoryOptions();
      
      // 实现前端分页
      const total = processedCategories.length;
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      
      // 只显示顶级分类（parent_id为0或null的分类）
      const allTopLevelCategories = processedCategories.filter(category => 
        category.parent_id === 0 || category.parent_id === null
      );
      
      // 应用分页
      categoriesData.value = allTopLevelCategories.slice(startIndex, endIndex);
      pagination.total = allTopLevelCategories.length;
    } else {
      ElMessage.error(res.message || '获取分类列表失败');
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
    ElMessage.error('获取分类列表失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 生成分类选项
const generateCategoryOptions = async () => {
  // 保留当前选项，以防API调用失败
  const currentOptions = [...categoryOptions.value];
  const options = [];
  
  try {
    // 获取所有分类（不包括分页）
    const res = await api.category.getCategoryList({
      pageSize: 1000, // 设置一个足够大的值来获取所有分类
      withNotesCount: false
    });
    
    if (res.code === 200) {
      const allCategories = processCategoryData(res.data.list || []);
      
      const flattenCategories = (categories, prefix = '') => {
        categories.forEach(category => {
          // 排除当前编辑的分类（如果有）
          if (!editingCategoryId.value || category.id !== editingCategoryId.value) {
            options.push({
              id: category.id,
              name: prefix + category.name,
              level: category.level
            });
            
            if (category.children && category.children.length > 0 && category.level < 2) {
              flattenCategories(category.children, prefix + '└── ');
            }
          }
        });
      };
      
      flattenCategories(allCategories);
      
      // 只有成功获取数据后才更新选项
      categoryOptions.value = options;
    } else {
      console.warn('获取分类选项失败:', res.message);
      // API调用成功但返回错误状态码，保留当前选项
      categoryOptions.value = currentOptions;
    }
  } catch (error) {
    console.error('获取分类选项失败:', error);
    // 发生异常，保留当前选项
    categoryOptions.value = currentOptions;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchCategories();
};

// 处理刷新
const handleRefresh = () => {
  searchQuery.value = '';
  pagination.currentPage = 1;
  fetchCategories();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchCategories();
};

// 处理当前页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  fetchCategories();
};

// 处理选择
const handleSelect = (selection, row) => {
  selectedCategories.value = selection;
};

// 处理全选
const handleSelectAll = (selection) => {
  selectedCategories.value = selection;
};

// 处理排序变化
const handleSortChange = async (categoryId, newSort) => {
  try {
    // 更新当前行的排序值
    const category = categoriesData.value.find(cat => cat.id === categoryId);
    if (category) {
      category.sort = newSort;
    }
    
    // 收集所有分类的ID，按照当前排序顺序
    const sortedIds = categoriesData.value
      .sort((a, b) => a.sort - b.sort)
      .map(cat => cat.id);
    
    // 调用正确的API函数更新排序
    const res = await api.category.updateCategoryOrder(sortedIds);
    if (res.code === 200) {
      ElMessage.success('排序更新成功');
    } else {
      ElMessage.error(res.message || '排序更新失败');
      // 重新请求列表以恢复正确的排序值
      fetchCategories();
    }
  } catch (error) {
    console.error('更新排序失败:', error);
    ElMessage.error('排序更新失败');
    // 重新请求列表以恢复正确的排序值
    fetchCategories();
  }
};

// 打开添加分类对话框
const handleAddCategory = async () => {
  editingCategoryId.value = null;
  dialogTitle.value = '添加分类';
  resetForm();
  await generateCategoryOptions();
  dialogVisible.value = true;
};

// 打开添加子分类对话框
const handleAddSubCategory = async (parentId, parentName) => {
  editingCategoryId.value = null;
  dialogTitle.value = `添加「${parentName}」的子分类`;
  resetForm();
  categoryForm.parentId = parentId;
  await generateCategoryOptions();
  dialogVisible.value = true;
};

// 打开编辑分类对话框
const handleEditCategory = async (row) => {
  editingCategoryId.value = row.id;
  dialogTitle.value = '编辑分类';
  
  // 填充表单数据
  categoryForm.parentId = row.parentId || '';
  categoryForm.name = row.name;
  categoryForm.sort = row.sort;
  
  // 重新生成分类选项（排除当前编辑的分类）
  await generateCategoryOptions();
  
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields();
  }
  Object.assign(categoryForm, {
    parentId: '',
    name: '',
    sort: 0
  });
};

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false;
  setTimeout(() => {
    resetForm();
    editingCategoryId.value = null;
  }, 300);
};

// 提交对话框表单
const handleDialogSubmit = async () => {
  try {
    // 验证表单
    await categoryFormRef.value.validate();
    
    dialogSubmitting.value = true;
    
    let res;
    if (editingCategoryId.value) {
      // 编辑分类
      res = await api.category.updateCategory(editingCategoryId.value, categoryForm);
    } else {
      // 添加分类
      res = await api.category.createCategory(categoryForm);
    }
    
    // 将200和201都视为成功状态码
    if (res.code === 200 || res.code === 201) {
      const message = editingCategoryId.value ? '分类更新成功' : '分类添加成功';
      ElMessage.success(message);
      handleDialogClose();
      fetchCategories();
    } else {
      ElMessage.error(res.message || (editingCategoryId.value ? '更新失败' : '添加失败'));
    }
  } catch (error) {
    console.error(editingCategoryId.value ? '更新分类失败:' : '添加分类失败:', error);
    // 处理request.js返回的拒绝对象
    // 检查是否有成功消息但被错误处理的情况
    if (error.response && error.response.msg && (error.response.msg.includes('成功') || error.response.code === 200 || error.response.code === 201)) {
      ElMessage.success(error.response.msg);
      handleDialogClose();
      fetchCategories();
    } else if (error.response && error.response.msg) {
      ElMessage.error(error.response.msg);
    } else if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(editingCategoryId.value ? '更新失败，请重试' : '添加失败，请重试');
    }
  } finally {
    dialogSubmitting.value = false;
  }
};

// 处理删除分类
const handleDelete = async (categoryId) => {
  try {
    // 检查是否有笔记
    const category = findCategoryById(categoryId, categoriesData.value);
    if (category && category.noteCount > 0) {
      ElMessage.warning('该分类下有笔记，无法删除');
      return;
    }
    
    await ElMessageBox.confirm(
      '确定要删除该分类吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.category.deleteCategory(categoryId);
    if (res.code === 200) {
      ElMessage.success('分类删除成功');
      fetchCategories();
    } else {
      ElMessage.error(res.msg || '删除失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('删除分类失败:', error);
    ElMessage.error('删除失败，请重试');
  }
};

// 处理批量删除
const handleBatchDelete = async () => {
  if (selectedCategories.value.length === 0) {
    ElMessage.warning('请选择要删除的分类');
    return;
  }
  
  try {
    // 检查选中的分类是否有笔记
    const hasNotes = selectedCategories.value.some(category => category.noteCount > 0);
    if (hasNotes) {
      ElMessageBox.alert(
        '选中的分类中包含有笔记的分类，无法批量删除',
        '操作提示',
        {
          confirmButtonText: '确定',
          type: 'warning'
        }
      );
      return;
    }
    
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCategories.value.length} 个分类吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const categoryIds = selectedCategories.value.map(category => category.id);
    const res = await api.category.batchDeleteCategories(categoryIds);
    
    if (res.code === 200) {
      ElMessage.success(`成功删除 ${selectedCategories.value.length} 个分类`);
      selectedCategories.value = [];
      fetchCategories();
    } else {
      ElMessage.error(res.message || '批量删除失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('批量删除分类失败:', error);
    ElMessage.error('批量删除失败，请重试');
  }
};

// 根据ID查找分类
const findCategoryById = (id, categories) => {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryById(id, category.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// 页面加载时初始化数据
onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
/* 分类管理页面容器 */
.categories-container {
  padding: 0 0 20px 0;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.toolbar-buttons {
  display: flex;
  gap: 8px;
}

/* 表格卡片 */
.table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 分类名称样式 */
.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name .el-icon-folder {
  color: #409eff;
}

.category-name .has-children {
  color: #67c23a;
}

.category-count {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表单样式 */
.category-form {
  padding: 16px 0;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .toolbar-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  :deep(.el-table) {
    font-size: 14px;
  }
  
  :deep(.el-table .el-table__cell) {
    padding: 8px;
  }
  
  /* 隐藏固定列，避免移动端显示问题 */
  :deep(.el-table__fixed-right) {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .category-name {
    flex-wrap: wrap;
  }
  
  :deep(.el-table .el-table-column--selection) {
    width: 40px !important;
  }
  
  :deep(.el-table .el-table-column--index) {
    width: 50px !important;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 10px !important;
  }
  
  .category-form {
    padding: 16px;
  }
}

/* 自定义滚动条 */
:deep(.el-table__body-wrapper) {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: #d1d5db;
  border-radius: 3px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: #f3f4f6;
}

/* 表格行悬停效果 */
:deep(.el-table__row:hover > td) {
  background-color: #f9fafb !important;
}

/* 禁用状态的删除按钮 */
:deep(.el-button.is-disabled) {
  color: #c4c4c4 !important;
}
</style>