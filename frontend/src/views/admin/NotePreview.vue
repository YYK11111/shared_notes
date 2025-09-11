<template>
  <div class="note-preview-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button type="text" @click="handleBack" class="back-button">
              <el-icon><ArrowLeft /></el-icon>
              返回列表
            </el-button>
            <h2 class="page-title">笔记预览</h2>
          </div>
          <div class="header-right">
            <!-- 新增代码：代码样式切换下拉菜单 -->
            <el-select
              v-model="selectedTheme"
              placeholder="选择代码样式"
              size="small"
              class="theme-select"
              @change="changeTheme"
            >
              <el-option
                v-for="theme in themes"
                :key="theme.value"
                :label="theme.label"
                :value="theme.value"
              />
            </el-select>
            
            <el-button @click="handleEdit" type="primary" class="ml-2">
              <el-icon><Edit /></el-icon>
              编辑笔记
            </el-button>
          </div>
        </div>
      </template>

      <div class="preview-container">
        <!-- 笔记预览内容 -->
        <div v-if="note" class="preview-content">
          <div class="note-meta">
            <span class="note-id">ID: {{ note.id }}</span>
            <span class="note-status">状态: <el-tag :type="getStatusType(note.status)">{{ getStatusText(note.status) }}</el-tag></span>
            <span v-if="note.is_top" class="note-top">
              <el-tag type="warning">置顶</el-tag>
              <span v-if="note.top_expire_time">(有效期至: {{ formatDate(note.top_expire_time) }})</span>
              <span v-else>永久置顶</span>
            </span>
            <span v-if="note.is_home_recommend" class="note-recommend">
              <el-tag type="success">首页推荐</el-tag>
            </span>
            <span v-if="note.is_week_selection" class="note-week-selection">
              <el-tag type="primary">本周精选</el-tag>
            </span>
            <span v-if="note.is_month_recommend" class="note-month-recommend">
              <el-tag type="info">本月推荐</el-tag>
            </span>
          </div>

          <div class="note-header">
            <h1 class="note-title">{{ note.title }}</h1>
            <div class="note-info">
              <span class="note-categories">
                <el-tag v-for="category in note.categories" :key="category.id" type="info" size="small" class="mr-1">
                  {{ category.name }}
                </el-tag>
              </span>
              <span class="note-date">创建: {{ formatDate(note.created_at) }}</span>
              <span class="note-update">更新: {{ formatDate(note.updated_at) }}</span>
            </div>
            <div v-if="note.cover_image" class="note-cover">
              <el-image :src="`/uploads/${note.cover_image}`" fit="cover" class="cover-image" />
            </div>
          </div>

          <!-- 长笔记处理 -->
          <div v-if="note.isLongNote" class="long-note-tip">
            <el-alert :title="longNoteMessage" type="info" show-icon :closable="false" />
          </div>

          <!-- 笔记内容 -->
          <div class="note-body" v-html="note.html_content" ref="noteBody" v-highlight></div>
        </div>

        <!-- 加载状态 -->
        <div v-else class="loading-container">
          <el-skeleton :count="1" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getNotePreview } from '@/api/note'
import '@/assets/css/code-highlight.css'

// 导入完整的highlight.js库
import hljs from 'highlight.js';
import Clipboard from 'clipboard';
// 导入默认主题
import 'highlight.js/styles/github-dark.css';

// 支持的代码主题列表
const themes = [
  { label: 'GitHub 暗色', value: 'github-dark' },
  { label: 'GitHub 亮色', value: 'github' },
  { label: 'Atom 暗色', value: 'atom-one-dark' },
  { label: 'Atom 亮色', value: 'atom-one-light' },
  { label: 'VSCode 风格', value: 'vs2015' },
  { label: 'Monokai', value: 'monokai-sublime' },
  { label: 'Solarized 暗色', value: 'solarized-dark' },
  { label: 'Solarized 亮色', value: 'solarized-light' },
];

// 当前选中的主题
const selectedTheme = ref('github-dark');

// 动态加载主题样式
const loadTheme = async (themeName) => {
  try {
    console.log(`尝试加载主题: ${themeName}`);
    
    // 清除之前加载的主题样式
    const existingStyles = document.querySelectorAll('link[rel="stylesheet"]');
    existingStyles.forEach(style => {
      if (style.href && style.href.includes('highlight.js/styles/')) {
        style.remove();
      }
    });
    
    // 使用Promise确保CSS文件完全加载后再返回
    return new Promise((resolve, reject) => {
      // 使用CDN路径加载CSS文件，确保文件可访问
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/${themeName}.css`;
      link.dataset.theme = 'highlight'; // 添加标识便于后续移除
      
      // 添加加载成功处理
      link.onload = () => {
        console.log(`主题加载成功: ${themeName}`);
        ElMessage.success(`已切换至${themeName}主题`);
        resolve(true);
      };
      
      // 添加错误处理
      link.onerror = (error) => {
        console.error('主题文件加载失败:', error);
        ElMessage.error(`主题文件加载失败: ${themeName}`);
        reject(error);
      };
      
      document.head.appendChild(link);
    });
  } catch (error) {
    console.error('加载主题失败:', error);
    ElMessage.error(`切换主题失败: ${error.message}`);
    return false;
  }
};

// 验证主题文件是否存在
const validateTheme = async (themeName) => {
  try {
    // 尝试直接导入主题文件以验证其存在性，添加@vite-ignore注释抑制警告
    await import(/* @vite-ignore */ `highlight.js/styles/${themeName}.css`);
    return true;
  } catch (error) {
    return false;
  }
};

// HTML转义函数，用于解决安全警告
const escapeHtml = (html) => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// 切换主题方法
const changeTheme = async (theme) => {
  const success = await loadTheme(theme);
  if (success && note.value && note.value.html_content) {
    // 获取笔记内容容器
    const noteBody = document.querySelector('.note-body');
    if (noteBody) {
      const scrollTop = noteBody.scrollTop;
      
      // 移除所有现有高亮类
      noteBody.querySelectorAll('pre code').forEach(block => {
        block.className = block.className.replace(/hljs\s+/, '');
      });
      
      // 重新应用高亮
      noteBody.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
      
      // 重新处理代码块结构
      processHighlight(noteBody);
      noteBody.scrollTop = scrollTop;
    }
  }
};

// 生成行号
const createLineNumbers = (code) => {
  const lines = code.split('\n').length;
  let lineNumbers = '<div class="line-numbers">';
  for (let i = 1; i <= lines; i++) {
    lineNumbers += `<span class="line-number">${i}</span>`;
  }
  lineNumbers += '</div>';
  return lineNumbers;
};

// 初始化复制功能
const initCopyFeature = (el) => {
  const copyButtons = el.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    // 先销毁已存在的clipboard实例，防止重复绑定
    if (btn._clipboard) {
      btn._clipboard.destroy();
    }
    
    // 修改选择器以匹配新结构
    const clipboard = new Clipboard(btn, {
      text: () => btn.nextElementSibling.nextElementSibling.querySelector('code').textContent
    });
    
    // 存储实例用于后续销毁
    btn._clipboard = clipboard;
    
    clipboard.on('success', () => {
      btn.textContent = '✓ 已复制';
      setTimeout(() => { btn.textContent = '📋 复制'; }, 2000);
    });
    
    clipboard.on('error', () => {
      btn.textContent = '复制失败';
      setTimeout(() => { btn.textContent = '📋 复制'; }, 2000);
    });
  });
};

// 处理代码高亮的核心函数
const processHighlight = (el) => {
  // 选择所有pre标签，这些是代码块的容器
  const preBlocks = el.querySelectorAll('pre');
  
  preBlocks.forEach(pre => {
    // 找到内部的code元素
    let code = pre.querySelector('code');
    if (!code) {
      // 如果没有code元素，创建一个
      code = document.createElement('code');
      code.textContent = pre.textContent;
      pre.innerHTML = '';
      pre.appendChild(code);
    }
    
    // 保存原始类名和内容
    const originalClasses = code.className;
    const originalContent = code.textContent;
    
    // 应用高亮
    hljs.highlightElement(code);
    
    // 生成行号 - 修改行号生成逻辑
    const lines = originalContent.split('\n');
    let lineNumbersHTML = '';
    lines.forEach((_, index) => {
      lineNumbersHTML += `<div class="line-number">${index + 1}</div>`;
    });
    
    // 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 复制';
    
    // 重构代码块结构 - 关键修改
    pre.className = 'code-block-wrapper';
    pre.innerHTML = `
      <div class="code-container">
        ${copyBtn.outerHTML}
        <div class="line-numbers-container">${lineNumbersHTML}</div>
        <div class="code-content"><code class="${originalClasses}">${code.innerHTML}</code></div>
      </div>
    `;
  });
  
  // 初始化复制功能
  initCopyFeature(el);
};

// 代码高亮指令
const vHighlight = {
  mounted(el) {
    processHighlight(el);
  },
  updated(el) {
    // 先清除已有的行号和按钮，避免重复添加
    const existingBtns = el.querySelectorAll('.copy-btn');
    existingBtns.forEach(btn => btn.remove());
    
    const existingLineNumbers = el.querySelectorAll('.line-numbers');
    existingLineNumbers.forEach(line => line.remove());
    
    // 重新处理高亮
    processHighlight(el);
  },
  unmounted(el) {
    // 清理clipboard实例，防止内存泄漏
    const copyButtons = el.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      if (btn._clipboard) {
        btn._clipboard.destroy();
      }
    });
  }
} 

// 其他逻辑保持不变...
const route = useRoute()
const router = useRouter()
const noteId = route.params.id

const note = ref(null)
const loading = ref(false)
const longNoteMessage = ref('正在处理长笔记，请等待...')

const fetchNotePreview = async () => {
  loading.value = true
  try {
    const res = await getNotePreview(noteId)
    
    if (res && res.code === 200) {
      note.value = res.data 
      
      if (note.value.isLongNote) {
        pollLongNoteStatus()
      }
    } else {
      throw new Error(res?.msg || '获取笔记数据失败')
    }
  } catch (error) {
    console.error('获取笔记预览失败:', error)
    ElMessage.error(error.message || '获取笔记预览失败')
    setTimeout(() => {
      handleBack()
    }, 1500)
  } finally {
    loading.value = false
  }
}

const pollLongNoteStatus = () => {
  const checkInterval = setInterval(async () => {
    try {
      const res = await getNotePreview(noteId)
      if (res && res.code === 200 && res.data && !res.data.isLongNote && res.data.html_content) {
        note.value = res.data
        clearInterval(checkInterval)
      }
    } catch (error) {
      console.error('检查长笔记状态失败:', error)
      clearInterval(checkInterval)
    }
  }, 2000)
  
  setTimeout(() => {
    clearInterval(checkInterval)
    if (note.value && note.value.isLongNote) {
      longNoteMessage.value = '笔记处理时间较长，请稍后刷新页面查看'
    }
  }, 60000)
}

const handleBack = () => {
  router.push('/admin/notes')
}

const handleEdit = () => {
  router.push(`/admin/notes/edit/${noteId}`)
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getStatusText = (status) => {
  const statusMap = {
    1: '已发布',
    0: '草稿'
  }
  return statusMap[status] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    1: 'success',
    0: 'info'
  }
  return typeMap[status] || 'primary'
}

onMounted(async () => {
  // 初始加载选中的主题
  await loadTheme(selectedTheme.value);
  
  fetchNotePreview();
})
</script>

<style scoped>
/* 主页面容器 */
.note-preview-page {
  width: 100%;
  min-height: 100vh;
  padding: 1.5rem;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5f7fa;
}

/* 新增代码：主题选择器样式 */
.theme-select {
  width: 160px;
}

.ml-2 {
  margin-left: 8px;
}

/* 使用深度选择器确保Element UI样式被正确覆盖 */
:deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: #fff;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

/* 卡片主体区域 - 设置为滚动容器 */
:deep(.el-card__body) {
  position: relative;
  height: 100%;
  padding: 20px;
  flex: 1;
  box-sizing: border-box;
  margin: 0 !important;
  overflow: hidden;
}

/* 预览容器布局 */
.preview-container {
  height: calc(100vh - 180px);
}

/* 预览内容容器 */
.preview-content {
  height: 100%;
  overflow-y: auto;
  padding-right: 10px;
}

/* 笔记内容区域 - 使用温和的样式重置，保留浏览器默认的列表样式 */
.note-body {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 美化滚动条 */
.preview-content::-webkit-scrollbar,
.note-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-content::-webkit-scrollbar-track,
.note-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb,
.note-body::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover,
.note-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.back-button {
  font-size: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.note-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  flex-wrap: wrap;
}

.note-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.note-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.note-info {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.note-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mr-1 {
  margin-right: 4px;
}

.note-cover {
  margin-top: 1rem;
}

.cover-image {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: cover;
}

.long-note-tip {
  margin-bottom: 1.5rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

/* 完全重构代码块样式 */
:deep(.code-block-wrapper) {
  position: relative;
  margin: 1rem 0 !important;
  border-radius: 6px;
  overflow: hidden;
}

/* 代码容器 - 关键：使用相对定位作为滚动参考 */
:deep(.code-container) {
  position: relative;
  display: flex;
}

/* 行号容器 - 关键：固定定位，相对于父容器 */
:deep(.line-numbers-container) {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3rem;
  padding: 1rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  text-align: right;
  user-select: none;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden; /* 防止行号溢出 */
}

/* 行号样式 - 关键：设置固定高度与代码行匹配 */
:deep(.line-number) {
  color: #999;
  font-size: 0.875rem;
  line-height: 1.5; /* 必须与代码行高完全一致 */
  height: 1.5em; /* 强制行高匹配 */
  font-family: monospace;
}

/* 代码内容区域 - 关键：设置左边距为行号宽度 */
:deep(.code-content) {
  flex: 1;
  margin-left: 3rem; /* 与行号容器宽度一致 */
  overflow-x: auto; /* 仅代码区域横向滚动 */
}

/* 代码元素样式 - 确保与行号对齐 */
:deep(.code-content code) {
  display: block;
  padding: 1rem !important;
  line-height: 1.5; /* 必须与行号行高完全一致 */
  font-family: monospace;
  white-space: pre;
  margin: 0;
  min-height: 100%; /* 确保高度匹配 */
}

/* 调整复制按钮位置 */
:deep(.copy-btn) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

:deep(.copy-btn:hover) {
  background: rgba(0, 0, 0, 0.7);
}

/* 表格样式 */
:deep(.note-body table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  border: 1px solid #e0e0e0;
}

:deep(.note-body th) {
  background-color: #f5f5f5;
  font-weight: bold;
  text-align: left;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
}

:deep(.note-body td) {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
}

:deep(.note-body tr:nth-child(even)) {
  background-color: #fafafa;
}

/* 无序列表样式 */
:deep(.note-body ul) {
  list-style-type: disc;
  padding-left: 2rem; /* 左侧缩进 */
  margin: 1rem 0; /* 上下间距 */
}

/* 有序列表样式 */
:deep(.note-body ol) {
  list-style-type: decimal;
  padding-left: 2rem; /* 左侧缩进 */
  margin: 1rem 0; /* 上下间距 */
}

/* 列表项样式 */
:deep(.note-body li) {
  margin: 0.5rem 0; /* 列表项之间的间距 */
  line-height: 1.6; /* 行高，增强可读性 */
}

/* 嵌套列表样式调整 */
:deep(.note-body ul ul) {
  list-style-type: circle;
  padding-left: 1.5rem; /* 嵌套列表缩进略小 */
}

:deep(.note-body ol ol) {
  list-style-type: lower-alpha;
  padding-left: 1.5rem;
}

/* 段落样式 */
:deep(.note-body p) {
  margin: 1rem 0;
  line-height: 1.7;
}

/* 标题样式 */
:deep(.note-body h1) {
  font-size: 1.8rem;
  margin: 1.5rem 0 1rem;
}

:deep(.note-body h2) {
  font-size: 1.5rem;
  margin: 1.2rem 0 0.8rem;
}

:deep(.note-body h3) {
  font-size: 1.3rem;
  margin: 1rem 0 0.7rem;
}

/* 链接样式 */
:deep(.note-body a) {
  color: #4285f4;
  text-decoration: underline;
}

:deep(.note-body a:hover) {
  color: #3367d6;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .note-preview-page {
    padding: 1rem;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    justify-content: flex-end;
  }

  .preview-container {
    height: auto;
    min-height: calc(100vh - 240px);
  }

  .note-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .note-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .note-title {
    font-size: 1.5rem;
  }

  .note-body {
    padding: 1rem;
  }
}
</style>