<template>
  <div class="sensitive-words-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">敏感词管理</h2>
        </div>
      </template>

      <!-- 搜索和添加 -->
      <div class="search-filter-container">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索敏感词" 
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
        />
        <el-button type="primary" @click="handleSearch" class="search-button">
          搜索
        </el-button>
        <el-button type="success" @click="handleAddSensitiveWord">
          <el-icon><Plus /></el-icon>
          添加敏感词
        </el-button>
      </div>

      <!-- 敏感词列表 -->
      <el-table
        v-loading="loading"
        :data="filteredWords"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        :row-key="(row) => row"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="word" label="敏感词" min-width="200" />
        <el-table-column prop="created_at" label="创建时间" width="180" :formatter="formatDate" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              type="danger" 
              @click="handleDeleteSensitiveWord(scope.row)"
              :loading="deletingWords.includes(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedWords.length > 0">
        <span>已选择 {{ selectedWords.length }} 个敏感词</span>
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
          :loading="batchDeleting"
        >
          批量删除
        </el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredWords.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加敏感词对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加敏感词"
      width="400px"
    >
      <el-form :model="addForm" ref="addFormRef" label-width="80px">
        <el-form-item label="敏感词" prop="word" :rules="[{ required: true, message: '请输入敏感词', trigger: 'blur' }]">
          <el-input v-model="addForm.word" placeholder="请输入敏感词" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelAdd">取消</el-button>
          <el-button type="primary" @click="handleConfirmAdd" :loading="adding">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSensitiveWords, addSensitiveWord, deleteSensitiveWord } from '@/api/sensitiveWords'

// 敏感词列表状态
const allSensitiveWords = ref([])
const searchKeyword = ref('')
const loading = ref(false)
const deletingWords = ref([])
const batchDeleting = ref(false)
const selectedWords = ref([])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 添加敏感词对话框状态
const addDialogVisible = ref(false)
const addForm = ref({ word: '' })
const addFormRef = ref(null)
const adding = ref(false)

// 过滤后的敏感词列表
const filteredWords = computed(() => {
  let filtered = allSensitiveWords.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => item.word.toLowerCase().includes(keyword))
  }
  return filtered
})

// 分页后的敏感词列表
const paginatedWords = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredWords.value.slice(startIndex, endIndex)
})

// 日期格式化函数
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return ''
  const date = new Date(cellValue)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

// 获取敏感词列表
const fetchSensitiveWords = async () => {
  try {
    loading.value = true
    const response = await getSensitiveWords()
    if (response.code === 200) {
      allSensitiveWords.value = response.data || []
    } else {
      ElMessage.error('获取敏感词列表失败: ' + (response.msg || '未知错误'))
    }
  } catch (error) {
    console.error('获取敏感词列表出错:', error)
    ElMessage.error('获取敏感词列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索敏感词
const handleSearch = () => {
  currentPage.value = 1
}

// 添加敏感词
const handleAddSensitiveWord = () => {
  addForm.value.word = ''
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
  addDialogVisible.value = true
}

// 添加敏感词
const handleConfirmAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    adding.value = true
    
    // 检查敏感词是否已存在
    if (allSensitiveWords.value.some(item => item.word === addForm.value.word)) {
      ElMessage.warning('该敏感词已存在')
      return
    }
    
    const response = await addSensitiveWord(addForm.value.word)
    if (response.code === 200) {
      ElMessage.success('添加敏感词成功')
      await fetchSensitiveWords() // 重新获取列表
      addDialogVisible.value = false
    } else {
      ElMessage.error('添加敏感词失败: ' + (response.msg || '未知错误'))
    }
  } catch (error) {
    if (error.name === 'Error') {
      // 表单验证失败
      return
    }
    console.error('添加敏感词出错:', error)
    ElMessage.error('添加敏感词失败，请稍后重试')
  } finally {
    adding.value = false
  }
}

// 取消添加敏感词
const handleCancelAdd = () => {
  addDialogVisible.value = false
}

// 删除敏感词
const handleDeleteSensitiveWord = async (wordObj) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除敏感词 "${wordObj.word}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deletingWords.value.push(wordObj.id)
    const response = await deleteSensitiveWord(wordObj.word)
    if (response.code === 200) {
      ElMessage.success('删除敏感词成功')
      await fetchSensitiveWords() // 重新获取列表
    } else {
      ElMessage.error('删除敏感词失败: ' + (response.msg || '未知错误'))
    }
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
      return
    }
    console.error('删除敏感词出错:', error)
    ElMessage.error('删除敏感词失败，请稍后重试')
  } finally {
    deletingWords.value = deletingWords.value.filter(item => item !== wordObj.id)
  }
}

// 批量删除敏感词
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedWords.value.length} 个敏感词吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    batchDeleting.value = true
    
    // 逐个删除敏感词
    const deletePromises = selectedWords.value.map(wordObj => deleteSensitiveWord(wordObj.word))
    const results = await Promise.all(deletePromises)
    
    // 检查是否有删除失败的情况
    const hasErrors = results.some(result => result.code !== 200)
    
    if (hasErrors) {
      ElMessage.warning('部分敏感词删除失败，请稍后重试')
    } else {
      ElMessage.success('批量删除敏感词成功')
    }
    
    await fetchSensitiveWords() // 重新获取列表
    selectedWords.value = [] // 清空选择
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作
      return
    }
    console.error('批量删除敏感词出错:', error)
    ElMessage.error('批量删除敏感词失败，请稍后重试')
  } finally {
    batchDeleting.value = false
  }
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedWords.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 组件挂载时获取数据
onMounted(() => {
  fetchSensitiveWords()
})
</script>

<style scoped>
.sensitive-words-management-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.search-filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.batch-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>