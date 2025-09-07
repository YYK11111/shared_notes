<template>
  <div class="config-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">系统配置</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleSaveConfig">
              <el-icon><IconCheck /></el-icon>
              保存配置
            </el-button>
            <el-button @click="handleResetConfig">
              <el-icon><IconRefresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 配置标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="基本配置" name="basic">
          <div class="config-form">
            <el-form :model="configForm.basic" label-width="120px" ref="basicFormRef">
              <el-form-item label="网站名称" prop="site_name" :rules="[{ required: true, message: '请输入网站名称', trigger: 'blur' }]">
                <el-input v-model="configForm.basic.site_name" placeholder="请输入网站名称" />
              </el-form-item>
              <el-form-item label="网站描述" prop="site_description">
                <el-input v-model="configForm.basic.site_description" type="textarea" placeholder="请输入网站描述" :rows="3" />
              </el-form-item>
              <el-form-item label="网站关键词" prop="site_keywords">
                <el-input v-model="configForm.basic.site_keywords" placeholder="请输入网站关键词，用逗号分隔" />
              </el-form-item>
              <el-form-item label="网站ICP备案" prop="icp_record">
                <el-input v-model="configForm.basic.icp_record" placeholder="请输入网站ICP备案号" />
              </el-form-item>
              <el-form-item label="网站状态">
                <el-switch v-model="configForm.basic.site_status" active-text="开启" inactive-text="关闭" />
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="configForm.basic.maintenance_mode" active-text="开启" inactive-text="关闭" />
              </el-form-item>
              <el-form-item label="维护提示" prop="maintenance_message" v-if="configForm.basic.maintenance_mode">
                <el-input v-model="configForm.basic.maintenance_message" type="textarea" placeholder="请输入维护提示信息" :rows="3" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="搜索配置" name="search">
          <div class="config-form">
            <el-form :model="configForm.search" label-width="120px" ref="searchFormRef">
              <el-form-item label="搜索结果数量" prop="results_per_page">
                <el-input-number v-model="configForm.search.results_per_page" :min="1" :max="100" :step="1" />
              </el-form-item>
              <el-form-item label="搜索缓存时间(秒)" prop="cache_time">
                <el-input-number v-model="configForm.search.cache_time" :min="0" :max="86400" :step="60" />
              </el-form-item>
              <el-form-item label="搜索历史记录" prop="save_search_history">
                <el-switch v-model="configForm.search.save_search_history" active-text="开启" inactive-text="关闭" />
              </el-form-item>
              <el-form-item label="热门搜索数量" prop="hot_search_count">
                <el-input-number v-model="configForm.search.hot_search_count" :min="0" :max="50" :step="1" />
              </el-form-item>
              <el-form-item label="搜索建议功能" prop="enable_suggestions">
                <el-switch v-model="configForm.search.enable_suggestions" active-text="开启" inactive-text="关闭" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="首页配置" name="homepage">
          <div class="config-form">
            <el-form :model="configForm.homepage" label-width="120px" ref="homepageFormRef">
              <el-form-item label="轮播图数量" prop="carousel_count">
                <el-input-number v-model="configForm.homepage.carousel_count" :min="0" :max="10" :step="1" />
              </el-form-item>
              <el-form-item label="推荐笔记数量" prop="recommended_notes_count">
                <el-input-number v-model="configForm.homepage.recommended_notes_count" :min="0" :max="20" :step="1" />
              </el-form-item>
              <el-form-item label="最新笔记数量" prop="latest_notes_count">
                <el-input-number v-model="configForm.homepage.latest_notes_count" :min="0" :max="20" :step="1" />
              </el-form-item>
              <el-form-item label="热门分类数量" prop="hot_categories_count">
                <el-input-number v-model="configForm.homepage.hot_categories_count" :min="0" :max="10" :step="1" />
              </el-form-item>
              <el-form-item label="热门笔记数量" prop="hot_notes_count">
                <el-input-number v-model="configForm.homepage.hot_notes_count" :min="0" :max="20" :step="1" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="系统备份" name="backup">
          <div class="backup-section">
            <div class="backup-actions">
              <el-button type="primary" @click="handleBackup">
                <el-icon><IconDownload /></el-icon>
                创建备份
              </el-button>
              <el-button @click="handleRestore" :disabled="backups.length === 0">
                <el-icon><IconUpload /></el-icon>
                恢复备份
              </el-button>
              <el-button type="danger" @click="handleCleanBackups">
                <el-icon><IconDelete /></el-icon>
                清理备份
              </el-button>
            </div>
            
            <!-- 备份列表 -->
            <el-table
              v-loading="loadingBackups"
              :data="backups"
              style="width: 100%"
              border
              class="backup-table"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="filename" label="备份文件名" min-width="250" />
              <el-table-column prop="size" label="大小" width="100">
                <template #default="{ row }">
                  <span>{{ formatFileSize(row.size) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="{ row }">
                  <span>{{ formatDate(row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button link @click="handleDownloadBackup(row.filename)">下载</el-button>
                  <el-button link type="danger" @click="handleDeleteBackup(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import dayjs from 'dayjs'
import { getSystemConfig, updateSystemConfig, createBackup, getBackupList, deleteBackup, restoreFromBackup } from '@/api/config'

// 状态变量
const loading = ref(false)
const loadingBackups = ref(false)
const activeTab = ref('basic')
const backups = ref([])

// 表单引用
const basicFormRef = ref()
const searchFormRef = ref()
const homepageFormRef = ref()

// 配置表单数据
const configForm = reactive({
  basic: {
    site_name: '',
    site_description: '',
    site_keywords: '',
    icp_record: '',
    site_status: true,
    maintenance_mode: false,
    maintenance_message: ''
  },
  search: {
    results_per_page: 10,
    cache_time: 3600,
    save_search_history: true,
    hot_search_count: 10,
    enable_suggestions: true
  },
  homepage: {
    carousel_count: 3,
    recommended_notes_count: 6,
    latest_notes_count: 10,
    hot_categories_count: 5,
    hot_notes_count: 8
  }
})

// 原始配置数据，用于重置
const originalConfig = ref({})

// 获取系统配置
const fetchSystemConfig = async () => {
  loading.value = true
  try {
    const response = await getSystemConfig()
    const config = response.data || {}
    
    // 合并配置数据
    if (config.basic) {
      Object.assign(configForm.basic, config.basic)
    }
    if (config.search) {
      Object.assign(configForm.search, config.search)
    }
    if (config.homepage) {
      Object.assign(configForm.homepage, config.homepage)
    }
    
    // 保存原始配置用于重置
    originalConfig.value = JSON.parse(JSON.stringify(configForm))
  } catch (error) {
    ElMessage.error('获取系统配置失败：' + (error.message || '未知错误'))
    console.error('获取系统配置失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取备份列表
const fetchBackups = async () => {
  loadingBackups.value = true
  try {
    const response = await getBackupList()
    backups.value = response.data?.items || []
  } catch (error) {
    ElMessage.error('获取备份列表失败：' + (error.message || '未知错误'))
    console.error('获取备份列表失败:', error)
  } finally {
    loadingBackups.value = false
  }
}

// 保存配置
const handleSaveConfig = async () => {
  // 根据当前标签页验证表单
  let valid = true
  if (activeTab.value === 'basic' && basicFormRef.value) {
    valid = await basicFormRef.value.validate().catch(() => false)
  } else if (activeTab.value === 'search' && searchFormRef.value) {
    valid = await searchFormRef.value.validate().catch(() => false)
  } else if (activeTab.value === 'homepage' && homepageFormRef.value) {
    valid = await homepageFormRef.value.validate().catch(() => false)
  }
  
  if (!valid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  try {
    // 准备要保存的配置数据
    let configToSave = {}
    
    if (activeTab.value === 'basic') {
      configToSave.basic = configForm.basic
    } else if (activeTab.value === 'search') {
      configToSave.search = configForm.search
    } else if (activeTab.value === 'homepage') {
      configToSave.homepage = configForm.homepage
    }
    
    await updateSystemConfig(configToSave)
    
    // 更新原始配置
    if (activeTab.value === 'basic') {
      originalConfig.value.basic = JSON.parse(JSON.stringify(configForm.basic))
    } else if (activeTab.value === 'search') {
      originalConfig.value.search = JSON.parse(JSON.stringify(configForm.search))
    } else if (activeTab.value === 'homepage') {
      originalConfig.value.homepage = JSON.parse(JSON.stringify(configForm.homepage))
    }
    
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败：' + (error.message || '未知错误'))
    console.error('保存配置失败:', error)
  }
}

// 重置配置
const handleResetConfig = () => {
  ElMessageBox.confirm(
    '确定要重置当前配置吗？未保存的更改将会丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 重置到原始配置
    if (originalConfig.value) {
      if (activeTab.value === 'basic') {
        Object.assign(configForm.basic, originalConfig.value.basic || {})
      } else if (activeTab.value === 'search') {
        Object.assign(configForm.search, originalConfig.value.search || {})
      } else if (activeTab.value === 'homepage') {
        Object.assign(configForm.homepage, originalConfig.value.homepage || {})
      }
      
      // 重置表单验证状态
      if (activeTab.value === 'basic' && basicFormRef.value) {
        basicFormRef.value.resetFields()
      } else if (activeTab.value === 'search' && searchFormRef.value) {
        searchFormRef.value.resetFields()
      } else if (activeTab.value === 'homepage' && homepageFormRef.value) {
        homepageFormRef.value.resetFields()
      }
      
      ElMessage.success('配置已重置')
    }
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

// 创建备份
const handleBackup = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要创建系统备份吗？这可能需要一些时间。',
      '确认备份',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    const loading = ElLoading.service({
      lock: true,
      text: '正在创建备份，请稍候...',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      await createBackup()
      ElMessage.success('备份创建成功')
      fetchBackups()
    } catch (error) {
      ElMessage.error('备份创建失败：' + (error.message || '未知错误'))
      console.error('创建备份失败:', error)
    } finally {
      loading.close()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 恢复备份
const handleRestore = () => {
  if (backups.length === 0) {
    ElMessage.warning('没有可用的备份文件')
    return
  }
  
  ElMessageBox.confirm(
    '确定要恢复系统配置吗？这将覆盖当前所有配置。\n请选择要恢复的备份文件：',
    '确认恢复',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true
    }
  ).then(async () => {
    try {
      // 在实际应用中，这里应该弹出一个选择框让用户选择要恢复的备份文件
      // 这里我们简单选择第一个备份文件进行演示
      const backupToRestore = backups.value[0]
      
      const loading = ElLoading.service({
        lock: true,
        text: '正在恢复备份，请稍候...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      try {
        await restoreFromBackup(backupToRestore.id)
        ElMessage.success('备份恢复成功')
        fetchSystemConfig()
      } catch (error) {
        ElMessage.error('备份恢复失败：' + (error.message || '未知错误'))
        console.error('恢复备份失败:', error)
      } finally {
        loading.close()
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {
    ElMessage.info('已取消恢复')
  })
}

// 下载备份
const handleDownloadBackup = (filename) => {
  ElMessage.success('下载功能暂未实现')
}

// 删除备份
const handleDeleteBackup = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个备份文件吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteBackup(id)
    ElMessage.success('备份删除成功')
    fetchBackups()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('备份删除失败：' + (error.message || '未知错误'))
      console.error('删除备份失败:', error)
    }
  }
}

// 清理备份
const handleCleanBackups = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理所有备份文件吗？这将删除所有备份，谨慎操作。',
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    )
    
    // 这里应该调用清理备份的API
    // 为了演示，我们模拟清理操作
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('备份清理成功')
    fetchBackups()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('备份清理失败：' + (error.message || '未知错误'))
      console.error('清理备份失败:', error)
    }
  }
}

// 处理标签页切换
const handleTabChange = (tab) => {
  // 标签页切换时的处理逻辑
  if (tab === 'backup') {
    fetchBackups()
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 初始化页面数据
onMounted(() => {
  fetchSystemConfig()
  if (activeTab.value === 'backup') {
    fetchBackups()
  }
})
</script>

<style scoped>
.config-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

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

.config-form {
  padding: 1rem 0;
}

.backup-section {
  padding: 1rem 0;
}

.backup-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.backup-table {
  margin-top: 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .config-page {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .backup-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .backup-actions {
    flex-direction: column;
  }
}
</style>