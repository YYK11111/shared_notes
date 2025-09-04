<template>
  <div class="system-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>系统设置</h1>
      <p class="page-description">管理系统各项配置参数</p>
    </div>
    
    <!-- 侧边导航 -->
    <div class="system-layout">
      <el-card class="system-sidebar">
        <el-menu
          :default-active="activeTab"
          class="system-menu"
          @select="handleTabChange"
          mode="vertical"
        >
          <el-menu-item index="site">
            <el-icon><Setting /></el-icon>
            <span>站点设置</span>
          </el-menu-item>
          <el-menu-item index="database">
            <el-icon><Setting /></el-icon>
            <span>数据库设置</span>
          </el-menu-item>
          <el-menu-item index="search">
            <el-icon><Search /></el-icon>
            <span>搜索设置</span>
          </el-menu-item>
          <el-menu-item index="security">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </el-menu-item>
          <el-menu-item index="notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="performance">
            <el-icon><LineChart /></el-icon>
            <span>性能设置</span>
          </el-menu-item>
        </el-menu>
      </el-card>
      
      <!-- 主内容区 -->
      <div class="system-content">
        <!-- 站点设置 -->
        <div v-if="activeTab === 'site'" class="setting-section">
          <h2 class="section-title">
            <el-icon><Setting /></el-icon>
            站点设置
          </h2>
          
          <el-card class="setting-card">
            <el-form
              ref="siteFormRef"
              :model="siteSettings"
              :rules="siteFormRules"
              label-width="120px"
              class="setting-form"
            >
              <el-form-item label="站点名称" prop="siteName">
                <el-input
                  v-model="siteSettings.siteName"
                  placeholder="请输入站点名称"
                  clearable
                  maxlength="50"
                  show-word-limit
                />
                <div class="form-tip">显示在浏览器标签和页面顶部</div>
              </el-form-item>
              
              <el-form-item label="站点描述" prop="siteDescription">
                <el-input
                  v-model="siteSettings.siteDescription"
                  type="textarea"
                  placeholder="请输入站点描述"
                  :rows="3"
                  maxlength="200"
                  show-word-limit
                />
                <div class="form-tip">用于SEO和站点简介</div>
              </el-form-item>
              
              <el-form-item label="站点Logo" prop="siteLogo">
                <el-upload
                  v-model:file-list="siteLogoList"
                  class="upload-demo"
                  action=""
                  :before-upload="handleSiteLogoUpload"
                  :on-remove="handleSiteLogoRemove"
                  :show-file-list="true"
                  :auto-upload="false"
                  list-type="picture"
                >
                  <template #default>
                    <div v-if="!siteSettings.siteLogo">
                      <el-button type="primary">上传Logo</el-button>
                    </div>
                    <img
                      v-else
                      :src="siteSettings.siteLogo"
                      alt="站点Logo"
                      class="site-logo-preview"
                    />
                  </template>
                </el-upload>
                <div class="form-tip">建议上传尺寸为200x60的PNG或JPG图片</div>
              </el-form-item>
              
              <el-form-item label="联系邮箱" prop="contactEmail">
                <el-input
                  v-model="siteSettings.contactEmail"
                  placeholder="请输入联系邮箱"
                  clearable
                />
                <div class="form-tip">用于接收系统通知和用户反馈</div>
              </el-form-item>
              
              <el-form-item label="备案信息" prop="icpInfo">
                <el-input
                  v-model="siteSettings.icpInfo"
                  placeholder="请输入ICP备案号"
                  clearable
                  maxlength="50"
                  show-word-limit
                />
                <div class="form-tip">网站ICP备案信息</div>
              </el-form-item>
              
              <el-form-item label="底部版权" prop="footerCopyright">
                <el-input
                  v-model="siteSettings.footerCopyright"
                  type="textarea"
                  placeholder="请输入底部版权信息"
                  :rows="2"
                  maxlength="200"
                  show-word-limit
                />
                <div class="form-tip">显示在页面底部</div>
              </el-form-item>
              
              <el-form-item label="站点语言" prop="siteLanguage">
                <el-select
                  v-model="siteSettings.siteLanguage"
                  placeholder="请选择站点语言"
                >
                  <el-option label="中文简体" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="是否开启" prop="siteStatus">
                <el-switch
                  v-model="siteSettings.siteStatus"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ siteSettings.siteStatus === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="维护模式" prop="maintenanceMode">
                <el-switch
                  v-model="siteSettings.maintenanceMode"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ siteSettings.maintenanceMode === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="维护提示" prop="maintenanceMessage" v-if="siteSettings.maintenanceMode === 1">
                <el-input
                  v-model="siteSettings.maintenanceMessage"
                  type="textarea"
                  placeholder="请输入维护提示信息"
                  :rows="3"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button @click="handleReset('site')">重置</el-button>
                  <el-button
                    type="primary"
                    @click="handleSave('site')"
                    :loading="siteSaving"
                  >
                    保存设置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <!-- 数据库设置 -->
        <div v-if="activeTab === 'database'" class="setting-section">
          <h2 class="section-title">
            <el-icon><Setting /></el-icon>
            数据库设置
          </h2>
          
          <el-card class="setting-card">
            <div class="db-info-section">
              <h3 class="db-info-title">数据库信息</h3>
              <div class="db-info-grid">
                <div class="db-info-item">
                  <label>数据库类型:</label>
                  <span>{{ dbInfo.dbType || '-' }}</span>
                </div>
                <div class="db-info-item">
                  <label>版本:</label>
                  <span>{{ dbInfo.version || '-' }}</span>
                </div>
                <div class="db-info-item">
                  <label>连接状态:</label>
                  <span class="status-badge" :class="dbInfo.connectionStatus ? 'status-connected' : 'status-disconnected'">
                    {{ dbInfo.connectionStatus ? '已连接' : '未连接' }}
                  </span>
                </div>
                <div class="db-info-item">
                  <label>数据库大小:</label>
                  <span>{{ formatSize(dbInfo.dbSize) }}</span>
                </div>
                <div class="db-info-item">
                  <label>表数量:</label>
                  <span>{{ dbInfo.tableCount || 0 }}</span>
                </div>
                <div class="db-info-item">
                  <label>笔记总数:</label>
                  <span>{{ dbInfo.noteCount || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="db-actions-section">
              <h3 class="db-actions-title">数据库操作</h3>
              <div class="db-actions">
                <el-button
                  type="primary"
                  @click="handleBackupDatabase"
                  :loading="dbBackuping"
                  icon="Download"
                >
                  备份数据库
                </el-button>
                
                <el-upload
                  class="backup-upload"
                  action=""
                  :before-upload="handleRestoreDatabase"
                  :auto-upload="false"
                  accept=".sql,.zip,.gz"
                >
                  <el-button
                    type="warning"
                    :loading="dbRestoring"
                    icon="Upload"
                  >
                    恢复数据库
                  </el-button>
                </el-upload>
                
                <el-button
                  @click="handleOptimizeDatabase"
                  :loading="dbOptimizing"
                  icon="Refresh"
                >
                  优化数据库
                </el-button>
                
                <el-button
                  type="danger"
                  @click="handleClearCache"
                  icon="Delete"
                >
                  清除缓存
                </el-button>
              </div>
              
              <div class="db-tips">
                <el-alert
                  title="重要提示"
                  type="warning"
                  :closable="false"
                  show-icon
                >
                  <ul>
                    <li>• 数据库备份和恢复操作可能需要较长时间，请耐心等待</li>
                    <li>• 恢复数据库前，请确保已备份当前数据</li>
                    <li>• 清除缓存会导致系统性能暂时下降，请谨慎操作</li>
                  </ul>
                </el-alert>
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 搜索设置 -->
        <div v-if="activeTab === 'search'" class="setting-section">
          <h2 class="section-title">
            <el-icon><Search /></el-icon>
            搜索设置
          </h2>
          
          <el-card class="setting-card">
            <el-form
              ref="searchFormRef"
              :model="searchSettings"
              :rules="searchFormRules"
              label-width="120px"
              class="setting-form"
            >
              <el-form-item label="搜索方式" prop="searchMethod">
                <el-radio-group v-model="searchSettings.searchMethod">
                  <el-radio :label="1">精确搜索</el-radio>
                  <el-radio :label="2">模糊搜索</el-radio>
                  <el-radio :label="3">高级搜索</el-radio>
                </el-radio-group>
                <div class="form-tip">
                  精确搜索：仅匹配完整关键词<br>
                  模糊搜索：匹配包含关键词的内容<br>
                  高级搜索：支持复杂条件组合
                </div>
              </el-form-item>
              
              <el-form-item label="搜索结果排序" prop="searchResultSort">
                <el-select
                  v-model="searchSettings.searchResultSort"
                  placeholder="请选择搜索结果排序方式"
                >
                  <el-option label="相关度" value="relevance" />
                  <el-option label="最新发布" value="newest" />
                  <el-option label="最多浏览" value="views" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="搜索范围" prop="searchScope">
                <el-checkbox-group v-model="searchSettings.searchScope">
                  <el-checkbox label="title">标题</el-checkbox>
                  <el-checkbox label="content">内容</el-checkbox>
                  <el-checkbox label="tags">标签</el-checkbox>
                  <el-checkbox label="summary">摘要</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="搜索结果数量" prop="searchResultCount">
                <el-input-number
                  v-model="searchSettings.searchResultCount"
                  :min="10"
                  :max="100"
                  :step="10"
                  label="每页显示数量"
                />
                <div class="form-tip">每页显示的搜索结果数量</div>
              </el-form-item>
              
              <el-form-item label="高亮关键词" prop="highlightKeywords">
                <el-switch
                  v-model="searchSettings.highlightKeywords"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ searchSettings.highlightKeywords === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="搜索缓存" prop="searchCache">
                <el-switch
                  v-model="searchSettings.searchCache"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ searchSettings.searchCache === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="缓存有效期" prop="cacheExpireTime" v-if="searchSettings.searchCache === 1">
                <el-input-number
                  v-model="searchSettings.cacheExpireTime"
                  :min="5"
                  :max="1440"
                  :step="5"
                  label="分钟"
                />
                <span class="unit-label">分钟</span>
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button @click="handleReset('search')">重置</el-button>
                  <el-button
                    type="primary"
                    @click="handleSave('search')"
                    :loading="searchSaving"
                  >
                    保存设置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="setting-section">
          <h2 class="section-title">
            <el-icon><Lock /></el-icon>
            安全设置
          </h2>
          
          <el-card class="setting-card">
            <el-form
              ref="securityFormRef"
              :model="securitySettings"
              :rules="securityFormRules"
              label-width="120px"
              class="setting-form"
            >
              <el-form-item label="登录尝试次数" prop="loginAttempts">
                <el-input-number
                  v-model="securitySettings.loginAttempts"
                  :min="3"
                  :max="20"
                  label="次"
                />
                <div class="form-tip">达到次数后账户将被锁定</div>
              </el-form-item>
              
              <el-form-item label="锁定时间" prop="lockTime">
                <el-input-number
                  v-model="securitySettings.lockTime"
                  :min="5"
                  :max="1440"
                  label="分钟"
                />
                <span class="unit-label">分钟</span>
              </el-form-item>
              
              <el-form-item label="密码复杂度" prop="passwordComplexity">
                <el-select
                  v-model="securitySettings.passwordComplexity"
                  placeholder="请选择密码复杂度要求"
                >
                  <el-option label="低（至少6位）" value="low" />
                  <el-option label="中（字母+数字）" value="medium" />
                  <el-option label="高（字母+数字+特殊字符）" value="high" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="密码有效期" prop="passwordExpiry">
                <el-input-number
                  v-model="securitySettings.passwordExpiry"
                  :min="0"
                  :max="365"
                  label="天"
                />
                <span class="unit-label">天（0表示永不过期）</span>
              </el-form-item>
              
              <el-form-item label="会话超时" prop="sessionTimeout">
                <el-input-number
                  v-model="securitySettings.sessionTimeout"
                  :min="5"
                  :max="720"
                  label="分钟"
                />
                <span class="unit-label">分钟（自动登出）</span>
              </el-form-item>
              
              <el-form-item label="IP白名单" prop="ipWhitelist">
                <el-input
                  v-model="securitySettings.ipWhitelist"
                  type="textarea"
                  placeholder="请输入IP地址，每行一个"
                  :rows="4"
                />
                <div class="form-tip">留空表示不限制IP</div>
              </el-form-item>
              
              <el-form-item label="HTTPS强制" prop="forceHttps">
                <el-switch
                  v-model="securitySettings.forceHttps"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ securitySettings.forceHttps === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="XSS防护" prop="xssProtection">
                <el-switch
                  v-model="securitySettings.xssProtection"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ securitySettings.xssProtection === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="CSRF防护" prop="csrfProtection">
                <el-switch
                  v-model="securitySettings.csrfProtection"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ securitySettings.csrfProtection === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button @click="handleReset('security')">重置</el-button>
                  <el-button
                    type="primary"
                    @click="handleSave('security')"
                    :loading="securitySaving"
                  >
                    保存设置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <!-- 通知设置 -->
        <div v-if="activeTab === 'notification'" class="setting-section">
          <h2 class="section-title">
            <el-icon><Bell /></el-icon>
            通知设置
          </h2>
          
          <el-card class="setting-card">
            <el-form
              ref="notificationFormRef"
              :model="notificationSettings"
              :rules="notificationFormRules"
              label-width="120px"
              class="setting-form"
            >
              <el-form-item label="邮件通知" prop="emailNotification">
                <el-switch
                  v-model="notificationSettings.emailNotification"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ notificationSettings.emailNotification === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="管理员通知" prop="adminNotification" v-if="notificationSettings.emailNotification === 1">
                <el-input
                  v-model="notificationSettings.adminNotification"
                  placeholder="请输入接收通知的邮箱"
                  clearable
                />
                <div class="form-tip">多个邮箱用逗号分隔</div>
              </el-form-item>
              
              <el-form-item label="登录通知" prop="loginNotification">
                <el-switch
                  v-model="notificationSettings.loginNotification"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ notificationSettings.loginNotification === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="操作日志通知" prop="operationNotification">
                <el-switch
                  v-model="notificationSettings.operationNotification"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ notificationSettings.operationNotification === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="错误通知" prop="errorNotification">
                <el-switch
                  v-model="notificationSettings.errorNotification"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ notificationSettings.errorNotification === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="通知级别" prop="notificationLevel" v-if="notificationSettings.errorNotification === 1">
                <el-select
                  v-model="notificationSettings.notificationLevel"
                  placeholder="请选择通知级别"
                >
                  <el-option label="致命错误" value="fatal" />
                  <el-option label="错误" value="error" />
                  <el-option label="警告" value="warning" />
                  <el-option label="信息" value="info" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button @click="handleReset('notification')">重置</el-button>
                  <el-button
                    type="primary"
                    @click="handleSave('notification')"
                    :loading="notificationSaving"
                  >
                    保存设置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        
        <!-- 性能设置 -->
        <div v-if="activeTab === 'performance'" class="setting-section">
          <h2 class="section-title">
            <el-icon><LineChart /></el-icon>
            性能设置
          </h2>
          
          <el-card class="setting-card">
            <div class="system-stats-section">
              <h3 class="system-stats-title">系统状态</h3>
              <div class="system-stats-grid">
                <div class="system-stat-item">
                  <label>CPU使用率:</label>
                  <span class="stat-value">{{ systemStats.cpuUsage }}%</span>
                </div>
                <div class="system-stat-item">
                  <label>内存使用率:</label>
                  <span class="stat-value">{{ systemStats.memoryUsage }}%</span>
                </div>
                <div class="system-stat-item">
                  <label>磁盘使用率:</label>
                  <span class="stat-value">{{ systemStats.diskUsage }}%</span>
                </div>
                <div class="system-stat-item">
                  <label>系统负载:</label>
                  <span class="stat-value">{{ systemStats.loadAverage }}</span>
                </div>
                <div class="system-stat-item">
                  <label>在线用户数:</label>
                  <span class="stat-value">{{ systemStats.onlineUsers }}</span>
                </div>
                <div class="system-stat-item">
                  <label>响应时间:</label>
                  <span class="stat-value">{{ systemStats.responseTime }}ms</span>
                </div>
              </div>
            </div>
            
            <el-form
              ref="performanceFormRef"
              :model="performanceSettings"
              :rules="performanceFormRules"
              label-width="120px"
              class="setting-form"
            >
              <el-form-item label="缓存启用" prop="cacheEnabled">
                <el-switch
                  v-model="performanceSettings.cacheEnabled"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ performanceSettings.cacheEnabled === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="缓存类型" prop="cacheType" v-if="performanceSettings.cacheEnabled === 1">
                <el-select
                  v-model="performanceSettings.cacheType"
                  placeholder="请选择缓存类型"
                >
                  <el-option label="内存缓存" value="memory" />
                  <el-option label="文件缓存" value="file" />
                  <el-option label="Redis" value="redis" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="页面缓存" prop="pageCache">
                <el-switch
                  v-model="performanceSettings.pageCache"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ performanceSettings.pageCache === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="压缩静态资源" prop="compressStaticAssets">
                <el-switch
                  v-model="performanceSettings.compressStaticAssets"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ performanceSettings.compressStaticAssets === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item label="预加载" prop="preloadEnabled">
                <el-switch
                  v-model="performanceSettings.preloadEnabled"
                  :active-value="1"
                  :inactive-value="0"
                />
                <span class="switch-label">{{ performanceSettings.preloadEnabled === 1 ? '开启' : '关闭' }}</span>
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button @click="handleReset('performance')">重置</el-button>
                  <el-button
                    type="primary"
                    @click="handleSave('performance')"
                    :loading="performanceSaving"
                  >
                    保存设置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import api from '../utils/api';
import auth from '../utils/auth';

// 当前激活的标签页
const activeTab = ref('site');

// 表单引用
const siteFormRef = ref(null);
const searchFormRef = ref(null);
const securityFormRef = ref(null);
const notificationFormRef = ref(null);
const performanceFormRef = ref(null);

// 保存状态
const siteSaving = ref(false);
const searchSaving = ref(false);
const securitySaving = ref(false);
const notificationSaving = ref(false);
const performanceSaving = ref(false);

// 数据库操作状态
const dbBackuping = ref(false);
const dbRestoring = ref(false);
const dbOptimizing = ref(false);

// 站点Logo列表
const siteLogoList = ref([]);

// 站点设置
const siteSettings = reactive({
  siteName: '',
  siteDescription: '',
  siteLogo: '',
  contactEmail: '',
  icpInfo: '',
  footerCopyright: '',
  siteLanguage: 'zh-CN',
  siteStatus: 1,
  maintenanceMode: 0,
  maintenanceMessage: ''
});

// 搜索设置
const searchSettings = reactive({
  searchMethod: 2,
  searchResultSort: 'relevance',
  searchScope: ['title', 'content'],
  searchResultCount: 20,
  highlightKeywords: 1,
  searchCache: 1,
  cacheExpireTime: 30
});

// 安全设置
const securitySettings = reactive({
  loginAttempts: 5,
  lockTime: 30,
  passwordComplexity: 'medium',
  passwordExpiry: 90,
  sessionTimeout: 60,
  ipWhitelist: '',
  forceHttps: 0,
  xssProtection: 1,
  csrfProtection: 1
});

// 通知设置
const notificationSettings = reactive({
  emailNotification: 1,
  adminNotification: '',
  loginNotification: 1,
  operationNotification: 0,
  errorNotification: 1,
  notificationLevel: 'error'
});

// 性能设置
const performanceSettings = reactive({
  cacheEnabled: 1,
  cacheType: 'memory',
  pageCache: 1,
  compressStaticAssets: 1,
  preloadEnabled: 1
});

// 系统状态
const systemStats = reactive({
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  loadAverage: '0.00',
  onlineUsers: 0,
  responseTime: 0
});

// 数据库信息
const dbInfo = reactive({
  dbType: '',
  version: '',
  connectionStatus: true,
  dbSize: 0,
  tableCount: 0,
  noteCount: 0
});

// 表单验证规则
const siteFormRules = {
  siteName: [
    { required: true, message: '请输入站点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '站点名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  contactEmail: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

const searchFormRules = {};
const securityFormRules = {};
const notificationFormRules = {
  adminNotification: [
    {
      validator: (rule, value, callback) => {
        if (notificationSettings.emailNotification === 1 && !value) {
          callback(new Error('请输入接收通知的邮箱'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};
const performanceFormRules = {};

// 处理标签切换
const handleTabChange = (tabIndex) => {
  activeTab.value = tabIndex;
};

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 处理站点Logo上传
const handleSiteLogoUpload = (file) => {
  const isPNG = file.type === 'image/png';
  const isJPG = file.type === 'image/jpeg';
  const isLt2M = file.size / 1024 / 1024 < 2;
  
  if (!isPNG && !isJPG) {
    ElMessage.error('只支持PNG、JPG格式的图片');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB');
    return false;
  }
  
  // 上传Logo
  uploadSiteLogo(file);
  return false;
};

// 上传站点Logo
const uploadSiteLogo = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.system.uploadSiteLogo(formData);
    if (res.code === 200 && res.data.url) {
      siteSettings.siteLogo = res.data.url;
      siteLogoList.value = [{ url: res.data.url }];
      ElMessage.success('Logo上传成功');
    } else {
      ElMessage.error('Logo上传失败');
    }
  } catch (error) {
    console.error('Logo上传失败:', error);
    ElMessage.error('Logo上传失败');
  }
};

// 处理站点Logo删除
const handleSiteLogoRemove = () => {
  siteSettings.siteLogo = '';
  siteLogoList.value = [];
};

// 处理保存设置
const handleSave = async (type) => {
  try {
    let formRef, settingsData, savingRef;
    
    switch (type) {
      case 'site':
        formRef = siteFormRef;
        settingsData = siteSettings;
        savingRef = siteSaving;
        break;
      case 'search':
        formRef = searchFormRef;
        settingsData = searchSettings;
        savingRef = searchSaving;
        break;
      case 'security':
        formRef = securityFormRef;
        settingsData = securitySettings;
        savingRef = securitySaving;
        break;
      case 'notification':
        formRef = notificationFormRef;
        settingsData = notificationSettings;
        savingRef = notificationSaving;
        break;
      case 'performance':
        formRef = performanceFormRef;
        settingsData = performanceSettings;
        savingRef = performanceSaving;
        break;
      default:
        return;
    }
    
    // 验证表单
    if (formRef.value) {
      await formRef.value.validate();
    }
    
    savingRef.value = true;
    
    // 调用API保存设置
    const res = await api.system.updateSettings(type, settingsData);
    
    if (res.code === 200) {
      ElMessage.success('设置保存成功');
    } else {
      ElMessage.error(res.message || '设置保存失败');
    }
  } catch (error) {
    console.error(`保存${getTypeLabel(type)}设置失败:`, error);
    if (error instanceof Error && error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(`保存${getTypeLabel(type)}设置失败，请重试`);
    }
  } finally {
    // 根据类型设置对应的保存状态为false
    switch (type) {
      case 'site':
        siteSaving.value = false;
        break;
      case 'search':
        searchSaving.value = false;
        break;
      case 'security':
        securitySaving.value = false;
        break;
      case 'notification':
        notificationSaving.value = false;
        break;
      case 'performance':
        performanceSaving.value = false;
        break;
    }
  }
};

// 处理重置设置
const handleReset = async (type) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置${getTypeLabel(type)}设置吗？这将恢复为默认设置。`,
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 调用API获取默认设置
    const res = await api.system.getSettings(type);
    
    if (res.code === 200 && res.data) {
      // 更新本地设置
      switch (type) {
        case 'site':
          Object.assign(siteSettings, res.data);
          if (siteSettings.siteLogo) {
            siteLogoList.value = [{ url: siteSettings.siteLogo }];
          }
          break;
        case 'search':
          Object.assign(searchSettings, res.data);
          break;
        case 'security':
          Object.assign(securitySettings, res.data);
          break;
        case 'notification':
          Object.assign(notificationSettings, res.data);
          break;
        case 'performance':
          Object.assign(performanceSettings, res.data);
          break;
      }
      
      ElMessage.success(`已重置${getTypeLabel(type)}设置`);
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error(`重置${getTypeLabel(type)}设置失败:`, error);
    ElMessage.error(`重置${getTypeLabel(type)}设置失败`);
  }
};

// 获取类型标签
const getTypeLabel = (type) => {
  const labels = {
    'site': '站点',
    'search': '搜索',
    'security': '安全',
    'notification': '通知',
    'performance': '性能'
  };
  return labels[type] || type;
};

// 处理备份数据库
const handleBackupDatabase = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要备份数据库吗？备份过程中请勿关闭页面或刷新。',
      '确认备份',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    dbBackuping.value = true;
    
    const res = await api.system.backupDatabase();
    
    if (res.code === 200 && res.data && res.data.downloadUrl) {
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('数据库备份成功');
    } else {
      ElMessage.error(res.message || '数据库备份失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('数据库备份失败:', error);
    ElMessage.error('数据库备份失败');
  } finally {
    dbBackuping.value = false;
  }
};

// 处理恢复数据库
const handleRestoreDatabase = async (file) => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复数据库吗？这将覆盖当前所有数据，请确保已备份重要数据！',
      '确认恢复',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    dbRestoring.value = true;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.system.restoreDatabase(formData);
    
    if (res.code === 200) {
      ElMessage.success('数据库恢复成功，系统将重启');
      // 这里可以添加系统重启后的处理逻辑
    } else {
      ElMessage.error(res.message || '数据库恢复失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('数据库恢复失败:', error);
    ElMessage.error('数据库恢复失败');
  } finally {
    dbRestoring.value = false;
  }
  
  return false;
};

// 处理优化数据库
const handleOptimizeDatabase = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要优化数据库吗？优化过程可能会占用一定系统资源。',
      '确认优化',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
    
    dbOptimizing.value = true;
    
    const res = await api.system.optimizeDatabase();
    
    if (res.code === 200) {
      ElMessage.success('数据库优化成功');
      // 重新获取数据库信息
      fetchDbInfo();
    } else {
      ElMessage.error(res.message || '数据库优化失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('数据库优化失败:', error);
    ElMessage.error('数据库优化失败');
  } finally {
    dbOptimizing.value = false;
  }
};

// 处理清除缓存
const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除系统缓存吗？这可能会导致系统性能暂时下降。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.system.clearCache();
    
    if (res.code === 200) {
      ElMessage.success('系统缓存已清除');
    } else {
      ElMessage.error(res.message || '清除缓存失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('清除缓存失败:', error);
    ElMessage.error('清除缓存失败');
  }
};

// 获取设置
const fetchSettings = async () => {
  try {
    // 获取站点设置
    const siteRes = await api.system.getSettings('site');
    if (siteRes.code === 200 && siteRes.data) {
      Object.assign(siteSettings, siteRes.data);
      if (siteSettings.siteLogo) {
        siteLogoList.value = [{ url: siteSettings.siteLogo }];
      }
    }
    
    // 获取搜索设置
    const searchRes = await api.system.getSettings('search');
    if (searchRes.code === 200 && searchRes.data) {
      Object.assign(searchSettings, searchRes.data);
    }
    
    // 获取安全设置
    const securityRes = await api.system.getSettings('security');
    if (securityRes.code === 200 && securityRes.data) {
      Object.assign(securitySettings, securityRes.data);
    }
    
    // 获取通知设置
    const notificationRes = await api.system.getSettings('notification');
    if (notificationRes.code === 200 && notificationRes.data) {
      Object.assign(notificationSettings, notificationRes.data);
    }
    
    // 获取性能设置
    const performanceRes = await api.system.getSettings('performance');
    if (performanceRes.code === 200 && performanceRes.data) {
      Object.assign(performanceSettings, performanceRes.data);
    }
  } catch (error) {
    console.error('获取系统设置失败:', error);
  }
};

// 获取数据库信息
const fetchDbInfo = async () => {
  try {
    const res = await api.system.getDbInfo();
    if (res.code === 200 && res.data) {
      Object.assign(dbInfo, res.data);
    }
  } catch (error) {
    console.error('获取数据库信息失败:', error);
  }
};

// 获取系统状态
const fetchSystemStats = async () => {
  try {
    const res = await api.system.getSystemStatus();
    if (res.code === 200 && res.data) {
      Object.assign(systemStats, res.data);
    }
  } catch (error) {
    console.error('获取系统状态失败:', error);
  }
};

// 页面加载时初始化数据
onMounted(() => {
  fetchSettings();
  fetchDbInfo();
  fetchSystemStats();
  
  // 定期更新系统状态（每30秒）
  const statsInterval = setInterval(() => {
    fetchSystemStats();
  }, 30000);
  
  // 组件卸载时清除定时器
  const onUnmounted = () => {
    clearInterval(statsInterval);
  };
  
  // 导出卸载时的清理函数
  defineExpose({ onUnmounted });
});
</script>

<style scoped>
/* 系统设置页面容器 */
.system-container {
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

/* 系统设置布局 */
.system-layout {
  display: flex;
  gap: 20px;
}

/* 侧边导航 */
.system-sidebar {
  width: 200px;
  flex-shrink: 0;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.system-menu {
  border-right: none;
}

.system-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
}

.system-menu .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 主内容区 */
.system-content {
  flex: 1;
  min-width: 0;
}

/* 设置区块 */
.setting-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 设置卡片 */
.setting-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 设置表单 */
.setting-form {
  padding: 24px;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 开关标签 */
.switch-label {
  margin-left: 12px;
  font-size: 14px;
  color: #6b7280;
}

/* 单位标签 */
.unit-label {
  margin-left: 8px;
  font-size: 14px;
  color: #6b7280;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 站点Logo预览 */
.site-logo-preview {
  max-width: 200px;
  max-height: 60px;
  object-fit: contain;
}

/* 数据库信息区块 */
.db-info-section {
  margin-bottom: 24px;
  padding: 16px 24px;
  background-color: #f8fafc;
  border-radius: 6px;
}

.db-info-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.db-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.db-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.db-info-item label {
  font-size: 14px;
  color: #6b7280;
}

.db-info-item span {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

/* 状态徽章 */
.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-connected {
  background-color: #d1fae5;
  color: #065f46;
}

.status-disconnected {
  background-color: #fee2e2;
  color: #991b1b;
}

/* 数据库操作区块 */
.db-actions-section {
  padding: 0 24px 24px 24px;
}

.db-actions-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.db-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.db-tips {
  margin-top: 20px;
}

/* 系统状态区块 */
.system-stats-section {
  margin-bottom: 24px;
  padding: 16px 24px;
  background-color: #f8fafc;
  border-radius: 6px;
}

.system-stats-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.system-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.system-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.system-stat-item label {
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
  .system-layout {
    flex-direction: column;
  }
  
  .system-sidebar {
    width: 100%;
  }
  
  .system-menu {
    display: flex;
    flex-wrap: wrap;
  }
  
  .system-menu .el-menu-item {
    flex: 1;
    min-width: 120px;
  }
}

@media screen and (max-width: 768px) {
  .setting-form {
    padding: 16px;
  }
  
  .db-info-grid,
  .system-stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .db-actions {
    flex-direction: column;
  }
  
  .db-actions .el-button {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
  
  .system-menu {
    display: block;
  }
  
  .system-menu .el-menu-item {
    width: 100%;
    min-width: auto;
  }
}

@media screen and (max-width: 480px) {
  .setting-form :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
  }
  
  .setting-form :deep(.el-form-item__label) {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .setting-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  
  .db-info-grid,
  .system-stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 自定义滚动条 */
.system-content {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.system-content::-webkit-scrollbar {
  width: 6px;
}

.system-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.system-content::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}
</style>