<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>仪表盘</h1>
      <p class="page-description">欢迎回来，这里是您的系统概览</p>
    </div>
    
    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-number">{{ totalNotes }}</p>
            <p class="stat-label">总笔记数</p>
          </div>
          <div class="stat-icon">
            <el-icon class="icon-large"><Document /></el-icon>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-number">{{ totalCategories }}</p>
            <p class="stat-label">分类数</p>
          </div>
          <div class="stat-icon">
            <el-icon class="icon-large"><Collection /></el-icon>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-number">{{ totalAdmins }}</p>
            <p class="stat-label">管理员数</p>
          </div>
          <div class="stat-icon">
            <el-icon class="icon-large"><UserFilled /></el-icon>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-number">{{ totalFeedback }}</p>
            <p class="stat-label">用户反馈</p>
          </div>
          <div class="stat-icon">
            <el-icon class="icon-large"><Message /></el-icon>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-container">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>笔记发布趋势</span>
            <el-select v-model="dateRange" class="date-range-select" size="small">
              <el-option label="最近7天" value="7days"></el-option>
              <el-option label="最近30天" value="30days"></el-option>
              <el-option label="最近90天" value="90days"></el-option>
            </el-select>
          </div>
        </template>
        <div class="chart-wrapper">
          <div id="noteTrendChart" class="chart"></div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>笔记分类分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <div id="categoryDistributionChart" class="chart"></div>
        </div>
      </el-card>
    </div>
    
    <!-- 最近活动和热门笔记 -->
    <div class="recent-activities-container">
      <el-card class="activity-card">
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
          </div>
        </template>
        <div class="activities-list">
          <el-timeline :reverse="false">
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="formatActivityTime(activity.time)"
            >
              <el-card>
                <div class="activity-content">
                  <el-icon class="activity-icon" :style="{ color: getActivityColor(activity.type) }"><component :is="getActivityIcon(activity.type)" /></el-icon>
                  <div class="activity-text">
                    <p class="activity-title">{{ activity.title }}</p>
                    <p class="activity-detail">{{ activity.detail }}</p>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
      
      <el-card class="hot-notes-card">
        <template #header>
          <div class="card-header">
            <span>热门笔记</span>
          </div>
        </template>
        <div class="hot-notes-list">
          <el-list border :data="hotNotes">
            <el-list-item v-for="(note, index) in hotNotes" :key="index">
              <div class="hot-note-item">
                <div class="hot-note-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
                <div class="hot-note-info">
                  <p class="hot-note-title">{{ note.title }}</p>
                  <p class="hot-note-stats">
                    <span class="stat-item"><el-icon><Star /></el-icon> {{ note.views }} 浏览</span>
                    <span class="stat-item"><el-icon><Message /></el-icon> {{ note.comments }} 评论</span>
                    <span class="stat-item"><el-icon><Collection /></el-icon> {{ note.category }}</span>
                  </p>
                </div>
                <el-button type="text" size="small" @click="viewNote(note.id)">查看</el-button>
              </div>
            </el-list-item>
          </el-list>
        </div>
      </el-card>
    </div>
    
    <!-- 系统状态 -->
    <el-card class="system-status-card">
      <template #header>
        <div class="card-header">
          <span>系统状态</span>
        </div>
      </template>
      <div class="system-status-grid">
        <div class="status-item">
          <p class="status-label">服务器时间</p>
          <p class="status-value">{{ serverTime }}</p>
        </div>
        <div class="status-item">
          <p class="status-label">系统版本</p>
          <p class="status-value">v1.0.0</p>
        </div>
        <div class="status-item">
          <p class="status-label">运行时间</p>
          <p class="status-value">{{ uptime }}</p>
        </div>
        <div class="status-item">
          <p class="status-label">数据库状态</p>
          <p class="status-value"><span class="status-ok">正常</span></p>
        </div>
        <div class="status-item">
          <p class="status-label">API接口</p>
          <p class="status-value"><span class="status-ok">正常</span></p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Document, Edit, Delete, Search, UserFilled, Setting, InfoFilled, Message } from '@element-plus/icons-vue';

import * as echarts from 'echarts';
import api from '../utils/api';

// 路由实例
const router = useRouter();

// 统计数据
const totalNotes = ref(0);
const totalCategories = ref(0);
const totalAdmins = ref(0);
const totalFeedback = ref(0);

// 日期范围选择
const dateRange = ref('7days');

// 服务器时间和运行时间
const serverTime = ref('');
const uptime = ref('');

// 最近活动
const recentActivities = ref([]);

// 热门笔记
const hotNotes = ref([]);

// ECharts实例
let noteTrendChart = null;
let categoryDistributionChart = null;

// 格式化活动时间
const formatActivityTime = (timeStr) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

// 获取活动图标
const getActivityIcon = (type) => {
  switch (type) {
    case 'note_created': return Document;
    case 'note_updated': return Edit;
    case 'note_deleted': return Delete;
    case 'search': return Search;
    case 'login': return UserFilled;
    case 'system': return Setting;
    default: return InfoFilled;
  }
};

// 获取活动颜色
const getActivityColor = (type) => {
  switch (type) {
    case 'note_created': return '#4f46e5';
    case 'note_updated': return '#10b981';
    case 'note_deleted': return '#ef4444';
    case 'search': return '#f59e0b';
    case 'login': return '#3b82f6';
    case 'system': return '#8b5cf6';
    default: return '#6b7280';
  }
};

// 获取排名样式
const getRankClass = (index) => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-normal';
};

// 查看笔记详情
const viewNote = (noteId) => {
  router.push(`/notes/${noteId}`);
};

// 初始化笔记发布趋势图表
const initNoteTrendChart = () => {
  const chartDom = document.getElementById('noteTrendChart');
  if (!chartDom) return;
  
  noteTrendChart = echarts.init(chartDom);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      axisLabel: {
        interval: 0,
        rotate: 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '发布笔记数',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4f46e5' },
            { offset: 1, color: '#818cf8' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  };
  
  noteTrendChart.setOption(option);
  
  // 窗口大小变化时重新调整图表大小
  window.addEventListener('resize', () => {
    noteTrendChart && noteTrendChart.resize();
  });
};

// 初始化分类分布图表
const initCategoryDistributionChart = () => {
  const chartDom = document.getElementById('categoryDistributionChart');
  if (!chartDom) return;
  
  categoryDistributionChart = echarts.init(chartDom);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      left: 'center'
    },
    series: [
      {
        name: '分类分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 38, name: '技术文档' },
          { value: 25, name: '学习笔记' },
          { value: 20, name: '教程指南' },
          { value: 15, name: '心得体会' },
          { value: 12, name: '其他类型' }
        ]
      }
    ]
  };
  
  categoryDistributionChart.setOption(option);
  
  // 窗口大小变化时重新调整图表大小
  window.addEventListener('resize', () => {
    categoryDistributionChart && categoryDistributionChart.resize();
  });
};

// 获取统计数据
const fetchStatistics = async () => {
  try {
    // 模拟API调用，实际项目中应替换为真实的API调用
    // const res = await api.dashboard.getStatistics();
    // if (res.code === 200) {
    //   totalNotes.value = res.data.totalNotes;
    //   totalCategories.value = res.data.totalCategories;
    //   totalAdmins.value = res.data.totalAdmins;
    //   totalFeedback.value = res.data.totalFeedback;
    // }
    
    // 这里使用模拟数据
    totalNotes.value = 128;
    totalCategories.value = 15;
    totalAdmins.value = 5;
    totalFeedback.value = 24;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    ElMessage.error('获取统计数据失败');
  }
};

// 获取最近活动
const fetchRecentActivities = async () => {
  try {
    // 模拟API调用
    // const res = await api.logs.getRecentActivities();
    // if (res.code === 200) {
    //   recentActivities.value = res.data;
    // }
    
    // 这里使用模拟数据
    recentActivities.value = [
      {
        id: 1,
        type: 'note_created',
        title: '创建了新笔记',
        detail: '张三创建了新笔记《Vue 3 组合式API详解》',
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 2,
        type: 'note_updated',
        title: '更新了笔记',
        detail: '李四更新了笔记《React Hooks实战》',
        time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 3,
        type: 'login',
        title: '用户登录',
        detail: '管理员admin登录了系统',
        time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        id: 4,
        type: 'system',
        title: '系统更新',
        detail: '系统进行了自动更新，版本更新至v1.0.0',
        time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 5,
        type: 'note_deleted',
        title: '删除了笔记',
        detail: '管理员admin删除了笔记《旧文档》',
        time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      }
    ];
  } catch (error) {
    console.error('获取最近活动失败:', error);
  }
};

// 获取热门笔记
const fetchHotNotes = async () => {
  try {
    // 模拟API调用
    // const res = await api.note.getHotNotes();
    // if (res.code === 200) {
    //   hotNotes.value = res.data;
    // }
    
    // 这里使用模拟数据
    hotNotes.value = [
      {
        id: 1,
        title: 'Vue 3 组合式API入门教程',
        views: 1254,
        comments: 68,
        category: '前端开发'
      },
      {
        id: 2,
        title: 'Node.js 性能优化实践',
        views: 986,
        comments: 42,
        category: '后端开发'
      },
      {
        id: 3,
        title: 'Git 进阶技巧大全',
        views: 865,
        comments: 37,
        category: '工具使用'
      },
      {
        id: 4,
        title: 'React 服务端渲染指南',
        views: 742,
        comments: 31,
        category: '前端开发'
      },
      {
        id: 5,
        title: 'MongoDB 索引优化策略',
        views: 689,
        comments: 26,
        category: '数据库'
      }
    ];
  } catch (error) {
    console.error('获取热门笔记失败:', error);
  }
};

// 更新服务器时间和运行时间
const updateSystemInfo = () => {
  serverTime.value = new Date().toLocaleString('zh-CN');
  
  // 模拟运行时间
  const startDate = new Date('2024-01-01');
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  uptime.value = `${diffDays}天 ${diffHours}小时 ${diffMinutes}分钟`;
};

// 日期范围变化时重新加载数据
const handleDateRangeChange = () => {
  // 实际项目中应根据日期范围重新加载图表数据
  ElMessage.success(`已切换到${dateRange.value === '7days' ? '最近7天' : dateRange.value === '30days' ? '最近30天' : '最近90天'}数据`);
};

// 监听日期范围变化
const dateRangeWatcher = (newValue) => {
  handleDateRangeChange();
};

// 使用正确的watch函数监听数据变化
watch(dateRange, dateRangeWatcher);

// 页面加载时初始化数据和图表
onMounted(() => {
  // 获取统计数据
  fetchStatistics();
  
  // 获取最近活动
  fetchRecentActivities();
  
  // 获取热门笔记
  fetchHotNotes();
  
  // 更新系统信息
  updateSystemInfo();
  
  // 每10秒更新一次服务器时间
  setInterval(updateSystemInfo, 10000);
  
  // 初始化图表
  setTimeout(() => {
    initNoteTrendChart();
    initCategoryDistributionChart();
  }, 100);
});

// 组件卸载时销毁图表
onUnmounted(() => {
  if (noteTrendChart) {
    noteTrendChart.dispose();
    noteTrendChart = null;
  }
  if (categoryDistributionChart) {
    categoryDistributionChart.dispose();
    categoryDistributionChart = null;
  }
});
</script>

<style scoped>
/* 仪表盘容器 */
.dashboard-container {
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

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
}

.icon-large {
  font-size: 24px;
}

/* 图表容器 */
.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.date-range-select {
  width: 120px;
}

.chart-wrapper {
  padding: 20px;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 最近活动和热门笔记 */
.recent-activities-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.activity-card,
.hot-notes-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.activities-list {
  padding: 0 20px 20px 20px;
}

.activity-content {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
}

.activity-icon {
  margin-right: 12px;
  font-size: 18px;
}

.activity-text {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.activity-detail {
  font-size: 13px;
  color: #6b7280;
}

.hot-notes-list {
  padding: 0 20px 20px 20px;
}

.hot-note-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.hot-note-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  margin-right: 16px;
}

.rank-gold {
  background-color: #f59e0b;
  color: #ffffff;
}

.rank-silver {
  background-color: #9ca3af;
  color: #ffffff;
}

.rank-bronze {
  background-color: #b45309;
  color: #ffffff;
}

.rank-normal {
  background-color: #f3f4f6;
  color: #6b7280;
}

.hot-note-info {
  flex: 1;
}

.hot-note-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-note-stats {
  font-size: 12px;
  color: #9ca3af;
}

.stat-item {
  margin-right: 12px;
}

/* 系统状态 */
.system-status-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.system-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.status-item {
  text-align: center;
}

.status-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.status-value {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.status-ok {
  color: #10b981;
}

.status-warning {
  color: #f59e0b;
}

.status-error {
  color: #ef4444;
}

/* 适配不同屏幕尺寸 */
@media screen and (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .recent-activities-container {
    grid-template-columns: 1fr;
  }
  
  .system-status-grid {
    grid-template-columns: 1fr;
  }
  
  .chart {
    height: 250px;
  }
}
</style>