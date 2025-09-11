<template>
  <div class="config-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">系统配置</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleSaveAll">
              <el-icon><IconCheck /></el-icon>
              保存全部配置
            </el-button>
            <el-button @click="handleResetAll">
              <el-icon><IconRefresh /></el-icon>
              全部重置
            </el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="mt-2" @tab-change="handleTabChange">
        <!-- 基本配置标签 -->
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
            <div class="form-actions">
              <el-button type="primary" @click="handleSaveBasic">
                <el-icon><IconCheck /></el-icon>
                保存基本配置
              </el-button>
              <el-button @click="handleResetBasic">
                <el-icon><IconRefresh /></el-icon>
                重置
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        

        
        <!-- 首页配置标签 -->
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
            <div class="form-actions">
              <el-button type="primary" @click="handleSaveHomepage">
                <el-icon><IconCheck /></el-icon>
                保存首页配置
              </el-button>
              <el-button @click="handleResetHomepage">
                <el-icon><IconRefresh /></el-icon>
                重置
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 文件上传配置标签 -->
        <el-tab-pane label="文件上传配置" name="fileUpload">
          <div class="config-form">
            <el-form :model="configForm.fileUpload" label-width="120px" ref="fileUploadFormRef">
              <el-form-item label="文件上传开关" prop="enable">
                <el-switch v-model="configForm.fileUpload.enable" active-text="开启" inactive-text="关闭" />
                <div class="form-tip">关闭后将禁止所有文件上传操作</div>
              </el-form-item>
              <el-form-item label="最大文件大小(MB)" prop="maxSizeMB" :rules="[{ required: true, message: '请输入最大文件大小', trigger: 'blur', type: 'number' }]" label-width="140px">
                <el-input-number v-model="configForm.fileUpload.maxSizeMB" :min="1" :max="1000" :step="1" />
                <div class="form-tip">直接输入MB数值，例如：5 表示 5MB</div>
              </el-form-item>
              <el-form-item label="允许的文件类型" prop="allowedTypes">
                <div class="file-types-display">
                  <el-tag
                    v-for="(type, index) in configForm.fileUpload.allowedTypes"
                    :key="index"
                    closable
                    @close="removeFileType(index)"
                    type="info"
                  >
                    {{ type }}
                  </el-tag>
                  <el-input
                    v-model="newFileType"
                    placeholder="添加新的文件类型"
                    size="small"
                    style="width: 200px; margin-left: 10px;"
                    @keyup.enter="addFileType"
                  />
                </div>
                <div style="margin-top: 10px;">
                  <el-button type="primary" size="small" @click="openFileTypesDialog">
                    <el-icon><FolderChecked /></el-icon>
                    选择常见类型
                  </el-button>
                  <div class="form-tip">已配置 {{ configForm.fileUpload.allowedTypes.length }} 种文件类型</div>
                </div>
              </el-form-item>
              <el-form-item label="最大上传数量" prop="maxCount" :rules="[{ required: true, message: '请输入最大上传数量', trigger: 'blur', type: 'number' }]">
                <el-input-number v-model="configForm.fileUpload.maxCount" :min="1" :max="100" :step="1" />
                <div class="form-tip">单次最多可以上传的文件数量</div>
              </el-form-item>
              <el-form-item label="存储路径" prop="storagePath" :rules="[{ required: true, message: '请输入存储路径', trigger: 'blur' }]">
                <el-input v-model="configForm.fileUpload.storagePath" placeholder="如：uploads" />
                <div class="form-tip">文件存储的相对路径，建议使用默认值</div>
              </el-form-item>
            </el-form>
            <div class="form-actions">
              <el-button type="primary" @click="handleSaveFileUpload">
                <el-icon><IconCheck /></el-icon>
                保存文件上传配置
              </el-button>
              <el-button @click="handleResetFileUpload">
                <el-icon><IconRefresh /></el-icon>
                重置
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 文件类型选择对话框 -->
      <el-dialog v-model="fileTypesDialogVisible" title="选择允许的文件类型" width="600px" :before-close="handleDialogClose">
        <el-checkbox-group v-model="selectedFileTypes" class="file-types-checkboxes">
          <div v-for="type in commonFileTypes" :key="type.value" class="file-type-checkbox">
            <el-checkbox :label="type.value">{{ type.label }}</el-checkbox>
          </div>
        </el-checkbox-group>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="fileTypesDialogVisible.value = false">取消</el-button>
            <el-button type="primary" @click="confirmFileTypes">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getSystemConfigs, updateSystemConfigs, getHomeConfig, updateHomeConfig, getFileUploadConfig, updateFileUploadConfig } from '@/api/config'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check as IconCheck, Refresh as IconRefresh, Plus as IconPlus, FolderChecked } from '@element-plus/icons-vue'

// 当前激活的标签页
const activeTab = ref('basic')

// 状态变量
const loading = ref(false)
const tabLoaded = {
  basic: false,
  homepage: false,
  fileUpload: false
}

// 表单引用
const basicFormRef = ref()
const homepageFormRef = ref()
const fileUploadFormRef = ref()

// 文件类型文本，用于显示和编辑
const fileTypesText = computed({
  get() {
    return configForm.fileUpload.allowed_types?.join(',') || ''
  },
  set(value) {
    if (value) {
      configForm.fileUpload.allowed_types = value.split(',').map(type => type.trim())
    } else {
      configForm.fileUpload.allowed_types = []
    }
  }
})

// 新文件类型输入
const newFileType = ref('')

// 添加文件类型
const addFileType = () => {
  if (newFileType.value.trim()) {
    const typeToAdd = newFileType.value.trim()
    if (!configForm.fileUpload.allowed_types.includes(typeToAdd)) {
      configForm.fileUpload.allowed_types.push(typeToAdd)
      ElMessage.success('文件类型添加成功')
    } else {
      ElMessage.warning('该文件类型已存在')
    }
    newFileType.value = ''
  }
}

// 移除文件类型
const removeFileType = (index) => {
  configForm.fileUpload.allowed_types.splice(index, 1)
  ElMessage.success('文件类型移除成功')
}

// 常见文件类型选项
const commonFileTypes = [
  { label: '图片文件 - JPG', value: 'image/jpeg' },
  { label: '图片文件 - PNG', value: 'image/png' },
  { label: '图片文件 - GIF', value: 'image/gif' },
  { label: '图片文件 - WEBP', value: 'image/webp' },
  { label: '文档文件 - PDF', value: 'application/pdf' },
  { label: '文档文件 - DOC/DOCX', value: 'application/msword' },
  { label: '文档文件 - DOCX', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { label: '文档文件 - XLS/XLSX', value: 'application/vnd.ms-excel' },
  { label: '文档文件 - XLSX', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { label: '文档文件 - PPT/PPTX', value: 'application/vnd.ms-powerpoint' },
  { label: '文档文件 - PPTX', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { label: '文本文件 - TXT', value: 'text/plain' },
  { label: '文本文件 - CSV', value: 'text/csv' },
  { label: '压缩文件 - ZIP', value: 'application/zip' },
  { label: '压缩文件 - RAR', value: 'application/x-rar-compressed' }
]

// 文件类型选择对话框可见性
const fileTypesDialogVisible = ref(false)

// 选中的文件类型
const selectedFileTypes = ref([])

// 打开文件类型选择对话框
const openFileTypesDialog = () => {
  // 初始化选中的文件类型
  selectedFileTypes.value = [...configForm.fileUpload.allowed_types]
  fileTypesDialogVisible.value = true
}

// 确认选择文件类型
const confirmFileTypes = () => {
  configForm.fileUpload.allowed_types = [...selectedFileTypes.value]
  fileTypesDialogVisible.value = false
}

// 处理对话框关闭
const handleDialogClose = (done) => {
  done()
}

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
  homepage: {
    carousel_count: 3,
    recommended_notes_count: 6,
    latest_notes_count: 10,
    hot_categories_count: 5,
    hot_notes_count: 8
  },
  fileUpload: {
    maxSize: 5242880, // 默认5MB（字节）
    maxSizeMB: 5, // 默认5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxCount: 5,
    enable: true, // 默认启用文件上传
    storagePath: 'uploads' // 默认存储路径
  }
})

// 原始配置数据，用于重置
const originalConfig = ref({})

// 获取指定标签页的配置
const fetchTabConfig = async (tabName) => {
  if (tabLoaded[tabName]) return // 如果已经加载过，则不再加载
  
  loading.value = true
  try {
    let configData = {};
    
    // 根据标签页名称获取对应配置
    if (tabName === 'basic') {
      const basicConfigRes = await getSystemConfigs();
      configData = basicConfigRes.data || {};
      Object.assign(configForm.basic, configData);
    } else if (tabName === 'homepage') {
      const homeConfigRes = await getHomeConfig();
      configData = homeConfigRes.data || {};
      Object.assign(configForm.homepage, configData);
    } else if (tabName === 'fileUpload') {
      const fileUploadConfigRes = await getFileUploadConfig();
      configData = fileUploadConfigRes.data || {};
      
      // 确保enable是布尔值
      if (typeof configData.enable !== 'boolean') {
        if (typeof configData.enable === 'string') {
          configData.enable = configData.enable === '1' || configData.enable === 'true';
        } else if (typeof configData.enable === 'number') {
          configData.enable = configData.enable === 1;
        }
      }
      
      // 处理allowedTypes，确保是数组
      if (typeof configData.allowedTypes === 'string') {
        try {
          configData.allowedTypes = JSON.parse(configData.allowedTypes);
        } catch (e) {
          console.error('解析allowedTypes失败:', e);
          configData.allowedTypes = [];
        }
      } else if (!Array.isArray(configData.allowedTypes)) {
        configData.allowedTypes = [];
      }
      
      // 直接使用后端返回的数据结构
      Object.assign(configForm.fileUpload, configData);
    }
    
    // 标记为已加载
    tabLoaded[tabName] = true;
    
    // 保存原始配置用于重置
    if (!originalConfig.value[tabName]) {
      if (!originalConfig.value) {
        originalConfig.value = {};
      }
      originalConfig.value[tabName] = JSON.parse(JSON.stringify(configForm[tabName]));
    }
  } catch (error) {
    ElMessage.error(`获取${tabName === 'basic' ? '基本' : tabName === 'homepage' ? '首页' : '文件上传'}配置失败：` + (error.message || '未知错误'));
    console.error(`获取${tabName === 'basic' ? '基本' : tabName === 'homepage' ? '首页' : '文件上传'}配置失败:`, error);
  } finally {
    loading.value = false;
  }
}

// 处理标签页切换
const handleTabChange = (tabName) => {
  fetchTabConfig(tabName);
};

// 获取所有配置（用于保存全部和重置全部功能）
const fetchAllConfigs = async () => {
  loading.value = true;
  try {
    // 并行获取所有配置
    const [basicConfigRes, homeConfigRes, fileUploadConfigRes] = await Promise.all([
      getSystemConfigs(),
      getHomeConfig(),
      getFileUploadConfig()
    ]);
    
    // 处理基本配置
    const basicConfig = basicConfigRes.data || {};
    Object.assign(configForm.basic, basicConfig);
    
    // 处理首页配置
    const homeConfig = homeConfigRes.data || {};
    Object.assign(configForm.homepage, homeConfig);
    
    // 处理文件上传配置
    const fileUploadConfig = fileUploadConfigRes.data || {};
    
    // 确保enable是布尔值
    if (typeof fileUploadConfig.enable !== 'boolean') {
      if (typeof fileUploadConfig.enable === 'string') {
        fileUploadConfig.enable = fileUploadConfig.enable === '1' || fileUploadConfig.enable === 'true';
      } else if (typeof fileUploadConfig.enable === 'number') {
        fileUploadConfig.enable = fileUploadConfig.enable === 1;
      }
    }
    
    // 处理allowedTypes，确保是数组
    if (typeof fileUploadConfig.allowedTypes === 'string') {
      try {
        fileUploadConfig.allowedTypes = JSON.parse(fileUploadConfig.allowedTypes);
      } catch (e) {
        console.error('解析allowedTypes失败:', e);
        fileUploadConfig.allowedTypes = [];
      }
    } else if (!Array.isArray(fileUploadConfig.allowedTypes)) {
      fileUploadConfig.allowedTypes = [];
    }
    
    // 直接使用后端返回的数据结构
    Object.assign(configForm.fileUpload, fileUploadConfig);
    
    // 标记所有标签页为已加载
    tabLoaded.basic = true;
    tabLoaded.homepage = true;
    tabLoaded.fileUpload = true;
    
    // 保存原始配置用于重置
    originalConfig.value = JSON.parse(JSON.stringify(configForm));
  } catch (error) {
    ElMessage.error('获取系统配置失败：' + (error.message || '未知错误'));
    console.error('获取系统配置失败:', error);
  } finally {
    loading.value = false;
  }
};

// 保存基本配置
const handleSaveBasic = async () => {
  // 验证表单
  let valid = true
  if (basicFormRef.value) {
    valid = await basicFormRef.value.validate().catch(() => false)
  }
  
  if (!valid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  try {
    // 准备要保存的配置数据
    const configToSave = configForm.basic
    
    await updateSystemConfigs(configToSave)
    
    // 更新原始配置
    originalConfig.value.basic = JSON.parse(JSON.stringify(configForm.basic))
    
    ElMessage.success('基本配置保存成功')
  } catch (error) {
    ElMessage.error('基本配置保存失败：' + (error.message || '未知错误'))
    console.error('保存基本配置失败:', error)
  }
}



// 保存首页配置
const handleSaveHomepage = async () => {
  // 验证表单
  let valid = true
  if (homepageFormRef.value) {
    valid = await homepageFormRef.value.validate().catch(() => false)
  }
  
  if (!valid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  try {
    // 准备要保存的配置数据
    const configToSave = configForm.homepage
    
    await updateHomeConfig(configToSave)
    
    // 更新原始配置
    originalConfig.value.homepage = JSON.parse(JSON.stringify(configForm.homepage))
    
    ElMessage.success('首页配置保存成功')
  } catch (error) {
    ElMessage.error('首页配置保存失败：' + (error.message || '未知错误'))
    console.error('保存首页配置失败:', error)
  }
}

// 保存所有配置
const handleSaveAll = async () => {
  try {
    // 分别验证所有表单
    let valid = true
    
    if (basicFormRef.value) {
      valid = valid && await basicFormRef.value.validate().catch(() => false)
    }
    
    if (homepageFormRef.value) {
      valid = valid && await homepageFormRef.value.validate().catch(() => false)
    }
    
    if (fileUploadFormRef.value) {
      valid = valid && await fileUploadFormRef.value.validate().catch(() => false)
    }
    
    if (!valid) {
      ElMessage.warning('请检查所有表单输入')
      return
    }
    
    // 并行保存所有配置
    await Promise.all([
      updateSystemConfigs(configForm.basic),
      updateHomeConfig(configForm.homepage),
      updateFileUploadConfig({
          // 转换为蛇形命名法以匹配后端接口
          max_size: configForm.fileUpload.maxSizeMB,
          max_size_bytes: configForm.fileUpload.maxSizeMB * 1024 * 1024,
          allowed_types: JSON.stringify(configForm.fileUpload.allowedTypes),
          max_count: configForm.fileUpload.maxCount,
          enable: configForm.fileUpload.enable,
          storage_path: configForm.fileUpload.storagePath
        })
    ])
    
    // 更新原始配置
    originalConfig.value = JSON.parse(JSON.stringify(configForm))
    
    ElMessage.success('所有配置保存成功')
  } catch (error) {
    ElMessage.error('保存配置失败：' + (error.message || '未知错误'))
    console.error('保存配置失败:', error)
  }
}

// 保存文件上传配置
const handleSaveFileUpload = async () => {
  // 验证表单
  let valid = true
  if (fileUploadFormRef.value) {
    valid = await fileUploadFormRef.value.validate().catch(() => false)
  }
  
  if (!valid) {
    ElMessage.warning('请检查表单输入')
    return
  }
  
  try {
    // 准备要保存的配置数据，转换为蛇形命名法以匹配后端接口
    const configToSave = {
      max_size: configForm.fileUpload.maxSizeMB,
      max_size_bytes: configForm.fileUpload.maxSizeMB * 1024 * 1024,
      allowed_types: JSON.stringify(configForm.fileUpload.allowedTypes),
      max_count: configForm.fileUpload.maxCount,
      enable: configForm.fileUpload.enable,
      storage_path: configForm.fileUpload.storagePath
    }
    
    await updateFileUploadConfig(configToSave)
  
    // 更新原始配置
    originalConfig.value.fileUpload = JSON.parse(JSON.stringify(configForm.fileUpload))
    
    ElMessage.success('文件上传配置保存成功')
  } catch (error) {
    ElMessage.error('文件上传配置保存失败：' + (error.message || '未知错误'))
    console.error('保存文件上传配置失败:', error)
  }
}



// 重置基本配置
const handleResetBasic = () => {
  ElMessageBox.confirm(
    '确定要重置当前基本配置吗？未保存的更改将会丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 重置到原始配置
    if (originalConfig.value && originalConfig.value.basic) {
      Object.assign(configForm.basic, originalConfig.value.basic || {})
      
      // 重置表单验证状态
      if (basicFormRef.value) {
        basicFormRef.value.resetFields()
      }
      
      ElMessage.success('基本配置已重置')
    }
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

// 重置文件上传配置
const handleResetFileUpload = () => {
  ElMessageBox.confirm(
    '确定要重置当前文件上传配置吗？未保存的更改将会丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 重置到原始配置
    if (originalConfig.value && originalConfig.value.fileUpload) {
      Object.assign(configForm.fileUpload, originalConfig.value.fileUpload || {})
      
      // 重置表单验证状态
      if (fileUploadFormRef.value) {
        fileUploadFormRef.value.resetFields()
      }
      
      ElMessage.success('文件上传配置已重置')
    }
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}



// 重置首页配置
const handleResetHomepage = () => {
  ElMessageBox.confirm(
    '确定要重置当前首页配置吗？未保存的更改将会丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 重置到原始配置
    if (originalConfig.value && originalConfig.value.homepage) {
      Object.assign(configForm.homepage, originalConfig.value.homepage || {})
      
      // 重置表单验证状态
      if (homepageFormRef.value) {
        homepageFormRef.value.resetFields()
      }
      
      ElMessage.success('首页配置已重置')
    }
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

// 重置所有配置
const handleResetAll = () => {
  ElMessageBox.confirm(
    '确定要重置所有配置吗？未保存的更改将会丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 如果原始配置不存在或不完整，重新获取所有配置
    if (!originalConfig.value || !originalConfig.value.basic || !originalConfig.value.homepage || !originalConfig.value.fileUpload) {
      await fetchAllConfigs();
    } else {
      // 重置到原始配置
      if (originalConfig.value) {
        Object.assign(configForm.basic, originalConfig.value.basic || {})
        Object.assign(configForm.homepage, originalConfig.value.homepage || {})
        Object.assign(configForm.fileUpload, originalConfig.value.fileUpload || {})
        
        // 重置所有表单验证状态
        if (basicFormRef.value) {
          basicFormRef.value.resetFields()
        }
        if (homepageFormRef.value) {
          homepageFormRef.value.resetFields()
        }
        if (fileUploadFormRef.value) {
          fileUploadFormRef.value.resetFields()
        }
      }
    }
    
    ElMessage.success('所有配置已重置')
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}

// 初始化页面数据，只加载默认标签页
onMounted(() => {
  fetchTabConfig('basic')
})
</script>

<style scoped>
.config-page {
  padding: 1.5rem;
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

.form-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 1rem;
}



.form-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.5;
  }
  
  .file-types-display {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    min-height: 40px;
    background-color: #fafafa;
  }
  
  .file-types-display .el-tag {
    margin: 5px 5px 5px 0;
  }
  
  .file-types-checkboxes {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
  }
  
  .file-type-checkbox {
    display: inline-block;
    width: 50%;
    margin-bottom: 10px;
  }

.config-page {
  text-align: left;
}

.el-tabs {
  width: 100%;
}

.el-tabs__content {
  padding-top: 0;
}

.el-tab-pane {
  text-align: left;
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
  
  .add-sensitive-word {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-sensitive-word .el-input {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>