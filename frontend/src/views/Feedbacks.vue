<template>
  <div class="feedbacks-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>反馈管理</h1>
      <p class="page-description">查看和处理用户提交的反馈信息</p>
    </div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索反馈内容、用户名或邮箱"
        clearable
        prefix-icon="Search"
        class="search-input"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      
      <el-select
        v-model="statusFilter"
        placeholder="反馈状态"
        clearable
        class="select-input"
        @change="handleSearch"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="solved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      
      <el-select
        v-model="typeFilter"
        placeholder="反馈类型"
        clearable
        class="select-input"
        @change="handleSearch"
      >
        <el-option label="功能建议" value="suggestion" />
        <el-option label="bug报告" value="bug" />
        <el-option label="内容反馈" value="content" />
        <el-option label="账号问题" value="account" />
        <el-option label="其他" value="other" />
      </el-select>
      
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="date-picker"
        @change="handleSearch"
      />
      
      <el-button-group class="toolbar-buttons">
        <el-button
          @click="handleExportFeedbacks"
          :loading="exporting"
          icon="Download"
        >
          导出
        </el-button>
        
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="!selectedFeedbackIds.length"
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
    
    <!-- 反馈列表表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="feedbacks"
        style="width: 100%"
        border
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <!-- 多选框列 -->
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
        
        <!-- 反馈类型列 -->
        <el-table-column
          prop="type"
          label="反馈类型"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="getFeedbackTypeTag(scope.row.type)"
            >
              {{ getFeedbackTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 反馈状态列 -->
        <el-table-column
          prop="status"
          label="反馈状态"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="getFeedbackStatusTag(scope.row.status)"
            >
              {{ getFeedbackStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 反馈用户列 -->
        <el-table-column
          prop="username"
          label="反馈用户"
          width="120"
        />
        
        <!-- 联系邮箱列 -->
        <el-table-column
          prop="email"
          label="联系邮箱"
          width="180"
        />
        
        <!-- 反馈内容列 -->
        <el-table-column
          prop="content"
          label="反馈内容"
          min-width="300"
        >
          <template #default="scope">
            <div class="feedback-content" :title="scope.row.content">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        
        <!-- 提交时间列 -->
        <el-table-column
          prop="createdAt"
          label="提交时间"
          width="180"
          align="center"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
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
              @click="handleViewFeedback(scope.row)"
              icon="View"
            >
              查看
            </el-button>
            
            <el-button
              link
              type="success"
              @click="handleReplyFeedback(scope.row)"
              icon="ChatDotSquare"
              :disabled="scope.row.status === 'closed'"
            >
              回复
            </el-button>
            
            <el-button
              link
              type="danger"
              @click="handleDeleteFeedback(scope.row.id)"
              icon="Delete"
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
    
    <!-- 反馈详情对话框 -->
    <el-dialog
      v-model="feedbackDetailVisible"
      title="反馈详情"
      width="700px"
      :before-close="handleFeedbackDetailClose"
    >
      <div class="feedback-detail">
        <div class="detail-header">
          <div class="detail-info">
            <div class="info-item">
              <span class="label">反馈类型：</span>
              <el-tag :type="getFeedbackTypeTag(feedbackDetail.type)">
                {{ getFeedbackTypeLabel(feedbackDetail.type) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">反馈状态：</span>
              <el-tag :type="getFeedbackStatusTag(feedbackDetail.status)">
                {{ getFeedbackStatusLabel(feedbackDetail.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">提交时间：</span>
              <span>{{ formatDate(feedbackDetail.createdAt) }}</span>
            </div>
          </div>
          
          <div v-if="feedbackDetail.status !== 'closed'" class="detail-actions">
            <el-select
              v-model="feedbackDetail.status"
              placeholder="修改状态"
              class="status-select"
              @change="handleStatusChange"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已解决" value="solved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </div>
        </div>
        
        <div class="detail-content">
          <h3>反馈用户信息</h3>
          <div class="user-info">
            <p><strong>用户名：</strong>{{ feedbackDetail.username || '-' }}</p>
            <p><strong>邮箱：</strong>{{ feedbackDetail.email || '-' }}</p>
            <p><strong>联系电话：</strong>{{ feedbackDetail.phone || '-' }}</p>
            <p><strong>IP地址：</strong>{{ feedbackDetail.ipAddress || '-' }}</p>
            <p><strong>浏览器：</strong>{{ feedbackDetail.browser || '-' }}</p>
          </div>
          
          <h3>反馈内容</h3>
          <div class="feedback-text">
            {{ feedbackDetail.content || '-' }}
          </div>
          
          <div v-if="feedbackDetail.attachments && feedbackDetail.attachments.length">
            <h3>附件</h3>
            <div class="attachments">
              <el-link
                v-for="(attachment, index) in feedbackDetail.attachments"
                :key="index"
                :href="attachment.url"
                target="_blank"
                :underline="false"
                class="attachment-link"
              >
                <el-icon><Document /></el-icon>
                {{ attachment.name }}
              </el-link>
            </div>
          </div>
          
          <h3>回复记录</h3>
          <div class="reply-list" v-if="feedbackDetail.replies && feedbackDetail.replies.length">
            <div
              v-for="reply in feedbackDetail.replies"
              :key="reply.id"
              class="reply-item"
            >
              <div class="reply-header">
                <span class="reply-author">{{ reply.replyBy }}</span>
                <span class="reply-time">{{ formatDate(reply.repliedAt) }}</span>
              </div>
              <div class="reply-content">
                {{ reply.content }}
              </div>
            </div>
          </div>
          <div v-else class="no-replies">暂无回复</div>
          
          <div v-if="feedbackDetail.status !== 'closed'" class="reply-form">
            <el-input
              v-model="replyContent"
              type="textarea"
              placeholder="请输入回复内容"
              rows="4"
              resize="none"
            />
            <div class="reply-form-actions">
              <el-button @click="handleCancelReply">取消</el-button>
              <el-button
                type="primary"
                @click="handleSubmitReply"
                :loading="replying"
                :disabled="!replyContent.trim()"
              >
                提交回复
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import api from '../utils/api';
import auth from '../utils/auth';

// 反馈数据
const loading = ref(false);
const exporting = ref(false);
const replying = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const dateRange = ref('');
const feedbacks = ref([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});
const selectedFeedbackIds = ref([]);

// 反馈详情对话框
const feedbackDetailVisible = ref(false);
const feedbackDetail = ref({});
const replyContent = ref('');

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

// 获取反馈类型标签样式
const getFeedbackTypeTag = (type) => {
  const tagTypes = {
    'suggestion': 'primary',
    'bug': 'danger',
    'content': 'warning',
    'account': 'info',
    'other': 'default'
  };
  return tagTypes[type] || 'default';
};

// 获取反馈类型标签文本
const getFeedbackTypeLabel = (type) => {
  const typeLabels = {
    'suggestion': '功能建议',
    'bug': 'bug报告',
    'content': '内容反馈',
    'account': '账号问题',
    'other': '其他'
  };
  return typeLabels[type] || type;
};

// 获取反馈状态标签样式
const getFeedbackStatusTag = (status) => {
  const tagTypes = {
    'pending': 'info',
    'processing': 'warning',
    'solved': 'success',
    'closed': 'default'
  };
  return tagTypes[status] || 'default';
};

// 获取反馈状态标签文本
const getFeedbackStatusLabel = (status) => {
  const statusLabels = {
    'pending': '待处理',
    'processing': '处理中',
    'solved': '已解决',
    'closed': '已关闭'
  };
  return statusLabels[status] || status;
};

// 获取反馈列表
const fetchFeedbacks = async () => {
  try {
    loading.value = true;
    
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchQuery.value,
      status: statusFilter.value,
      type: typeFilter.value,
      startTime: dateRange.value ? dateRange.value[0] : '',
      endTime: dateRange.value ? dateRange.value[1] : ''
    };
    
    const res = await api.feedback.getFeedbackList(params);
    if (res.code === 200) {
      feedbacks.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取反馈列表失败');
    }
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    ElMessage.error('获取反馈列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取反馈详情
const fetchFeedbackDetail = async (id) => {
  try {
    const res = await api.feedback.getFeedbackDetail(id);
    if (res.code === 200) {
      feedbackDetail.value = res.data || {};
    } else {
      ElMessage.error(res.message || '获取反馈详情失败');
    }
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    ElMessage.error('获取反馈详情失败');
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchFeedbacks();
};

// 处理刷新
const handleRefresh = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  typeFilter.value = '';
  dateRange.value = '';
  pagination.currentPage = 1;
  fetchFeedbacks();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchFeedbacks();
};

// 处理当前页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  fetchFeedbacks();
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedFeedbackIds.value = selection.map(item => item.id);
};

// 导出反馈列表
const handleExportFeedbacks = async () => {
  try {
    exporting.value = true;
    
    const params = {
      keyword: searchQuery.value,
      status: statusFilter.value,
      type: typeFilter.value,
      startTime: dateRange.value ? dateRange.value[0] : '',
      endTime: dateRange.value ? dateRange.value[1] : ''
    };
    
    const res = await api.feedback.exportFeedbacks(params);
    
    if (res.code === 200 && res.data && res.data.downloadUrl) {
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('反馈列表导出成功');
    } else {
      ElMessage.error(res.message || '反馈列表导出失败');
    }
  } catch (error) {
    console.error('导出反馈列表失败:', error);
    ElMessage.error('反馈列表导出失败');
  } finally {
    exporting.value = false;
  }
};

// 批量删除反馈
const handleBatchDelete = async () => {
  try {
    if (!selectedFeedbackIds.value.length) {
      ElMessage.warning('请选择要删除的反馈');
      return;
    }
    
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFeedbackIds.value.length} 条反馈吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    const res = await api.feedback.deleteFeedbacks(selectedFeedbackIds.value);
    
    if (res.code === 200) {
      ElMessage.success('反馈删除成功');
      selectedFeedbackIds.value = [];
      fetchFeedbacks();
    } else {
      ElMessage.error(res.message || '反馈删除失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('批量删除反馈失败:', error);
    ElMessage.error('反馈删除失败');
  }
};

// 单个删除反馈
const handleDeleteFeedback = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条反馈吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    const res = await api.feedback.deleteFeedback(id);
    
    if (res.code === 200) {
      ElMessage.success('反馈删除成功');
      fetchFeedbacks();
    } else {
      ElMessage.error(res.message || '反馈删除失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      return;
    }
    console.error('删除反馈失败:', error);
    ElMessage.error('反馈删除失败');
  }
};

// 查看反馈详情
const handleViewFeedback = async (feedback) => {
  replyContent.value = '';
  await fetchFeedbackDetail(feedback.id);
  feedbackDetailVisible.value = true;
};

// 回复反馈
const handleReplyFeedback = async (feedback) => {
  replyContent.value = '';
  await fetchFeedbackDetail(feedback.id);
  feedbackDetailVisible.value = true;
};

// 关闭反馈详情对话框
const handleFeedbackDetailClose = () => {
  feedbackDetailVisible.value = false;
  replyContent.value = '';
};

// 修改反馈状态
const handleStatusChange = async () => {
  try {
    const res = await api.feedback.updateFeedbackStatus(feedbackDetail.value.id, {
      status: feedbackDetail.value.status
    });
    
    if (res.code === 200) {
      ElMessage.success('反馈状态更新成功');
      fetchFeedbacks();
    } else {
      ElMessage.error(res.message || '反馈状态更新失败');
      // 恢复原状态
      fetchFeedbackDetail(feedbackDetail.value.id);
    }
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    ElMessage.error('反馈状态更新失败');
    // 恢复原状态
    fetchFeedbackDetail(feedbackDetail.value.id);
  }
};

// 取消回复
const handleCancelReply = () => {
  replyContent.value = '';
};

// 提交回复
const handleSubmitReply = async () => {
  try {
    if (!replyContent.value.trim()) {
      ElMessage.warning('请输入回复内容');
      return;
    }
    
    replying.value = true;
    
    const res = await api.feedback.replyFeedback(feedbackDetail.value.id, {
      content: replyContent.value.trim()
    });
    
    if (res.code === 200) {
      ElMessage.success('回复提交成功');
      replyContent.value = '';
      // 重新获取反馈详情
      await fetchFeedbackDetail(feedbackDetail.value.id);
      // 刷新反馈列表
      fetchFeedbacks();
    } else {
      ElMessage.error(res.message || '回复提交失败');
    }
  } catch (error) {
    console.error('提交回复失败:', error);
    ElMessage.error('回复提交失败');
  } finally {
    replying.value = false;
  }
};

// 页面加载时初始化数据
onMounted(() => {
  fetchFeedbacks();
});
</script>

<style scoped>
/* 反馈管理页面容器 */
.feedbacks-container {
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

/* 反馈内容样式 */
.feedback-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 反馈详情 */
.feedback-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-info {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #4b5563;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.status-select {
  width: 150px;
}

.detail-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 20px 0 12px 0;
}

.detail-content h3:first-child {
  margin-top: 0;
}

.user-info {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.user-info p {
  margin: 8px 0;
  color: #4b5563;
}

.feedback-text {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.attachments {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  transition: all 0.3s;
}

.attachment-link:hover {
  background-color: #f3f4f6;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.reply-author {
  font-weight: 500;
  color: #4b5563;
}

.reply-time {
  font-size: 12px;
  color: #9ca3af;
}

.reply-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-replies {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.reply-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.reply-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

/* 响应式设计 */
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
  
  .detail-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .detail-info {
    justify-content: center;
  }
  
  .detail-actions {
    justify-content: center;
  }
}

@media screen and (max-width: 768px) {
  .table-card {
    padding: 0;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  /* 隐藏固定列，避免移动端显示问题 */
  :deep(.el-table__fixed-right) {
    display: none;
  }
  
  .info-item {
    justify-content: center;
    width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .page-header h1 {
    font-size: 20px;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 10px !important;
  }
  
  .attachments {
    flex-direction: column;
  }
  
  .reply-form-actions {
    flex-direction: column;
  }
}

/* 自定义滚动条 */
.feedback-detail {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.feedback-detail::-webkit-scrollbar {
  width: 6px;
}

.feedback-detail::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.feedback-detail::-webkit-scrollbar-track {
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

/* 输入框样式调整 */
:deep(.el-textarea) {
  resize: none;
}
</style>