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
        <!-- 新增：目录侧边栏 -->
        <div class="toc-sidebar" :class="{ 'toc-collapsed': !isTocOpen }">
          <!-- 移动端目录折叠按钮 -->
          <div class="toc-toggle" @click="toggleToc">
            <el-icon>{{ isTocOpen ? ArrowLeft : Menu }}</el-icon>
          </div>
          
          <div class="toc-header">
            <h3>目录</h3>
            <el-button 
              type="text" 
              size="small" 
              @click="scrollToTop" 
              class="toc-top-btn"
            >
              <el-icon><ArrowUp /></el-icon> 返回顶部
            </el-button>
          </div>
          
          <!-- 目录列表（动态生成） -->
          <div class="toc-list" v-if="tocItems.length">
            <ul class="toc-tree">
              <li 
                v-for="(item, index) in tocItems" 
                :key="index" 
                :class="['toc-item', { 'toc-active': activeTocIndex === index }]" 
                @click="scrollToSection(item, index)"
              >
                <span :style="{ paddingLeft: `${(item.level - 1) * 16}px` }">
                  {{ item.title }}
                </span>
              </li>
            </ul>
          </div>
          <div class="toc-empty" v-else>
            <el-empty description="文档无标题内容" size="small" />
          </div>
        </div>

        <!-- 原有笔记内容区域（调整宽度适配目录） -->
        <div class="content-container">
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
              <el-image 
                v-if="coverImageUrl"
                :src="coverImageUrl"
                fit="cover"
                class="cover-image"
                :loading="coverLoading"
                :error="() => coverImageUrl = ''"
              />
              <el-skeleton v-else-if="coverLoading" :count="1" class="cover-skeleton" />
            </div>
          </div>

          <!-- 长笔记处理 -->
          <div v-if="note.isLongNote" class="long-note-tip">
            <el-alert :title="longNoteMessage" type="info" show-icon :closable="false" />
          </div>

          <!-- 笔记内容 -->
          <div class="note-body" v-html="note.html_content" ref="noteBodyRef" v-highlight></div>
        </div>

        <!-- 加载状态 -->
        <div v-else class="loading-container">
          <el-skeleton :count="1" />
        </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowLeft, Edit, Menu, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getNotePreview } from '@/api/note'
import { getFileDataUrl } from '@/api/file'
import '@/assets/css/code-highlight.css'

// 导入完整的highlight.js库
import hljs from 'highlight.js';
import Clipboard from 'clipboard';
// 导入默认主题
import 'highlight.js/styles/github-dark.css';

// 手动添加行号的函数
const addLineNumbersManually = (pre, code) => {
  // 获取代码行数（过滤空行，避免多余行号）
  const codeText = code.textContent.trim();
  if (!codeText) return; // 空代码块不添加行号
  const codeLines = codeText.split('\n');
  const lineCount = codeLines.length;

  // 1. 统一代码区域样式（确保行高、字体、内边距固定）
  code.style.fontFamily = 'monospace'; // 强制等宽字体
  code.style.fontSize = '0.875rem';    // 统一字体大小
  code.style.lineHeight = '1.6';       // 统一行高（关键：行号与代码行高必须一致）
  code.style.padding = '1rem 1rem 1rem 0'; // 右侧内边距，左侧留出行号空间
  code.style.display = 'block';
  code.style.whiteSpace = 'pre';       // 保留空格，避免代码换行混乱

  // 2. 创建行号容器，与代码区域样式同步
  const lineNumbersContainer = document.createElement('div');
  lineNumbersContainer.className = 'line-numbers';
  // 行号容器定位：与pre同高，左侧固定宽度
  lineNumbersContainer.style.position = 'absolute';
  lineNumbersContainer.style.left = '0';
  lineNumbersContainer.style.top = '0';
  lineNumbersContainer.style.bottom = '0';
  lineNumbersContainer.style.width = '3rem'; // 行号区域宽度（与code padding-left对应）
  // 行号样式：与代码完全同步
  lineNumbersContainer.style.fontFamily = 'monospace';
  lineNumbersContainer.style.fontSize = '0.875rem';
  lineNumbersContainer.style.lineHeight = '1.6'; // 关键：行高与代码一致
  lineNumbersContainer.style.padding = '1rem 0.5rem'; // 上下内边距与代码一致
  lineNumbersContainer.style.borderRight = '1px solid #3e4451';
  lineNumbersContainer.style.backgroundColor = 'rgba(27, 31, 35, 0.05)';
  lineNumbersContainer.style.color = '#6b7280';
  lineNumbersContainer.style.textAlign = 'right';
  lineNumbersContainer.style.userSelect = 'none';
  lineNumbersContainer.style.overflow = 'hidden'; // 隐藏超出容器的行号

  // 3. 添加行号（确保每行高度与代码行一致）
  for (let i = 1; i <= lineCount; i++) {
    const lineNumber = document.createElement('div');
    lineNumber.className = 'line-number';
    lineNumber.textContent = i;
    // 行号单行高度与代码行高同步
    lineNumber.style.height = `${parseFloat(getComputedStyle(code).lineHeight)}px`;
    lineNumbersContainer.appendChild(lineNumber);
  }

  // 4. 调整pre容器样式（确保行号容器能正常定位）
  pre.style.position = 'relative';
  pre.style.overflow = 'hidden'; // 避免行号或代码溢出

  // 5. 添加行号容器到pre
  pre.insertBefore(lineNumbersContainer, code);
}

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
  if (success && note.value && note.value.html_content && noteBodyRef.value) {
    const noteBody = noteBodyRef.value;
    const scrollTop = noteBody.scrollTop;
    
    // 1. 移除旧行号和高亮类
    noteBody.querySelectorAll('pre').forEach(pre => {
      const oldLineNumbers = pre.querySelector('.line-numbers');
      if (oldLineNumbers) oldLineNumbers.remove(); // 移除旧行号容器
      const code = pre.querySelector('code');
      if (code) code.className = code.className.replace(/hljs\s+/, '');
    });
    
    // 2. 重新高亮代码
    noteBody.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
    
    // 3. 重新添加行号（关键：确保新主题下对齐）
    noteBody.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code) addLineNumbersManually(pre, code);
    });
    
    // 4. 重新初始化复制功能
    initCopyFeature(noteBody);
    noteBody.scrollTop = scrollTop;
  }
};



// 初始化复制功能
const initCopyFeature = (el) => {
  const copyButtons = el.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    // 先销毁已存在的clipboard实例，防止重复绑定
    if (btn._clipboard) {
      btn._clipboard.destroy();
    }
    
    // 适配插件生成的结构
    const clipboard = new Clipboard(btn, {
      text: () => btn.previousElementSibling.textContent
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
const processHighlight = async (el) => {
  await nextTick();
  
  // 清除旧按钮
  el.querySelectorAll('.copy-btn').forEach(btn => btn.remove());
  
  // 处理代码块
  const preBlocks = el.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    // 确保有code元素
    let code = pre.querySelector('code');
    if (!code) {
      code = document.createElement('code');
      code.textContent = pre.textContent;
      pre.innerHTML = '';
      pre.appendChild(code);
    }
    
    // 移除旧样式类
    pre.className = pre.className.replace('code-block-wrapper', '');
    
    // 添加行号标识
    pre.dataset.lineNumbers = "true";
    
    // 设置position为relative，确保复制按钮定位正确
    pre.style.position = 'relative';
    
    // 清除已高亮标记，避免重复高亮警告
    if (code.dataset.highlighted) {
      delete code.dataset.highlighted;
    }
    
    // 应用高亮
    hljs.highlightElement(code);
    
    // 添加行号功能（使用内联方式实现，避免依赖外部插件）
    try {
      addLineNumbersManually(pre, code);
    } catch (error) {
      console.error('Failed to add line numbers manually:', error);
    }
    
    // 添加复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 复制';
    pre.appendChild(copyBtn);
  });
  
  // 初始化复制功能（保持不变）
  initCopyFeature(el);
};

// 1. 提取文档标题生成目录（在笔记加载完成后调用）
const generateToc = async () => {
  await nextTick(); // 等待 DOM 渲染完成
  const noteBody = noteBodyRef.value;
  if (!noteBody) return;

  // 提取 h1-h6 标题（排除笔记本身的标题，只取内容中的标题）
  const headings = noteBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const items = [];

  headings.forEach(heading => {
    // 给标题添加唯一 ID（用于锚点定位）
    const headingId = `heading-${Date.now()}-${items.length}`;
    heading.id = headingId;

    // 记录标题层级（h1=1，h2=2...）
    const level = parseInt(heading.tagName.replace('H', ''));
    items.push({
      title: heading.textContent.trim(),
      level,
      id: headingId,
      element: heading // 存储 DOM 节点用于滚动计算
    });
  });

  tocItems.value = items;
  activeTocIndex.value = 0; // 默认激活第一个标题
};

// 2. 滚动到指定章节（目录点击事件）
const scrollToSection = (item, index) => {
  const element = document.getElementById(item.id);
  if (element) {
    // 平滑滚动到标题位置（偏移 20px 避免被顶部遮挡）
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeTocIndex.value = index;

    // 移动端点击目录后自动折叠
    if (window.innerWidth < 768) {
      isTocOpen.value = false;
    }
  }
};

// 3. 监听滚动，更新当前激活目录（联动高亮）
const handleScroll = () => {
  if (tocItems.value.length === 0 || !noteBodyRef.value) return;

  // 改为获取笔记内容容器的局部滚动位置
  const noteBody = noteBodyRef.value;
  const scrollTop = noteBody.scrollTop + 100; // 偏移量保持不变

  // 遍历目录项，判断当前可视标题
  for (let i = tocItems.value.length - 1; i >= 0; i--) {
    const heading = tocItems.value[i].element;
    // 计算标题相对于笔记容器的偏移量（而非全局偏移）
    const offsetTop = heading.offsetTop;

    if (scrollTop >= offsetTop) {
      activeTocIndex.value = i;
      break;
    }
  }
};

// 4. 移动端目录折叠/展开切换
const toggleToc = () => {
  isTocOpen.value = !isTocOpen.value;
};

// 5. 返回顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 其他逻辑保持不变...
const route = useRoute()
const router = useRouter()
const noteId = route.params.id

const note = ref(null)
const loading = ref(false)
const longNoteMessage = ref('正在处理长笔记，请等待...')
const coverImageUrl = ref('')
const coverLoading = ref(false)



// 获取封面图片URL的函数
const fetchCoverImage = async (fileId) => {
  if (!fileId) {
    coverImageUrl.value = '';
    return;
  }
  
  coverLoading.value = true;
  try {
    const dataUrl = await getFileDataUrl(fileId);
    coverImageUrl.value = dataUrl;
  } catch (error) {
    console.error('获取封面图片失败:', error);
    coverImageUrl.value = '';
  } finally {
    coverLoading.value = false;
  }
};

// 6. 优化：监听笔记加载完成，自动生成目录
watch(note, async (newNote) => {
  if (newNote && newNote.html_content) {
    await nextTick(); // 等待 v-html 渲染完成
    generateToc(); // 生成目录
    await processHighlight(noteBodyRef.value); // 确保高亮处理生效
    
    // 获取封面图片
    if (newNote.cover_image) {
      await fetchCoverImage(newNote.cover_image);
    } else {
      coverImageUrl.value = '';
    }
  }
}, { immediate: true });

// 代码高亮指令
const vHighlight = {
  mounted(el) {
    // 由于directive钩子不能是async，使用then处理异步操作
    processHighlight(el).catch(err => {
      console.error('Failed to process highlight in mounted:', err);
    });
  },
  updated(el) {
    // 先清除已有的按钮，避免重复添加
    const existingBtns = el.querySelectorAll('.copy-btn');
    existingBtns.forEach(btn => btn.remove());
    
    // 由于directive钩子不能是async，使用then处理异步操作
    processHighlight(el).catch(err => {
      console.error('Failed to process highlight in updated:', err);
    });
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

// 新增：目录相关响应式变量
const tocItems = ref([]); // 存储目录项（标题、层级、DOM节点）
const activeTocIndex = ref(-1); // 当前激活的目录索引
const isTocOpen = ref(true); // 移动端目录是否展开（默认展开）
const noteBodyRef = ref(null); // 笔记内容容器引用

// 其他逻辑保持不变...

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
        
        // 长笔记加载完成后重新处理高亮和行号对齐
        await nextTick();
        generateToc();
        
        const noteBody = noteBodyRef.value;
        if (noteBody) {
          // 移除旧行号和高亮类
          noteBody.querySelectorAll('pre').forEach(pre => {
            const oldLineNumbers = pre.querySelector('.line-numbers');
            if (oldLineNumbers) oldLineNumbers.remove(); // 移除旧行号容器
            const code = pre.querySelector('code');
            if (code) {
              code.className = code.className.replace(/hljs\s+/, '');
              // 清除已高亮标记，避免重复高亮警告
              if (code.dataset.highlighted) {
                delete code.dataset.highlighted;
              }
            }
          });
          
          // 重新高亮代码
          noteBody.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });
          
          // 重新添加行号（确保对齐）
          noteBody.querySelectorAll('pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (code) {
              try {
                addLineNumbersManually(pre, code);
              } catch (error) {
                console.error('Failed to add line numbers manually:', error);
              }
            }
          });
          
          // 重新初始化复制功能
          initCopyFeature(noteBody);
        }
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
  // 移除全局滚动监听，改为监听笔记容器滚动
  if (noteBodyRef.value) {
    noteBodyRef.value.addEventListener('scroll', handleScroll);
  }
})

// 清理：移除滚动监听（防止内存泄漏）
onUnmounted(() => {
  // 移除笔记容器的滚动监听（防止内存泄漏）
  if (noteBodyRef.value) {
    noteBodyRef.value.removeEventListener('scroll', handleScroll);
  }
  // 原有清理逻辑（clipboard 销毁）保持不变...
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
  display: flex;
  height: calc(100vh - 180px);
  gap: 16px;
}

/* 2. 目录侧边栏样式 */
.toc-sidebar {
  width: 280px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  overflow-y: auto;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
}

/* 3. 内容容器样式（调整宽度） */
.content-container {
  flex: 1;
  overflow: hidden;
}

/* 4. 目录头部样式 */
.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.toc-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.toc-top-btn {
  color: #666;
  font-size: 12px;
}

/* 5. 目录列表样式 */
.toc-list {
  padding: 0;
}

.toc-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 目录项样式 */
  .toc-item {
    padding: 8px 12px; /* 增加内边距，提升点击区域 */
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    font-size: 14px;
  }

  /*  hover 样式：浅色背景，浅蓝文字 */
  .toc-item:hover {
    background-color: #f0f7ff;
    color: #4285f4;
  }

  /*  active 样式：深色背景，深蓝文字，增加左边框，强化区分 */
  .toc-item.toc-active {
    background-color: #e8f0fe;
    color: #1a73e8;
    border-left: 3px solid #4285f4;
    padding-left: 9px; /* 抵消左边框宽度，保持文字对齐 */
    font-weight: 500;
  }

.toc-empty {
  padding: 40px 0; /* 增加上下内边距 */
  text-align: center;
  color: #999; /* 增加文字颜色，提升辨识度 */
}

/* 6. 目录切换按钮 */
.toc-toggle {
  display: none; /* 默认隐藏，仅在移动端显示 */
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 在桌面端隐藏目录切换按钮 */
@media (min-width: 769px) {
  .toc-toggle {
    display: none !important;
  }
}

.toc-toggle:hover {
  background: #f5f7fa;
}

/* 7. 预览内容容器 */
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

/* 代码块基础样式 */
:deep(pre) {
  position: relative;
  margin: 1rem 0 !important;
  border-radius: 6px;
  overflow: hidden;
  padding: 0 !important;
}

/* 自定义行号容器样式（与addLineNumbersManually函数同步） */
:deep(.line-numbers) {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3rem;
  padding: 1rem 0.5rem;
  border-right: 1px solid #3e4451;
  background-color: rgba(27, 31, 35, 0.05);
  color: #6b7280;
  text-align: right;
  user-select: none;
  overflow: hidden;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

/* 代码区域样式（确保左侧留出行号空间） */
:deep(pre code) {
  padding-left: 4rem !important; /* 3rem行号宽度 + 1rem间距，避免代码与行号重叠 */
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  display: block;
  white-space: pre;
}

/* 行号单行样式 */
:deep(.line-number) {
  height: 1.6em; /* 与行高同步，确保每行对齐 */
  box-sizing: border-box;
}

/* 复制按钮位置调整 */
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

  /* 移动端目录适配 */
  .toc-sidebar {
    width: 240px;
    position: fixed;
    left: -240px; /* 默认隐藏 */
    top: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    border-radius: 0;
    transition: left 0.3s ease; /* 增加过渡动画 */
  }
  
  /* isTocOpen=true 时添加类，目录显示 */
  .toc-sidebar:not(.toc-collapsed) {
    left: 0;
  }

  /* 确保移动端显示切换按钮 */
  .toc-toggle {
    display: flex !important; /* 强制显示，避免被其他样式覆盖 */
    right: -20px; /* 调整按钮位置，避免被目录遮挡 */
  }

  .content-container {
    margin-left: 0;
    transition: margin-left 0.3s ease;
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