<template>
  <div class="search-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">搜索管理</h2>
        </div>
      </template>

      <!-- 选项卡导航 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="mt-2">
      <el-tab-pane label="索引管理" name="index">
        <!-- 索引管理内容 -->
        <div class="index-management-section">
          <div class="index-status-card">
            <div class="card-header">
              <h3>索引状态</h3>
              <div class="index-actions">
                <el-button type="primary" @click="fetchIndexStatus" :loading="loadingIndexStatus" size="small">
                  <Refresh class="el-icon--left" />
                  刷新状态
                </el-button>
              </div>
            </div>
            
            <div v-if="loadingIndexStatus" class="loading-state">
              <Loading />
              <span style="margin-left: 0.5rem;">正在加载索引状态...</span>
            </div>
            
            <div v-else class="index-status-content">
              <div class="status-item">
                <span class="status-label">索引状态:</span>
                <span class="status-value" :style="{ color: indexStatus.index_exists ? '#42b983' : '#f56c6c' }">
                  {{ indexStatus.index_exists ? '已创建' : '未创建' }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">已索引笔记:</span>
                <span class="status-value">{{ indexStatus.indexed_count }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">活跃笔记总数:</span>
                <span class="status-value">{{ indexStatus.total_active_notes }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">索引覆盖率:</span>
                <span class="status-value">{{ indexStatus.index_coverage }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-header">
            <h3>索引操作</h3>
            <el-button type="primary" @click="handleRebuildIndex" :loading="rebuildingIndex">
              <Refresh class="el-icon--left" />
              重建索引
            </el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="搜索配置" name="config">
        <!-- 搜索配置内容 -->
        <div class="search-config-section">
          <div class="card-header">
            <h3>搜索配置</h3>
            <div class="header-actions">
              <el-button @click="handleResetSearch" :disabled="savingConfig">
                重置
              </el-button>
              <el-button type="primary" @click="handleSaveSearch" :loading="savingConfig">
                保存配置
              </el-button>
            </div>
          </div>
          
          <el-form :model="searchConfig" ref="searchConfigRef" label-width="150px">
            <el-form-item label="搜索建议数量" prop="suggest_count">
              <el-input-number v-model="searchConfig.suggest_count" :min="1" :max="20" :step="1" />
              <span class="form-hint">搜索建议显示的最大数量</span>
            </el-form-item>
            
            <el-form-item label="标题权重" prop="title_weight">
              <el-input-number v-model="searchConfig.title_weight" :min="1" :max="10" :step="0.5" />
              <span class="form-hint">标题字段在搜索排名中的权重</span>
            </el-form-item>
            
            <el-form-item label="内容权重" prop="content_weight">
              <el-input-number v-model="searchConfig.content_weight" :min="1" :max="10" :step="0.5" />
              <span class="form-hint">内容字段在搜索排名中的权重</span>
            </el-form-item>
            
            <el-form-item label="启用搜索建议" prop="enable_suggest">
              <el-switch v-model="searchConfig.enable_suggest" />
              <span class="form-hint">是否启用搜索建议功能</span>
            </el-form-item>
            
            <el-form-item label="启用热门搜索" prop="enable_trending">
              <el-switch v-model="searchConfig.enable_trending" />
              <span class="form-hint">是否启用热门搜索词功能</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="搜索屏蔽列表" name="blocked">
          <div class="blocked-notes-section">
            <!-- 搜索和添加 -->
            <div class="search-filter-container">
              <el-input 
                v-model="blockedSearchKeyword" 
                placeholder="搜索笔记标题" 
                :prefix-icon="Search"
                class="search-input"
                @keyup.enter="handleBlockedSearch"
                clearable
              />
              <el-button type="primary" @click="handleBlockedSearch" class="search-button">
                搜索笔记
              </el-button>
              <el-button type="success" @click="handleAddBlockedNote">
                <el-icon><Plus /></el-icon>
                手动添加屏蔽
              </el-button>
            </div>

            <!-- 屏蔽列表 -->
            <el-table
              v-loading="loadingBlockedList"
              :data="blockedNotesData"
              style="width: 100%"
              border
              @selection-change="handleBlockedSelectionChange"
              :row-key="(row) => row.id"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" sortable />
              <el-table-column prop="note_id" label="笔记ID" width="100" sortable />
              <el-table-column prop="note_title" label="笔记标题" min-width="200" />
              <el-table-column prop="blocked_by" label="屏蔽人ID" width="100" />
              <el-table-column prop="blocked_at" label="屏蔽时间" width="180" sortable>
                <template #default="{ row }">
                  {{ formatDate(row.blocked_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="handleRemoveBlockedNote(row.note_id, row.note_title)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="blockedCurrentPage"
                v-model:page-size="blockedPageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="blockedTotalCount"
                @size-change="handleBlockedSizeChange"
                @current-change="handleBlockedCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="搜索日志" name="logs">
          <div class="search-logs-section">
            <!-- 筛选条件 -->
            <div class="search-filter-container">
              <el-input 
                v-model="logsSearchKeyword" 
                placeholder="搜索关键词"
                :prefix-icon="Search"
                class="search-input"
              />
              <el-date-picker
                v-model="logsDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="date-range-picker"
              />
              <el-button type="primary" @click="handleLogsSearch" class="search-button">
                搜索
              </el-button>
              <el-button @click="resetLogsFilters" class="reset-button">
                重置
              </el-button>
            </div>

            <!-- 日志列表 -->
            <el-table
              v-loading="loadingLogsList"
              :data="searchLogsData"
              style="width: 100%"
              border
            >
              <el-table-column prop="id" label="ID" width="80" sortable />
              <el-table-column prop="keyword" label="搜索关键词" min-width="150" />
              <el-table-column prop="ip_address" label="IP地址" width="120" />
              <el-table-column prop="user_agent" label="用户代理" min-width="200" />
              <el-table-column prop="user_id" label="用户ID" width="100" sortable />
              <el-table-column prop="search_time" label="搜索时间" width="180" sortable>
                <template #default="{ row }">
                  {{ formatDate(row.search_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="results_count" label="结果数" width="80" sortable />
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="logsCurrentPage"
                v-model:page-size="logsPageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="logsTotalCount"
                @size-change="handleLogsSizeChange"
                @current-change="handleLogsCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="热门搜索词" name="trending">
          <div class="trending-keywords-section">
            <!-- 筛选条件 -->
            <div class="search-filter-container">
              <el-select v-model="trendingTimeRange" placeholder="时间范围" class="time-range-select">
                <el-option label="3天" value="3"></el-option>
                <el-option label="7天" value="7"></el-option>
                <el-option label="30天" value="30"></el-option>
                <el-option label="90天" value="90"></el-option>
              </el-select>
              <el-input-number
                v-model="trendingLimit"
                :min="5"
                :max="100"
                :step="5"
                class="limit-input"
                placeholder="显示数量"
              />
              <el-button type="primary" @click="handleTrendingSearch" class="search-button">
                查询
              </el-button>
            </div>

            <!-- 热门搜索词列表 -->
            <el-table
              v-loading="loadingTrendingList"
              :data="trendingKeywordsData"
              style="width: 100%"
              border
            >
              <el-table-column label="排名" width="80">
                <template #default="{ $index }">
                  <span class="rank-number">{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="keyword" label="搜索词" min-width="150" />
              <el-table-column prop="search_count" label="搜索次数" width="120" sortable />
              <el-table-column prop="last_searched" label="最后搜索时间" width="180" sortable>
                <template #default="{ row }">
                  {{ formatDate(row.last_searched) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 手动添加屏蔽笔记对话框 -->
    <el-dialog
      v-model="addBlockedDialogVisible"
      title="手动添加屏蔽笔记"
      width="500px"
    >
      <el-form :model="blockedForm" ref="blockedFormRef" label-width="80px">
        <el-form-item label="笔记ID" prop="noteId" :rules="[{ required: true, message: '请输入笔记ID', trigger: 'blur' }]">
          <el-input v-model="blockedForm.noteId" placeholder="请输入要屏蔽的笔记ID" clearable />
        </el-form-item>
        <el-form-item label="笔记标题" prop="noteTitle" v-if="blockedForm.noteTitle">
          <el-input v-model="blockedForm.noteTitle" readonly placeholder="笔记标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelAddBlocked">取消</el-button>
          <el-button type="primary" @click="handleConfirmAddBlocked" :loading="addingBlocked">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 搜索笔记对话框 -->
    <el-dialog
      v-model="noteSearchDialogVisible"
      title="搜索并选择笔记添加屏蔽"
      width="800px"
    >
      <div class="search-filter-container">
        <el-input
          v-model="searchNotesKeyword"
          placeholder="搜索笔记标题"
          class="search-input"
          clearable
          @keyup.enter="handleNotesSearch"
          :prefix-icon="Search"
        />
        <el-button type="primary" @click="handleNotesSearch" class="search-button">
          搜索
        </el-button>
      </div>
      
      <el-table
        v-loading="addingBlocked"
        :data="searchNotesData"
        style="width: 100%"
        border
        @selection-change="(selection) => selectedNotesForBlock = selection"
        :row-key="(row) => row.id"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="笔记ID" width="120" />
        <el-table-column prop="title" label="笔记标题" min-width="200">
          <template #default="scope">
            <span style="max-width: 400px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ scope.row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchNotesPage"
          v-model:page-size="searchNotesPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="searchNotesTotal"
          @size-change="handleNotesSizeChange"
          @current-change="handleNotesCurrentChange"
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelSelectNotes">取消</el-button>
          <el-button type="primary" :loading="addingBlocked" @click="handleConfirmSelectNotes">
            确认添加 ({{ selectedNotesForBlock.length }})
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { 
  Search, Refresh, Help, Loading, Plus,
  HomeFilled, Document, Message, Setting, Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { 
  getSearchIndexStatus,
  rebuildSearchIndex,
  getBlockedNotes,
  addBlockedNote,
  removeBlockedNote,
  getSearchLogs,
  getTrendingSearchWords,
  searchNotes
} from '@/api/search'
import { getNoteList } from '@/api/note'
import { getSearchConfig, updateSearchConfig } from '@/api/config'

// 选项卡状态
const activeTab = ref('index')

// 搜索配置状态
const searchConfig = ref({
  suggest_count: 5,
  title_weight: 2,
  content_weight: 1,
  enable_suggest: true,
  enable_trending: true
})
const searchConfigRef = ref(null)
const savingConfig = ref(false)
const originalConfig = ref({})

// 索引管理状态
const indexStatus = ref({
  index_exists: false,
  indexed_count: 0,
  total_active_notes: 0,
  index_coverage: '0%'
})
const loadingIndexStatus = ref(false)
const rebuildingIndex = ref(false)

// 屏蔽列表状态
const blockedNotesData = ref([])
const blockedTotalCount = ref(0)
const blockedCurrentPage = ref(1)
const blockedPageSize = ref(20)
const loadingBlockedList = ref(false)
const selectedBlockedNotes = ref([])
const blockedSearchKeyword = ref('')

// 添加屏蔽对话框
const addBlockedDialogVisible = ref(false)
const blockedForm = ref({
  noteId: '',
  noteTitle: ''
})
const blockedFormRef = ref(null)
const addingBlocked = ref(false)

// 搜索日志状态
const searchLogsData = ref([])
const logsTotalCount = ref(0)
const logsCurrentPage = ref(1)
const logsPageSize = ref(20)
const loadingLogsList = ref(false)
const logsSearchKeyword = ref('')
const logsDateRange = ref([])

// 热门搜索词状态
const trendingKeywordsData = ref([])
const loadingTrendingList = ref(false)
const trendingTimeRange = ref('7')
const trendingLimit = ref(20)

// 日期格式化
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 选项卡切换处理
const handleTabChange = (tabName) => {
  if (tabName === 'index') {
    fetchIndexStatus()
  } else if (tabName === 'blocked') {
    fetchBlockedNotes()
  } else if (tabName === 'logs') {
    fetchSearchLogs()
  } else if (tabName === 'trending') {
    fetchTrendingKeywords()
  } else if (tabName === 'config') {
    fetchSearchConfig()
  }
}

// 获取搜索配置
const fetchSearchConfig = async () => {
  try {
    const response = await getSearchConfig()
    if (response.code === 200) {
      searchConfig.value = response.data
      // 保存原始配置用于重置
      originalConfig.value = { ...response.data }
    } else {
      ElMessage.error(response.message || '获取搜索配置失败')
    }
  } catch (error) {
    console.error('获取搜索配置失败:', error)
    ElMessage.error('获取搜索配置失败，请稍后重试')
  }
}

// 保存搜索配置
const handleSaveSearch = async () => {
  try {
    await searchConfigRef.value.validate()
    
    savingConfig.value = true
    const response = await updateSearchConfig(searchConfig.value)
    
    if (response.code === 200) {
      ElMessage.success('搜索配置保存成功')
      // 更新原始配置
      originalConfig.value = { ...searchConfig.value }
    } else {
      ElMessage.error(response.message || '保存搜索配置失败')
    }
  } catch (error) {
    if (error && error.name === 'Error') {
      // 表单验证失败，Element Plus会自动显示错误提示
      return
    }
    console.error('保存搜索配置失败:', error)
    ElMessage.error('保存搜索配置失败，请稍后重试')
  } finally {
    savingConfig.value = false
  }
}

// 重置搜索配置
const handleResetSearch = () => {
  searchConfig.value = { ...originalConfig.value }
  nextTick(() => {
    searchConfigRef.value?.resetFields()
  })
  ElMessage.success('搜索配置已重置')
}

// 获取索引状态
const fetchIndexStatus = async () => {
  loadingIndexStatus.value = true
  try {
    const response = await getSearchIndexStatus()
    if (response.code === 200) {
      indexStatus.value = response.data
    } else {
      ElMessage.error(response.message || '获取索引状态失败')
    }
  } catch (error) {
    console.error('获取索引状态失败:', error)
    ElMessage.error('获取索引状态失败，请稍后重试')
  } finally {
    loadingIndexStatus.value = false
  }
}

// 重建索引
const handleRebuildIndex = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重建搜索索引吗？此操作可能需要较长时间，期间搜索功能可能受到影响。',
      '确认重建',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    rebuildingIndex.value = true
    const response = await rebuildSearchIndex()
    if (response.code === 200) {
      ElMessage.success('搜索索引重建成功')
      // 重新获取索引状态
      await fetchIndexStatus()
    } else {
      ElMessage.error(response.message || '重建索引失败')
    }
  } catch (error) {
    if (error === 'cancel') return // 用户取消操作
    console.error('重建索引失败:', error)
    ElMessage.error('重建索引失败，请检查MySQL配置和全文索引支持情况')
  } finally {
    rebuildingIndex.value = false
  }
}

// 获取屏蔽列表
const fetchBlockedNotes = async () => {
  loadingBlockedList.value = true
  try {
    const params = {
      page: blockedCurrentPage.value,
      pageSize: blockedPageSize.value
    }
    
    const response = await getBlockedNotes(params)
    if (response.code === 200) {
      blockedNotesData.value = response.data.list
      blockedTotalCount.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取屏蔽列表失败')
    }
  } catch (error) {
    console.error('获取屏蔽列表失败:', error)
    ElMessage.error('获取屏蔽列表失败，请稍后重试')
  } finally {
    loadingBlockedList.value = false
  }
}

// 处理屏蔽列表选择变化
const handleBlockedSelectionChange = (selection) => {
  selectedBlockedNotes.value = selection
}

// 处理屏蔽列表分页大小变化
const handleBlockedSizeChange = (size) => {
  blockedPageSize.value = size
  fetchBlockedNotes()
}

// 处理屏蔽列表当前页变化
const handleBlockedCurrentChange = (current) => {
  blockedCurrentPage.value = current
  fetchBlockedNotes()
}

// 搜索笔记并添加屏蔽
const handleBlockedSearch = async () => {
  if (!blockedSearchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    const response = await getNoteList({
      keyword: blockedSearchKeyword.value.trim(),
      page: 1,
      pageSize: 10
    })
    
    if (response.code === 200 && response.data.list && response.data.list.length > 0) {
      // 适配数据格式，将list转换为items
      searchNotesData.value = response.data.list
      searchNotesTotal.value = response.data.total
      noteSearchDialogVisible.value = true
    } else {
      ElMessage.warning('未找到匹配的笔记')
    }
  } catch (error) {
    console.error('搜索笔记失败:', error)
    ElMessage.error('搜索笔记失败，请稍后重试')
  }
}

// 打开添加屏蔽对话框
const handleAddBlockedNote = () => {
  blockedForm.noteId = ''
  blockedForm.noteTitle = ''
  addBlockedDialogVisible.value = true
  nextTick(() => {
    blockedFormRef.value?.resetFields()
  })
}

// 搜索笔记对话框相关
const noteSearchDialogVisible = ref(false)
const searchNotesData = ref([])
const searchNotesTotal = ref(0)
const selectedNotesForBlock = ref([])
const searchNotesKeyword = ref('')
const searchNotesPage = ref(1)
const searchNotesPageSize = ref(10)

// 搜索笔记
const searchNotesForBlock = async () => {
  try {
    const response = await getNoteList({
      keyword: searchNotesKeyword.value.trim(),
      page: searchNotesPage.value,
      pageSize: searchNotesPageSize.value
    })
    
    if (response.code === 200) {
      searchNotesData.value = response.data.items
      searchNotesTotal.value = response.data.total
      // 保持之前的选择状态
      selectedNotesForBlock.value = selectedNotesForBlock.value.filter(selectedNote => 
        searchNotesData.value.some(note => note.id === selectedNote.id)
      )
    } else {
      ElMessage.error(response.message || '搜索笔记失败')
    }
  } catch (error) {
    console.error('搜索笔记失败:', error)
    ElMessage.error('搜索笔记失败，请稍后重试')
  }
}

// 处理笔记搜索
const handleNotesSearch = () => {
  searchNotesPage.value = 1
  searchNotesForBlock()
}

// 处理笔记搜索分页大小变化
const handleNotesSizeChange = (size) => {
  searchNotesPageSize.value = size
  searchNotesForBlock()
}

// 处理笔记搜索当前页变化
const handleNotesCurrentChange = (current) => {
  searchNotesPage.value = current
  searchNotesForBlock()
}

// 确认选择笔记并添加屏蔽
const handleConfirmSelectNotes = async () => {
  if (selectedNotesForBlock.value.length === 0) {
    ElMessage.warning('请至少选择一条笔记')
    return
  }
  
  noteSearchDialogVisible.value = false
  addingBlocked.value = true
  
  try {
    // 批量添加屏蔽笔记
    const successNotes = []
    const failedNotes = []
    
    for (const note of selectedNotesForBlock.value) {
      try {
        const response = await addBlockedNote({
          noteId: note.id
        })
        
        if (response.code === 200) {
          successNotes.push(note)
        } else {
          failedNotes.push({ note, error: response.message })
        }
      } catch (error) {
        failedNotes.push({ note, error: '添加失败' })
      }
    }
    
    if (successNotes.length > 0) {
      ElMessage.success(`成功添加${successNotes.length}条笔记到屏蔽列表`)
      fetchBlockedNotes() // 重新获取屏蔽列表
    }
    
    if (failedNotes.length > 0) {
      ElMessage.error(`有${failedNotes.length}条笔记添加失败`)
    }
    
  } catch (error) {
    console.error('批量添加屏蔽笔记失败:', error)
    ElMessage.error('添加到屏蔽列表失败，请稍后重试')
  } finally {
    addingBlocked.value = false
    selectedNotesForBlock.value = []
  }
}

// 取消选择笔记
const handleCancelSelectNotes = () => {
  noteSearchDialogVisible.value = false
  selectedNotesForBlock.value = []
  searchNotesKeyword.value = ''
  searchNotesPage.value = 1
}

// 取消添加屏蔽
const handleCancelAddBlocked = () => {
  addBlockedDialogVisible.value = false
  blockedForm.noteId = ''
  blockedForm.noteTitle = ''
}

// 确认添加屏蔽
const handleConfirmAddBlocked = async () => {
  if (!blockedForm.noteId) {
    ElMessage.warning('请输入笔记ID')
    return
  }
  
  addingBlocked.value = true
  try {
    const response = await addBlockedNote({
      noteId: blockedForm.noteId
    })
    
    if (response.code === 200) {
      ElMessage.success('添加到屏蔽列表成功')
      addBlockedDialogVisible.value = false
      blockedForm.noteId = ''
      blockedForm.noteTitle = ''
      fetchBlockedNotes() // 重新获取屏蔽列表
    } else {
      ElMessage.error(response.message || '添加到屏蔽列表失败')
    }
  } catch (error) {
    console.error('添加到屏蔽列表失败:', error)
    ElMessage.error('添加到屏蔽列表失败，请稍后重试')
  } finally {
    addingBlocked.value = false
  }
}

// 移除屏蔽笔记
const handleRemoveBlockedNote = async (noteId, noteTitle) => {
  try {
    await ElMessageBox.confirm(
      `确定要从屏蔽列表移除笔记「${noteTitle || noteId}」吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await removeBlockedNote({
      noteId: noteId
    })
    
    if (response.code === 200) {
      ElMessage.success('从屏蔽列表移除成功')
      fetchBlockedNotes() // 重新获取屏蔽列表
    } else {
      ElMessage.error(response.message || '从屏蔽列表移除失败')
    }
  } catch (error) {
    if (error === 'cancel') return // 用户取消操作
    console.error('从屏蔽列表移除失败:', error)
    ElMessage.error('从屏蔽列表移除失败，请稍后重试')
  }
}

// 获取搜索日志
const fetchSearchLogs = async () => {
  loadingLogsList.value = true
  try {
    const params = {
      page: logsCurrentPage.value,
      pageSize: logsPageSize.value,
      keyword: logsSearchKeyword.value.trim() || undefined
    }
    
    // 添加日期范围
    if (logsDateRange.value && logsDateRange.value.length === 2) {
      params.startDate = dayjs(logsDateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(logsDateRange.value[1]).format('YYYY-MM-DD')
    }
    
    const response = await getSearchLogs(params)
    if (response.code === 200) {
      searchLogsData.value = response.data.items
      logsTotalCount.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取搜索日志失败')
    }
  } catch (error) {
    console.error('获取搜索日志失败:', error)
    ElMessage.error('获取搜索日志失败，请稍后重试')
  } finally {
    loadingLogsList.value = false
  }
}

// 搜索日志
const handleLogsSearch = () => {
  logsCurrentPage.value = 1
  fetchSearchLogs()
}

// 重置日志筛选条件
const resetLogsFilters = () => {
  logsSearchKeyword.value = ''
  logsDateRange.value = []
  logsCurrentPage.value = 1
  fetchSearchLogs()
}

// 处理日志分页大小变化
const handleLogsSizeChange = (size) => {
  logsPageSize.value = size
  fetchSearchLogs()
}

// 处理日志当前页变化
const handleLogsCurrentChange = (current) => {
  logsCurrentPage.value = current
  fetchSearchLogs()
}

// 获取热门搜索词
const fetchTrendingKeywords = async () => {
  loadingTrendingList.value = true
  try {
    const params = {
      timeRange: trendingTimeRange.value + 'd',
      limit: trendingLimit.value
    }
    
    const response = await getTrendingSearchWords(params)
    if (response.code === 200) {
      trendingKeywordsData.value = response.data
    } else {
      ElMessage.error(response.message || '获取热门搜索词失败')
    }
  } catch (error) {
    console.error('获取热门搜索词失败:', error)
    ElMessage.error('获取热门搜索词失败，请稍后重试')
  } finally {
    loadingTrendingList.value = false
  }
}

// 查询热门搜索词
const handleTrendingSearch = () => {
  fetchTrendingKeywords()
}

// 页面加载时获取数据
onMounted(() => {
  fetchIndexStatus()
})
</script>

<style scoped>
.search-management-page {
  padding: 1.5rem;
}

/* 统一样式 - 参考系统配置页面 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
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

/* 搜索配置样式 */
.search-config-section {
  padding: 1rem 0;
}

.form-hint {
  margin-left: 0.5rem;
  color: #909399;
  font-size: 0.85rem;
}

/* 索引管理样式 */
.index-management-section {
  padding: 1rem 0;
}

.index-status-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #fafafa;
}

.index-status-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #909399;
}

/* 针对Loading组件减小加载图标大小 */
.loading-state .el-loading-spinner {
  width: 30px !important;
  height: 30px !important;
}

.loading-state .el-loading-spinner .circular {
  width: 30px !important;
  height: 30px !important;
}

.loading-state .el-loading-spinner .path {
  stroke-width: 2 !important;
}

/* 针对表格的v-loading减小加载图标大小 */
.el-table__body-wrapper .el-loading-spinner {
  width: 30px !important;
  height: 30px !important;
}

.el-table__body-wrapper .el-loading-spinner .circular {
  width: 30px !important;
  height: 30px !important;
}

.el-table__body-wrapper .el-loading-spinner .path {
  stroke-width: 2 !important;
}

.index-status-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  color: #606266;
  font-size: 0.95rem;
}

.status-value {
  font-weight: 600;
  color: #303133;
}

.index-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 调整刷新状态按钮图标大小 */
.index-actions .el-button .el-icon--left {
  font-size: 14px;
}

/* 调整按钮加载状态的内置图标大小 - 增强版本，确保覆盖所有Element Plus按钮加载图标样式 */
.index-actions .el-button--loading .el-icon-loading,
.index-actions .el-button.is-loading .el-icon-loading {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  display: inline-block !important;
  line-height: 1 !important;
}

/* 确保按钮加载时的动画容器也被正确缩放 */
.index-actions .el-button--loading .el-icon-loading::before,
.index-actions .el-button.is-loading .el-icon-loading::before {
  display: inline-block !important;
  font-size: 14px !important;
}

/* 全局加载图标样式 - 确保所有加载图标大小一致 */
.el-loading-mask .el-loading-spinner {
  width: 30px !important;
  height: 30px !important;
}

.el-loading-mask .el-loading-spinner .circular {
  width: 30px !important;
  height: 30px !important;
}

.el-loading-mask .el-loading-spinner .path {
  stroke-width: 2 !important;
}

.help-icon {
  color: #909399;
  cursor: pointer;
}

/* 通用表格样式 */
.search-filter-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input {
  width: 250px;
}

.filter-select {
  width: 150px;
}

.date-range-picker {
  width: 280px;
}

.time-range-select {
  width: 120px;
}

.limit-input {
  width: 120px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* 热门搜索词排名 */
.rank-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #42b983;
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* 响应式调整 - 参考系统配置页面 */
@media (max-width: 768px) {
  .search-management-page {
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
  
  .search-input,
  .filter-select,
  .date-range-picker,
  .time-range-select,
  .limit-input {
    width: 100%;
  }
  
  .index-status-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .search-filter-container > * {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .el-form-item__label {
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 0.5rem;
  }
  
  .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>