<template>
  <div class="dashboard-page">
    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon note-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ noteCount }}</div>
            <div class="stat-label">总笔记数</div>
          </div>
          <div class="stat-change" :class="{ positive: noteChange > 0, negative: noteChange < 0 }">
            <span v-if="noteChange !== 0">{{ noteChange > 0 ? '+' : '' }}{{ noteChange }}%</span>
            <span v-else>--</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon category-icon">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ categoryCount }}</div>
            <div class="stat-label">分类数</div>
          </div>
          <div class="stat-change" :class="{ positive: categoryChange > 0, negative: categoryChange < 0 }">
            <span v-if="categoryChange !== 0">{{ categoryChange > 0 ? '+' : '' }}{{ categoryChange }}%</span>
            <span v-else>--</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon user-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ userCount }}</div>
            <div class="stat-label">用户数</div>
          </div>
          <div class="stat-change" :class="{ positive: userChange > 0, negative: userChange < 0 }">
            <span v-if="userChange !== 0">{{ userChange > 0 ? '+' : '' }}{{ userChange }}%</span>
            <span v-else>--</span>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon feedback-icon">
            <el-icon><MessageRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ feedbackCount }}</div>
            <div class="stat-label">反馈数</div>
          </div>
          <div class="stat-change" :class="{ positive: feedbackChange > 0, negative: feedbackChange < 0 }">
            <span v-if="feedbackChange !== 0">{{ feedbackChange > 0 ? '+' : '' }}{{ feedbackChange }}%</span>
            <span v-else>--</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <el-card class="chart-card">
        <template #header>
          <h3 class="section-title">笔记数据统计</h3>
        </template>
        <div class="chart-container">
          <canvas id="noteChart" height="300"></canvas>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <h3 class="section-title">分类笔记分布</h3>
        </template>
        <div class="chart-container">
          <canvas id="categoryChart" height="300"></canvas>
        </div>
      </el-card>
    </div>
    
    <!-- 最近活动和待办事项 -->
    <div class="activity-section">
      <el-card class="activity-card">
        <template #header>
          <h3 class="section-title">最近活动</h3>
        </template>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="getActivityIcon(activity.type)">
              <el-icon><component :is="getActivityIconComponent(activity.type)" /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.description }}</div>
              <div class="activity-time">{{ formatRelativeTime(activity.created_at) }}</div>
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="todo-card">
        <template #header>
          <h3 class="section-title">待办事项</h3>
          <el-button type="text" @click="addTodo">添加</el-button>
        </template>
        <div class="todo-list">
          <el-checkbox-group v-model="checkedTodos">
            <el-checkbox 
              v-for="todo in todos" 
              :key="todo.id" 
              :label="todo.id"
              @change="updateTodoStatus(todo.id, $event)"
            >
              <div class="todo-item" :class="{ completed: todo.completed }">
                <div class="todo-title">{{ todo.title }}</div>
                <div class="todo-time" v-if="todo.deadline">
                  截止时间：{{ formatDate(todo.deadline) }}
                </div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-card>
    </div>
    
    <!-- 系统信息 -->
    <el-card class="system-info-card">
      <template #header>
        <h3 class="section-title">系统信息</h3>
      </template>
      <div class="system-info-grid">
        <div class="info-item">
          <span class="info-label">系统版本：</span>
          <span class="info-value">{{ systemInfo.version }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">运行时间：</span>
          <span class="info-value">{{ systemInfo.uptime }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">服务器IP：</span>
          <span class="info-value">{{ systemInfo.serverIp }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前用户：</span>
          <span class="info-value">{{ systemInfo.currentUser }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">登录时间：</span>
          <span class="info-value">{{ formatDate(systemInfo.loginTime) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">浏览器：</span>
          <span class="info-value">{{ systemInfo.browser }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import Chart from 'chart.js/auto'
import { Document, Collection, User, Message, Edit, Check, Delete } from '@element-plus/icons-vue'

// 使用插件
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 使用自动导入的图标，无需手动导入

// 状态管理
const authStore = useAuthStore()

// 统计数据
const noteCount = ref(125)
const categoryCount = ref(25)
const userCount = ref(892)
const feedbackCount = ref(32)

// 增长率
const noteChange = ref(12)
const categoryChange = ref(5)
const userChange = ref(8)
const feedbackChange = ref(-3)

// 图表实例
let noteChart = null
let categoryChart = null

// 最近活动
const recentActivities = ref([
  { id: 1, type: 'create', description: '管理员创建了新笔记《Vue3 进阶指南》', created_at: '2023-06-15 14:30:00' },
  { id: 2, type: 'update', description: '用户更新了分类《前端框架》', created_at: '2023-06-15 12:45:00' },
  { id: 3, type: 'delete', description: '系统删除了过期笔记', created_at: '2023-06-14 18:20:00' },
  { id: 4, type: 'feedback', description: '收到新的用户反馈', created_at: '2023-06-14 15:10:00' },
  { id: 5, type: 'login', description: '管理员登录系统', created_at: '2023-06-14 09:00:00' }
])

// 待办事项
const todos = ref([
  { id: 1, title: '审核新提交的笔记', completed: false, deadline: '2023-06-16 12:00:00' },
  { id: 2, title: '处理用户反馈', completed: false, deadline: '2023-06-16 18:00:00' },
  { id: 3, title: '更新系统文档', completed: true, deadline: '2023-06-15 10:00:00' },
  { id: 4, title: '备份数据库', completed: false, deadline: '2023-06-17 00:00:00' }
])

const checkedTodos = ref(todos.value.filter(todo => todo.completed).map(todo => todo.id))

// 系统信息
const systemInfo = ref({
  version: '1.0.0',
  uptime: '7天12小时30分钟',
  serverIp: '192.168.1.100',
  currentUser: authStore.userInfo?.username || '管理员',
  loginTime: new Date().toISOString(),
  browser: navigator.userAgent.match(/\(([^)]+)\)/)[1]
})

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  // 笔记统计图表
  const noteCtx = document.getElementById('noteChart')
  if (noteCtx) {
    noteChart = new Chart(noteCtx, {
      type: 'line',
      data: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [
          {
            label: '新增笔记',
            data: [12, 19, 15, 25, 22, 30],
            borderColor: '#42b983',
            backgroundColor: 'rgba(66, 185, 131, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: '浏览量',
            data: [120, 190, 150, 250, 220, 300],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
  
  // 分类分布图表
  const categoryCtx = document.getElementById('categoryChart')
  if (categoryCtx) {
    categoryChart = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['前端开发', '后端开发', '数据库', 'DevOps', '人工智能', '其他'],
        datasets: [
          {
            data: [35, 25, 15, 10, 10, 5],
            backgroundColor: [
              '#42b983',
              '#3b82f6',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#9ca3af'
            ],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          }
        },
        cutout: '70%'
      }
    })
  }
}

// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    feedback: 'info',
    login: 'primary'
  }
  return `activity-icon-${iconMap[type] || 'default'}`
}

// 获取活动图标组件
const getActivityIconComponent = (type) => {
  const iconMap = {
    create: 'Edit',
    update: 'Check',
    delete: 'Delete',
    feedback: 'MessageRound',
    login: 'User'
  }
  return iconMap[type] || 'MessageRound'
}

// 格式化相对时间
const formatRelativeTime = (time) => {
  return dayjs(time).fromNow()
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 更新待办事项状态
const updateTodoStatus = (id, checked) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = checked
    // 这里应该调用API更新待办事项状态
    ElMessage.success(`待办事项${checked ? '已完成' : '未完成'}`)
  }
}

// 添加待办事项
const addTodo = () => {
  ElMessageBox.prompt('请输入待办事项:', '添加待办', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\s\S]{2,50}$/,
    inputErrorMessage: '待办事项长度在 2 到 50 个字符'
  }).then(async ({ value }) => {
    // 打开日期选择框
    try {
      const [date] = await ElMessageBox.confirm(
        `请选择截止日期:\n<input type="datetime-local" id="deadline-input" style="width: 100%; padding: 4px; margin-top: 8px;">`,
        '设置截止日期',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: true
        }
      )
      
      const deadlineInput = document.getElementById('deadline-input')
      const deadline = deadlineInput ? deadlineInput.value : null
      
      const newTodo = {
        id: Date.now(),
        title: value,
        completed: false,
        deadline: deadline ? new Date(deadline).toISOString() : null
      }
      
      todos.value.unshift(newTodo)
      ElMessage.success('待办事项添加成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('操作失败')
      }
    }
  }).catch(() => {
    ElMessage.info('已取消添加')
  })
}

// 页面加载时初始化
onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.dashboard-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.25rem;
}

.note-icon {
  background: linear-gradient(135deg, #42b983, #35495e);
}

.category-icon {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.user-icon {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.feedback-icon {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.stat-change {
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #42b983;
}

.stat-change.negative {
  color: #ef4444;
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-card {
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart-container {
  padding: 1rem 0;
}

/* 活动区域 */
.activity-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.activity-card, .todo-card {
  transition: all 0.3s ease;
}

.activity-card:hover, .todo-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  margin-top: 2px;
}

.activity-icon-success {
  background-color: #42b983;
}

.activity-icon-warning {
  background-color: #f59e0b;
}

.activity-icon-danger {
  background-color: #ef4444;
}

.activity-icon-info {
  background-color: #3b82f6;
}

.activity-icon-primary {
  background-color: #8b5cf6;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #333;
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #666;
  font-size: 0.8rem;
}

.todo-list {
  padding: 0.5rem 0;
}

.todo-item {
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.todo-item:hover {
  background-color: #f8f9fa;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #999;
}

.todo-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.todo-time {
  font-size: 0.8rem;
  color: #666;
}

/* 系统信息 */
.system-info-card {
  transition: all 0.3s ease;
}

.system-info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.system-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-page {
    padding: 1rem;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .activity-section {
    grid-template-columns: 1fr;
  }
  
  .system-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>