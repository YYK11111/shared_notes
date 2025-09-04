<template>
  <div class="logs-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>日志管理</h1>
      <p class="page-description">查看和管理系统各类日志信息</p>
    </div>
    
    <!-- 标签页导航 -->
    <el-tabs
      v-model="activeTab"
      class="logs-tabs"
      @tab-change="handleTabChange"
      type="border-card"
    >
      <!-- 操作日志 -->
      <el-tab-pane label="操作日志" name="operation">
        <div class="log-section">
          <!-- 工具栏 -->
          <div class="toolbar">
            <el-input
              v-model="operationSearchQuery"
              placeholder="搜索操作内容或操作人"
              clearable
              prefix-icon="Search"
              class="search-input"
              @clear="handleOperationSearch"
              @keyup.enter="handleOperationSearch"
            />
            
            <el-select
              v-model="operationLogType"
              placeholder="操作类型"
              clearable
              class="select-input"
              @change="handleOperationSearch"
            >
              <el-option label="登录" value="login" />
              <el-option label="登出" value="logout" />
              <el-option label="创建" value="create" />
              <el-option label="更新" value="update" />
              <el-option label="删除" value="delete" />
              <el-option label="查询" value="query" />
              <el-option label="导出" value="export" />
              <el-option label="其他" value="other" />
            </el-select>
            
            <el-date-picker
              v-model="operationDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="date-picker"
              @change="handleOperationSearch"
            />
            
            <el-button-group class="toolbar-buttons">
              <el-button
                @click="handleExportOperationLogs"
                :loading="operationExporting"
                icon="Download"
              >
                导出
              </el-button>
              
              <el-button
                type="danger"
                @click="handleClearOperationLogs"
                icon="Delete"
              >
                清空
              </el-button>
              
              <el-button
                @click="handleRefresh('operation')"
                icon="Refresh"
              >
                刷新
              </el-button>
            </el-button-group>
          </div>
          
          <!-- 日志列表表格 -->
          <el-card class="table-card">
            <el-table
              v-loading="operationLoading"
              :data="operationLogs"
              style="width: 100%"
              border
              highlight-current-row
            >
              <!-- 序号列 -->
              <el-table-column
                type="index"
                width="60"
                label="序号"
                align="center"
              />
              
              <!-- 操作人列 -->
              <el-table-column
                prop="operator"
                label="操作人"
                width="120"
              />
              
              <!-- IP地址列 -->
              <el-table-column
                prop="ipAddress"
                label="IP地址"
                width="120"
              />
              
              <!-- 操作类型列 -->
              <el-table-column
                prop="operationType"
                label="操作类型"
                width="100"
                align="center"
              >
                <template #default="scope">
                  <el-tag
                    :type="getLogTypeTag(scope.row.operationType)"
                  >
                    {{ getLogTypeLabel(scope.row.operationType) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <!-- 操作内容列 -->
              <el-table-column
                prop="operationContent"
                label="操作内容"
                min-width="300"
              />
              
              <!-- 操作模块列 -->
              <el-table-column
                prop="operationModule"
                label="操作模块"
                width="120"
              />
              
              <!-- 操作时间列 -->
              <el-table-column
                prop="createdAt"
                label="操作时间"
                width="180"
                align="center"
              >
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
              
              <!-- 详情列 -->
              <el-table-column
                label="详情"
                width="80"
                align="center"
                fixed="right"
              >
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    @click="handleOperationLogDetail(scope.row)"
                    icon="View"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="operationPagination.currentPage"
                v-model:page-size="operationPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="operationPagination.total"
                @size-change="handleOperationSizeChange"
                @current-change="handleOperationCurrentChange"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- 登录日志 -->
      <el-tab-pane label="登录日志" name="login">
        <div class="log-section">
          <!-- 工具栏 -->
          <div class="toolbar">
            <el-input
              v-model="loginSearchQuery"
              placeholder="搜索用户名或IP地址"
              clearable
              prefix-icon="Search"
              class="search-input"
              @clear="handleLoginSearch"
              @keyup.enter="handleLoginSearch"
            />
            
            <el-select
              v-model="loginStatus"
              placeholder="登录状态"
              clearable
              class="select-input"
              @change="handleLoginSearch"
            >
              <el-option label="成功" value="success" />
              <el-option label="失败" value="fail" />
            </el-select>
            
            <el-date-picker
              v-model="loginDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="date-picker"
              @change="handleLoginSearch"
            />
            
            <el-button-group class="toolbar-buttons">
              <el-button
                @click="handleExportLoginLogs"
                :loading="loginExporting"
                icon="Download"
              >
                导出
              </el-button>
              
              <el-button
                type="danger"
                @click="handleClearLoginLogs"
                icon="Delete"
              >
                清空
              </el-button>
              
              <el-button
                @click="handleRefresh('login')"
                icon="Refresh"
              >
                刷新
              </el-button>
            </el-button-group>
          </div>
          
          <!-- 日志列表表格 -->
          <el-card class="table-card">
            <el-table
              v-loading="loginLoading"
              :data="loginLogs"
              style="width: 100%"
              border
              highlight-current-row
            >
              <!-- 序号列 -->
              <el-table-column
                type="index"
                width="60"
                label="序号"
                align="center"
              />
              
              <!-- 用户名列 -->
              <el-table-column
                prop="username"
                label="用户名"
                width="120"
              />
              
              <!-- IP地址列 -->
              <el-table-column
                prop="ipAddress"
                label="IP地址"
                width="120"
              />
              
              <!-- 登录状态列 -->
              <el-table-column
                prop="status"
                label="登录状态"
                width="100"
                align="center"
              >
                <template #default="scope">
                  <el-tag
                    :type="scope.row.status === 'success' ? 'success' : 'danger'"
                  >
                    {{ scope.row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <!-- 登录设备列 -->
              <el-table-column
                prop="device"
                label="登录设备"
                width="150"
              />
              
              <!-- 浏览器列 -->
              <el-table-column
                prop="browser"
                label="浏览器"
                width="150"
              />
              
              <!-- 登录时间列 -->
              <el-table-column
                prop="createdAt"
                label="登录时间"
                width="180"
                align="center"
              >
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
              
              <!-- 详情列 -->
              <el-table-column
                label="详情"
                width="80"
                align="center"
                fixed="right"
              >
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    @click="handleLoginLogDetail(scope.row)"
                    icon="View"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="loginPagination.currentPage"
                v-model:page-size="loginPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="loginPagination.total"
                @size-change="handleLoginSizeChange"
                @current-change="handleLoginCurrentChange"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- 错误日志 -->
      <el-tab-pane label="错误日志" name="error">
        <div class="log-section">
          <!-- 工具栏 -->
          <div class="toolbar">
            <el-input
              v-model="errorSearchQuery"
              placeholder="搜索错误信息或错误类型"
              clearable
              prefix-icon="Search"
              class="search-input"
              @clear="handleErrorSearch"
              @keyup.enter="handleErrorSearch"
            />
            
            <el-select
              v-model="errorLevel"
              placeholder="错误级别"
              clearable
              class="select-input"
              @change="handleErrorSearch"
            >
              <el-option label="致命错误" value="fatal" />
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
            </el-select>
            
            <el-date-picker
              v-model="errorDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="date-picker"
              @change="handleErrorSearch"
            />
            
            <el-button-group class="toolbar-buttons">
              <el-button
                @click="handleExportErrorLogs"
                :loading="errorExporting"
                icon="Download"
              >
                导出
              </el-button>
              
              <el-button
                type="danger"
                @click="handleClearErrorLogs"
                icon="Delete"
              >
                清空
              </el-button>
              
              <el-button
                @click="handleRefresh('error')"
                icon="Refresh"
              >
                刷新
              </el-button>
            </el-button-group>
          </div>
          
          <!-- 日志列表表格 -->
          <el-card class="table-card">
            <el-table
              v-loading="errorLoading"
              :data="errorLogs"
              style="width: 100%"
              border
              highlight-current-row
            >
              <!-- 序号列 -->
              <el-table-column
                type="index"
                width="60"
                label="序号"
                align="center"
              />
              
              <!-- 错误类型列 -->
              <el-table-column
                prop="errorType"
                label="错误类型"
                width="150"
              />
              
              <!-- 错误级别列 -->
              <el-table-column
                prop="level"
                label="错误级别"
                width="100"
                align="center"
              >
                <template #default="scope">
                  <el-tag
                    :type="getErrorLevelTag(scope.row.level)"
                  >
                    {{ getErrorLevelLabel(scope.row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <!-- 错误信息列 -->
              <el-table-column
                prop="message"
                label="错误信息"
                min-width="300"
              >
                <template #default="scope">
                  <div class="error-message" :title="scope.row.message">
                    {{ scope.row.message }}
                  </div>
                </template>
              </el-table-column>
              
              <!-- 发生位置列 -->
              <el-table-column
                prop="location"
                label="发生位置"
                width="180"
              >
                <template #default="scope">
                  <div class="error-location" :title="scope.row.location">
                    {{ scope.row.location }}
                  </div>
                </template>
              </el-table-column>
              
              <!-- 发生时间列 -->
              <el-table-column
                prop="createdAt"
                label="发生时间"
                width="180"
                align="center"
              >
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
              
              <!-- 详情列 -->
              <el-table-column
                label="详情"
                width="80"
                align="center"
                fixed="right"
              >
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    @click="handleErrorLogDetail(scope.row)"
                    icon="View"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="errorPagination.currentPage"
                v-model:page-size="errorPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="errorPagination.total"
                @size-change="handleErrorSizeChange"
                @current-change="handleErrorCurrentChange"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- 日志统计 -->
      <el-tab-pane label="日志统计" name="statistics">
        <div class="log-section">
          <el-card class="stats-card">
            <div class="stats-summary">
              <h3 class="stats-title">日志统计概览</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon operation-icon"><el-icon><Operation /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.operationTotal }}</div>
                    <div class="stat-label">今日操作日志</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon login-icon"><el-icon><User /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.loginTotal }}</div>
                    <div class="stat-label">今日登录日志</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon error-icon"><el-icon><Warning /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.errorTotal }}</div>
                    <div class="stat-label">今日错误日志</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon total-icon"><el-icon><FileText /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.total }}</div>
                    <div class="stat-label">日志总条数</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="stats-charts">
              <h3 class="stats-title">操作日志趋势</h3>
              <div id="operationChart" class="chart-container"></div>
            </div>
            
            <div class="stats-distribution">
              <h3 class="stats-title">操作类型分布</h3>
              <div id="operationTypeChart" class="chart-container"></div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="logDetailVisible"
      :title="logDetailTitle"
      width="600px"
      :before-close="handleLogDetailClose"
    >
      <div class="log-detail-content">
        <pre>{{ logDetailContent }}</pre>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleLogDetailClose">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';

import api from '../utils/api';
import auth from '../utils/auth';

// 引入 ECharts 图表库
import * as echarts from 'echarts';

// 当前激活的标签页
const activeTab = ref('operation');

// 操作日志数据
const operationLoading = ref(false);
const operationSearchQuery = ref('');
const operationLogType = ref('');
const operationDateRange = ref('');
const operationLogs = ref([]);
const operationExporting = ref(false);
const operationPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 登录日志数据
const loginLoading = ref(false);
const loginSearchQuery = ref('');
const loginStatus = ref('');
const loginDateRange = ref('');
const loginLogs = ref([]);
const loginExporting = ref(false);
const loginPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 错误日志数据
const errorLoading = ref(false);
const errorSearchQuery = ref('');
const errorLevel = ref('');
const errorDateRange = ref('');
const errorLogs = ref([]);
const errorExporting = ref(false);
const errorPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 日志统计数据
const statistics = reactive({
  operationTotal: 0,
  loginTotal: 0,
  errorTotal: 0,
  total: 0
});

// 日志详情对话框
const logDetailVisible = ref(false);
const logDetailTitle = ref('日志详情');
const logDetailContent = ref('');

// ECharts 实例
let operationChartInstance = null;
let operationTypeChartInstance = null;

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

// 获取日志类型标签样式
const getLogTypeTag = (type) => {
  const tagTypes = {
    'login': 'primary',
    'logout': 'info',
    'create': 'success',
    'update': 'warning',
    'delete': 'danger',
    'query': 'info',
    'export': 'info',
    'other': 'default'
  };
  return tagTypes[type] || 'default';
};

// 获取日志类型标签文本
const getLogTypeLabel = (type) => {
  const typeLabels = {
    'login': '登录',
    'logout': '登出',
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'query': '查询',
    'export': '导出',
    'other': '其他'
  };
  return typeLabels[type] || type;
};

// 获取错误级别标签样式
const getErrorLevelTag = (level) => {
  const tagTypes = {
    'fatal': 'danger',
    'error': 'warning',
    'warning': 'primary',
    'info': 'info'
  };
  return tagTypes[level] || 'default';
};

// 获取错误级别标签文本
const getErrorLevelLabel = (level) => {
  const levelLabels = {
    'fatal': '致命',
    'error': '错误',
    'warning': '警告',
    'info': '信息'
  };
  return levelLabels[level] || level;
};

// 处理标签切换
const handleTabChange = (tabIndex) => {
  activeTab.value = tabIndex;
  
  // 如果切换到统计标签页，初始化图表
  if (tabIndex === 'statistics') {
    nextTick(() => {
      initCharts();
    });
  }
};

// 获取操作日志
const fetchOperationLogs = async () => {
  try {
    operationLoading.value = true;
    
    const params = {
      page: operationPagination.currentPage,
      pageSize: operationPagination.pageSize,
      keyword: operationSearchQuery.value,
      operationType: operationLogType.value,
      startTime: operationDateRange.value ? operationDateRange.value[0] : '',
      endTime: operationDateRange.value ? operationDateRange.value[1] : ''
    };
    
    const res = await api.log.getOperationLogs(params);
    if (res.code === 200) {
      operationLogs.value = res.data.list || [];
      operationPagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取操作日志失败');
    }
  } catch (error) {
    console.error('获取操作日志失败:', error);
    ElMessage.error('获取操作日志失败');
  } finally {
    operationLoading.value = false;
  }
};

// 获取登录日志
const fetchLoginLogs = async () => {
  try {
    loginLoading.value = true;
    
    const params = {
      page: loginPagination.currentPage,
      pageSize: loginPagination.pageSize,
      keyword: loginSearchQuery.value,
      status: loginStatus.value,
      startTime: loginDateRange.value ? loginDateRange.value[0] : '',
      endTime: loginDateRange.value ? loginDateRange.value[1] : ''
    };
    
    const res = await api.log.getLoginLogs(params);
    if (res.code === 200) {
      loginLogs.value = res.data.list || [];
      loginPagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取登录日志失败');
    }
  } catch (error) {
    console.error('获取登录日志失败:', error);
    ElMessage.error('获取登录日志失败');
  } finally {
    loginLoading.value = false;
  }
};

// 获取错误日志
const fetchErrorLogs = async () => {
  try {
    errorLoading.value = true;
    
    const params = {
      page: errorPagination.currentPage,
      pageSize: errorPagination.pageSize,
      keyword: errorSearchQuery.value,
      level: errorLevel.value,
      startTime: errorDateRange.value ? errorDateRange.value[0] : '',
      endTime: errorDateRange.value ? errorDateRange.value[1] : ''
    };
    
    const res = await api.log.getErrorLogs(params);
    if (res.code === 200) {
      errorLogs.value = res.data.list || [];
      errorPagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取错误日志失败');
    }
  } catch (error) {
    console.error('获取错误日志失败:', error);
    ElMessage.error('获取错误日志失败');
  } finally {
    errorLoading.value = false;
  }
};

// 获取日志统计
const fetchLogStatistics = async () => {
  try {
    const res = await api.log.getLogStatistics();
    if (res.code === 200 && res.data) {
      Object.assign(statistics, res.data);
    }
  } catch (error) {
    console.error('获取日志统计失败:', error);
  }
};

// 处理操作日志搜索
const handleOperationSearch = () => {
  operationPagination.currentPage = 1;
  fetchOperationLogs();
};

// 处理登录日志搜索
const handleLoginSearch = () => {
  loginPagination.currentPage = 1;
  fetchLoginLogs();
};

// 处理错误日志搜索
const handleErrorSearch = () => {
  errorPagination.currentPage = 1;
  fetchErrorLogs();
};

// 处理刷新
const handleRefresh = (type) => {
  switch (type) {
    case 'operation':
      operationSearchQuery.value = '';
      operationLogType.value = '';
      operationDateRange.value = '';
      operationPagination.currentPage = 1;
      fetchOperationLogs();
      break;
    case 'login':
      loginSearchQuery.value = '';
      loginStatus.value = '';
      loginDateRange.value = '';
      loginPagination.currentPage = 1;
      fetchLoginLogs();
      break;
    case 'error':
      errorSearchQuery.value = '';
      errorLevel.value = '';
      errorDateRange.value = '';
      errorPagination.currentPage = 1;
      fetchErrorLogs();
      break;
    case 'statistics':
      fetchLogStatistics();
      updateCharts();
      break;
  }
};

// 处理操作日志分页大小变化
const handleOperationSizeChange = (size) => {
  operationPagination.pageSize = size;
  fetchOperationLogs();
};

// 处理操作日志当前页码变化
const handleOperationCurrentChange = (current) => {
  operationPagination.currentPage = current;
  fetchOperationLogs();
};

// 处理登录日志分页大小变化
const handleLoginSizeChange = (size) => {
  loginPagination.pageSize = size;
  fetchLoginLogs();
};

// 处理登录日志当前页码变化
const handleLoginCurrentChange = (current) => {
  loginPagination.currentPage = current;
  fetchLoginLogs();
};

// 处理错误日志分页大小变化
const handleErrorSizeChange = (size) => {
  errorPagination.pageSize = size;
  fetchErrorLogs();
};

// 处理错误日志当前页码变化
const handleErrorCurrentChange = (current) => {
  errorPagination.currentPage = current;
  fetchErrorLogs();
};

// 导出操作日志
const handleExportOperationLogs = async () => {
  try {
    operationExporting.value = true;
    
    const params = {
      keyword: operationSearchQuery.value,
      operationType: operationLogType.value,
      startTime: operationDateRange.value ? operationDateRange.value[0] : '',
      endTime: operationDateRange.value ? operationDateRange.value[1] : ''
    };
    
    const res = await api.log.exportOperationLogs(params);
    
    if (res.code === 200 && res.data && res.data.downloadUrl) {
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('操作日志导出成功');
    } else {
      ElMessage.error(res.message || '操作日志导出失败');
    }
  } catch (error) {
    console.error('导出操作日志失败:', error);
    ElMessage.error('操作日志导出失败');
  } finally {
    operationExporting.value = false;
  }
};

// 导出登录日志
const handleExportLoginLogs = async () => {
  try {
    loginExporting.value = true;
    
    const params = {
      keyword: loginSearchQuery.value,
      status: loginStatus.value,
      startTime: loginDateRange.value ? loginDateRange.value[0] : '',
      endTime: loginDateRange.value ? loginDateRange.value[1] : ''
    };
    
    const res = await api.log.exportLoginLogs(params);
    
    if (res.code === 200 && res.data && res.data.downloadUrl) {
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('登录日志导出成功');
    } else {
      ElMessage.error(res.message || '登录日志导出失败');
    }
  } catch (error) {
    console.error('导出登录日志失败:', error);
    ElMessage.error('登录日志导出失败');
  } finally {
    loginExporting.value = false;
  }
};

// 导出错误日志
const handleExportErrorLogs = async () => {
  try {
    errorExporting.value = true;
    
    const params = {
      keyword: errorSearchQuery.value,
      level: errorLevel.value,
      startTime: errorDateRange.value ? errorDateRange.value[0] : '',
      endTime: errorDateRange.value ? errorDateRange.value[1] : ''
    };
    
    const res = await api.log.exportErrorLogs(params);
    
    if (res.code === 200 && res.data && res.data.downloadUrl) {
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('错误日志导出成功');
    } else {
      ElMessage.error(res.message || '错误日志导出失败');
    }
  } catch (error) {
    console.error('导出错误日志失败:', error);
    ElMessage.error('错误日志导出失败');
  } finally {
    errorExporting.value = false;
  }
};

// 清空操作日志
const handleClearOperationLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有操作日志吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    const res = await api.log.clearOperationLogs();
    
    if (res.code === 200) {
      ElMessage.success('操作日志已清空');
      fetchOperationLogs();
    } else {
      ElMessage.error(res.message || '清空操作日志失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('清空操作日志失败:', error);
    ElMessage.error('清空操作日志失败');
  }
};

// 清空登录日志
const handleClearLoginLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有登录日志吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    const res = await api.log.clearLoginLogs();
    
    if (res.code === 200) {
      ElMessage.success('登录日志已清空');
      fetchLoginLogs();
    } else {
      ElMessage.error(res.message || '清空登录日志失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('清空登录日志失败:', error);
    ElMessage.error('清空登录日志失败');
  }
};

// 清空错误日志
const handleClearErrorLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有错误日志吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    const res = await api.log.clearErrorLogs();
    
    if (res.code === 200) {
      ElMessage.success('错误日志已清空');
      fetchErrorLogs();
    } else {
      ElMessage.error(res.message || '清空错误日志失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('清空错误日志失败:', error);
    ElMessage.error('清空错误日志失败');
  }
};

// 查看操作日志详情
const handleOperationLogDetail = (log) => {
  logDetailTitle.value = '操作日志详情';
  // 格式化日志详情内容
  const detailContent = `操作人: ${log.operator || '-'}
IP地址: ${log.ipAddress || '-'}
操作类型: ${getLogTypeLabel(log.operationType)}
操作模块: ${log.operationModule || '-'}
操作内容: ${log.operationContent || '-'}
操作时间: ${formatDate(log.createdAt)}
请求参数: ${JSON.stringify(log.params || {}, null, 2)}`;
  logDetailContent.value = detailContent;
  logDetailVisible.value = true;
};

// 查看登录日志详情
const handleLoginLogDetail = (log) => {
  logDetailTitle.value = '登录日志详情';
  // 格式化日志详情内容
  const detailContent = `用户名: ${log.username || '-'}
IP地址: ${log.ipAddress || '-'}
登录状态: ${log.status === 'success' ? '成功' : '失败'}
登录设备: ${log.device || '-'}
浏览器: ${log.browser || '-'}
操作系统: ${log.os || '-'}
登录时间: ${formatDate(log.createdAt)}
登录结果: ${log.message || '-'}`;
  logDetailContent.value = detailContent;
  logDetailVisible.value = true;
};

// 查看错误日志详情
const handleErrorLogDetail = (log) => {
  logDetailTitle.value = '错误日志详情';
  // 格式化日志详情内容
  const detailContent = `错误类型: ${log.errorType || '-'}
错误级别: ${getErrorLevelLabel(log.level)}
错误信息: ${log.message || '-'}
发生位置: ${log.location || '-'}
请求URL: ${log.url || '-'}
请求方法: ${log.method || '-'}
客户端IP: ${log.ipAddress || '-'}
错误时间: ${formatDate(log.createdAt)}
错误堆栈: ${log.stack || '-'}`;
  logDetailContent.value = detailContent;
  logDetailVisible.value = true;
};

// 关闭日志详情对话框
const handleLogDetailClose = () => {
  logDetailVisible.value = false;
};

// 初始化图表
const initCharts = async () => {
  // 初始化操作日志趋势图表
  const operationChartDom = document.getElementById('operationChart');
  if (operationChartDom) {
    if (operationChartInstance) {
      operationChartInstance.dispose();
    }
    operationChartInstance = echarts.init(operationChartDom);
  }
  
  // 初始化操作类型分布图表
  const operationTypeChartDom = document.getElementById('operationTypeChart');
  if (operationTypeChartDom) {
    if (operationTypeChartInstance) {
      operationTypeChartInstance.dispose();
    }
    operationTypeChartInstance = echarts.init(operationTypeChartDom);
  }
  
  // 更新图表数据
  updateCharts();
};

// 更新图表数据
const updateCharts = async () => {
  try {
    // 获取图表数据
    const res = await api.log.getLogChartData();
    
    if (res.code === 200 && res.data) {
      const chartData = res.data;
      
      // 更新操作日志趋势图表
      if (operationChartInstance) {
        const operationChartOption = {
          title: {
            text: '',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          legend: {
            data: ['操作日志', '登录日志', '错误日志'],
            bottom: 0
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: chartData.dateRange || []
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '操作日志',
              type: 'line',
              stack: '总量',
              areaStyle: {},
              emphasis: {
                focus: 'series'
              },
              data: chartData.operationTrend || []
            },
            {
              name: '登录日志',
              type: 'line',
              stack: '总量',
              areaStyle: {},
              emphasis: {
                focus: 'series'
              },
              data: chartData.loginTrend || []
            },
            {
              name: '错误日志',
              type: 'line',
              stack: '总量',
              areaStyle: {},
              emphasis: {
                focus: 'series'
              },
              data: chartData.errorTrend || []
            }
          ]
        };
        
        operationChartInstance.setOption(operationChartOption);
      }
      
      // 更新操作类型分布图表
      if (operationTypeChartInstance) {
        const operationTypeChartOption = {
          title: {
            text: '',
            left: 'center'
          },
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
          },
          series: [
            {
              name: '操作类型',
              type: 'pie',
              radius: '50%',
              data: chartData.operationTypeData || [],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };
        
        operationTypeChartInstance.setOption(operationTypeChartOption);
      }
    }
  } catch (error) {
    console.error('更新图表数据失败:', error);
  }
};

// 响应式处理图表大小
const handleResize = () => {
  if (operationChartInstance) {
    operationChartInstance.resize();
  }
  if (operationTypeChartInstance) {
    operationTypeChartInstance.resize();
  }
};

// 页面加载时初始化数据
onMounted(() => {
  fetchOperationLogs();
  fetchLoginLogs();
  fetchErrorLogs();
  fetchLogStatistics();
  
  // 添加窗口大小变化事件监听
  window.addEventListener('resize', handleResize);
  
  // 如果默认是统计页面，初始化图表
  if (activeTab.value === 'statistics') {
    nextTick(() => {
      initCharts();
    });
  }
});

// 组件卸载时清理资源
onUnmounted(() => {
  // 移除窗口大小变化事件监听
  window.removeEventListener('resize', handleResize);
  
  // 销毁图表实例
  if (operationChartInstance) {
    operationChartInstance.dispose();
    operationChartInstance = null;
  }
  if (operationTypeChartInstance) {
    operationTypeChartInstance.dispose();
    operationTypeChartInstance = null;
  }
});
</script>

<style scoped>
/* 日志管理页面容器 */
.logs-container {
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

/* 日志标签页 */
.logs-tabs {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 日志区块 */
.log-section {
  padding: 20px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.select-input {
  width: 150px;
}

.date-picker {
  width: 280px;
}

.toolbar-buttons {
  margin-left: auto;
}

/* 表格卡片 */
.table-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 错误信息和位置样式 */
.error-message,
.error-location {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 日志详情内容 */
.log-detail-content {
  max-height: 400px;
  overflow-y: auto;
}

.log-detail-content pre {
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 统计卡片 */
.stats-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

/* 统计概览 */
.stats-summary {
  margin-bottom: 30px;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 24px;
}

.operation-icon {
  background-color: #e0f2fe;
  color: #0ea5e9;
}

.login-icon {
  background-color: #dcfce7;
  color: #22c55e;
}

.error-icon {
  background-color: #fee2e2;
  color: #ef4444;
}

.total-icon {
  background-color: #e0e7ff;
  color: #6366f1;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 图表区域 */
.stats-charts,
.stats-distribution {
  margin-bottom: 30px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .select-input,
  .date-picker {
    width: 100%;
  }
  
  .toolbar-buttons {
    margin-left: 0;
    justify-content: center;
  }
  
  .chart-container {
    height: 300px;
  }
}

@media screen and (max-width: 768px) {
  .log-section {
    padding: 16px;
  }
  
  .stats-card {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  /* 隐藏固定列，避免移动端显示问题 */
  :deep(.el-table__fixed-right) {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .stats-title {
    font-size: 14px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 10px !important;
  }
}

/* 自定义滚动条 */
.log-detail-content {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.log-detail-content::-webkit-scrollbar {
  width: 6px;
}

.log-detail-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.log-detail-content::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}

/* 表格行悬停效果 */
:deep(.el-table__row:hover > td) {
  background-color: #f9fafb !important;
}

/* 标签样式调整 */
:deep(.el-tag) {
  font-size: 12px;
  height: 24px;
  line-height: 24px;
}

/* 按钮样式调整 */
:deep(.el-button-group > .el-button) {
  border-radius: 4px;
  margin: 0 4px;
}

:deep(.el-button-group > .el-button:first-child) {
  margin-left: 0;
}

:deep(.el-button-group > .el-button:last-child) {
  margin-right: 0;
}
</style>