<template>
  <div class="note-detail">
    <div class="note-container">
      <!-- 目录侧边栏 -->
      <div class="note-toc" v-if="tocItems.length > 0 && showToc">
        <div class="toc-header">
          <h3>目录</h3>
          <el-button type="text" size="small" @click="toggleTocDisplay" class="toc-toggle-btn">
              <span class="toggle-icon" :class="{ 'toc-collapsed-icon': tocCollapsed }"></span>
            </el-button>
        </div>
        <div class="toc-content" :class="{ 'toc-collapsed': tocCollapsed }">
          <ul class="toc-list">
            <li v-for="(item, index) in tocItems" :key="index" :class="['toc-item', `toc-level-${item.level}`]"
              :style="{ paddingLeft: `${(item.level - 1) * 15}px` }">
              <a href="#" @click.prevent="scrollToSection(item.id)"
                :class="{ 'toc-active': activeSectionId === item.id }">
                {{ item.title }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- 内容区域 -->
      <el-card v-if="note" class="note-content">
        <template #header>
          <div class="note-header">
            <!-- 封面图片 -->
            <div v-if="coverImageUrl || coverImageLoading" class="note-cover">
              <img 
                v-if="coverImageUrl" 
                :src="coverImageUrl" 
                alt="笔记封面" 
                class="cover-image"
              />
              <div v-else class="cover-loading">
                <el-icon><Loading /></el-icon>
              </div>
            </div>
            
            <h1 class="note-title">{{ note.title }}</h1>
            <div class="note-meta">
              <span>{{ note.categories }}</span>
              <span>{{ formatDate(note.created_at) }}</span>
              <span>{{ note.view_count || 0 }} 浏览</span>
              <span>{{ note.like_count || 0 }} 喜欢</span>
            </div>
          </div>
        </template>

        <!-- 长笔记处理提示 -->
      <div v-if="isLongNote" class="long-note-tip">
        <el-alert :title="longNoteMessage" type="info" show-icon></el-alert>
      </div>
      
      <!-- 代码主题切换 -->
      <div class="theme-selector" v-if="isLongNote === false">
        <el-select 
          v-model="selectedTheme" 
          placeholder="选择代码主题" 
          size="small" 
          @change="changeTheme"
        >
          <el-option 
            v-for="theme in themes" 
            :key="theme.value" 
            :label="theme.label" 
            :value="theme.value">
          </el-option>
        </el-select>
      </div>
      
      <!-- 笔记内容 -->
      <div class="note-body" ref="noteBodyRef" v-html="renderedContent" @click="handleImageClick"></div>

        <!-- 操作按钮 -->
        <div class="note-actions">
          <el-button @click="handleLike" type="primary" :loading="likeLoading">
            <el-icon>
              <component :is="likeIcon" />
            </el-icon>
            {{ isLiked ? '取消喜欢' : '喜欢' }}
          </el-button>
          <el-button @click="handleShare" type="default" :loading="shareLoading">
            <el-icon>
              <Share />
            </el-icon>
            分享
          </el-button>
          <el-button @click="handleReport" type="default" :loading="reportLoading">
            <el-icon>
              <Warning />
            </el-icon>
            举报
          </el-button>
        </div>

        <!-- 评论区域 -->
        <div class="comment-section">
          <h3 class="section-title">评论 ({{ comments.length }})</h3>

          <!-- 评论输入框 -->
          <div class="comment-input">
            <el-input v-model="commentContent" type="textarea" placeholder="写下你的评论..." :rows="3"></el-input>
            <div class="comment-submit">
              <el-button @click="handleSubmitComment" type="primary" :disabled="!commentContent.trim()"
                :loading="commentLoading">
                提交评论
              </el-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-avatar">
                <img :src="comment.user_avatar || defaultAvatar" alt="用户头像" />
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.user_name }}</span>
                  <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-actions">
                  <span @click="handleReply(comment)">回复</span>
                  <span @click="handleCommentLike(comment)">
                    {{ comment.is_liked ? '取消点赞' : '点赞' }} ({{ comment.like_count }})
                  </span>
                </div>
              </div>
            </div>

            <!-- 回复框 -->
            <div v-if="replyingComment" class="reply-input">
              <el-input v-model="replyContent" type="textarea" :placeholder="'回复 ' + replyingComment.user_name + '...'"
                :rows="2"></el-input>
              <div class="reply-actions">
                <el-button @click="cancelReply">取消</el-button>
                <el-button @click="handleSubmitReply" type="primary" :disabled="!replyContent.trim()"
                  :loading="replyLoading">
                  回复
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端目录切换按钮 -->
        <el-button class="mobile-toc-toggle" type="primary" @click="toggleMobileToc" v-if="tocItems.length > 0">
          <el-icon>
            <Menu />
          </el-icon>
          目录
        </el-button>
      </el-card>

      <!-- 加载中 -->
      <el-empty v-else description="加载中..." />

      <!-- 相关笔记推荐 -->
      <div class="related-notes" v-if="relatedNotes.length > 0">
        <h3 class="section-title">相关笔记</h3>
        <div class="related-list">
          <el-card v-for="item in relatedNotes" :key="item.id" class="related-card" hoverable>
            <router-link :to="'/notes/' + item.id" class="related-title">
              {{ item.title }}
            </router-link>
          </el-card>
        </div>
      </div>
    </div>
    
    <!-- 滚动到顶部按钮 -->
    <button class="scroll-top-btn" :class="{ 'visible': showScrollTop }" @click="scrollToTop">
      <el-icon><ChevronUp /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUserNoteDetail, likeNote, getComments, submitComment, likeComment, submitReply, getRelatedNotes, getUserNotePreview } from '@/api/user'
import { increaseNoteViewCount } from '@/api/note'
import { getFileObjectUrl } from '@/api/file'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox, ElSelect, ElOption } from 'element-plus'
import { Star, StarFilled, Share, Warning, CopyDocument, Check, List, Menu, ArrowDown, ArrowRight, Close, ArrowLeft, ArrowUp, Loading } from '@element-plus/icons-vue'
import axios from 'axios'
import hljs from 'highlight.js'
import Clipboard from 'clipboard'
import 'highlight.js/styles/github-dark-dimmed.css' // 默认主题

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
const selectedTheme = ref('github-dark-dimmed');

// 路由
const route = useRoute()
const noteId = route.params.id

// 笔记数据
const note = ref(null)
const comments = ref([])
const relatedNotes = ref([])
const coverImageUrl = ref('')
const coverImageLoading = ref(false)
let coverImageRevoke = null

// 长笔记处理状态
const isLongNote = ref(false)
const loadingHtmlContent = ref(false)
const longNoteMessage = ref('正在处理长笔记，请等待...')

// 用户交互状态
const isLiked = ref(false)
const likeIcon = ref(Star)
const likeLoading = ref(false)
const shareLoading = ref(false)
const reportLoading = ref(false)
const commentLoading = ref(false)
const replyLoading = ref(false)
const commentContent = ref('')
const replyContent = ref('')
const replyingComment = ref(null)

// 目录相关状态
const tocItems = ref([])
const activeSectionId = ref('')
const showToc = ref(true)
const tocCollapsed = ref(false)
const mobileTocVisible = ref(false)

// 滚动到顶部按钮状态
const showScrollTop = ref(false)



// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// 加载封面图片
const loadCoverImage = async (fileId) => {
  if (!fileId) {
    coverImageUrl.value = ''
    return
  }
  
  coverImageLoading.value = true
  try {
    // 先释放可能存在的旧URL
    if (coverImageRevoke) {
      coverImageRevoke();
    }
    
    const { url, revoke } = await getFileObjectUrl(fileId)
    coverImageUrl.value = url
    coverImageRevoke = revoke
  } catch (error) {
    console.error('加载封面图片失败:', error)
    coverImageUrl.value = ''
  } finally {
    coverImageLoading.value = false
  }
}

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
        resolve(true);
      };
      
      // 添加错误处理
      link.onerror = (error) => {
        console.error('主题文件加载失败:', error);
        reject(error);
      };
      
      document.head.appendChild(link);
    });
  } catch (error) {
    console.error('加载主题失败:', error);
    return false;
  }
};

// 切换主题方法
const changeTheme = async (theme) => {
  const success = await loadTheme(theme);
  if (success && note.value && renderedContent.value && noteBodyRef.value) {
    const noteBody = noteBodyRef.value;
    const scrollTop = window.scrollY;
    
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
    
    // 3. 重新添加行号
    noteBody.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code) addLineNumbersManually(pre, code);
    });
    
    // 4. 重新初始化复制功能
    initCopyFeature(noteBody);
    window.scrollTo({ top: scrollTop });
  }
};

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
  code.style.padding = '1rem 1rem 1rem 3.5rem'; // 右侧内边距，左侧留出行号空间（增加到3.5rem）
  code.style.display = 'block';
  code.style.whiteSpace = 'pre';       // 保留空格，避免代码换行混乱
  code.style.boxSizing = 'border-box'; // 确保padding计算在宽度内

  // 2. 创建行号容器，与代码区域样式同步
  const lineNumbersContainer = document.createElement('div');
  lineNumbersContainer.className = 'line-numbers';
  // 行号容器定位：与pre同高，左侧固定宽度
  lineNumbersContainer.style.position = 'absolute';
  lineNumbersContainer.style.left = '0';
  lineNumbersContainer.style.top = '0';
  lineNumbersContainer.style.bottom = '0';
  lineNumbersContainer.style.width = '3rem'; // 行号区域宽度
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
  lineNumbersContainer.style.zIndex = '10'; // 确保行号在其他元素之上

  // 3. 添加行号（确保每行高度与代码行一致）
  for (let i = 1; i <= lineCount; i++) {
    const lineNumber = document.createElement('span');
    lineNumber.className = 'line-number';
    lineNumber.textContent = i;
    // 行号单行高度与代码行高同步
    lineNumber.style.height = `${parseFloat(getComputedStyle(code).lineHeight)}px`;
    lineNumber.style.display = 'block'; // 确保每个行号占一行
    lineNumbersContainer.appendChild(lineNumber);
  }

  // 4. 调整pre容器样式（确保行号容器能正常定位）
  pre.style.position = 'relative';
  pre.style.overflow = 'hidden'; // 避免行号或代码溢出

  // 5. 添加行号容器到pre
  pre.insertBefore(lineNumbersContainer, code);
};

// 笔记内容引用
const noteBodyRef = ref(null);

// 生成目录ID
const generateTocId = (title, level) => {
  const slug = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
  return `toc-${level}-${slug}`
}

// 提取目录项
const extractTocItems = (html) => {
  const items = []
  if (!html || typeof html !== 'string') {
    console.warn('目录提取失败：HTML 内容为空或格式异常', html)
    return items
  }
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const headings = tempDiv.querySelectorAll('h1, h2, h3')
  if (headings.length === 0) {
    return items
  }

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.replace('H', ''))
    const title = heading.textContent.trim()
    if (!title) return
    const id = generateTocId(title, index)
    heading.id = id
    items.push({ id, title, level, index })
  })

  return items
}

// 渲染内容 - 优先使用接口返回的htmlContent，实现CSDN风格代码预览
const renderedContent = computed(() => {
  if (!note.value) return ''
  
  // 优先使用接口返回的htmlContent
  if (note.value.htmlContent) {
    // 对接口返回的代码块进行增强，添加CSDN风格的容器
    let enhancedHtml = note.value.htmlContent.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, 
      (match, attrs, code) => {
        // 提取语言信息
        let lang = 'plaintext';
        if (attrs && attrs.includes('class')) {
          const langMatch = attrs.match(/language-(\w+)/);
          if (langMatch && langMatch[1]) {
            lang = langMatch[1];
          }
        }
        
        // 生成唯一ID
        const codeId = `code-block-${Math.random().toString(36).substr(2, 9)}`;
        
        // 简化的代码块结构，不显示不需要的元素
        return `<div class="code-block-container">
          <div class="code-header">
            <div class="code-actions">
              <button class="code-copy-btn" data-target="${codeId}" title="复制代码">
                <CopyDocument class="code-icon" />
              </button>
            </div>
          </div>
          <div class="code-content" id="${codeId}">
            <pre><code${attrs}>${code}</code></pre>
          </div>
        </div>`;
      }
    );
    
    return enhancedHtml;
  }
  
  // 如果没有htmlContent，使用content进行Markdown转换
  if (!note.value.content) return '';
  
  try {
    let html = note.value.content;
    
    // 标题转换
    html = html.replace(/^### (.*$)/gm, (match, title) => {
      const id = generateTocId(title, tocItems.value.length)
      return `<h3 id="${id}">${title}</h3>`
    });
    html = html.replace(/^## (.*$)/gm, (match, title) => {
      const id = generateTocId(title, tocItems.value.length)
      return `<h2 id="${id}">${title}</h2>`
    });
    html = html.replace(/^# (.*$)/gm, (match, title) => {
      const id = generateTocId(title, tocItems.value.length)
      return `<h1 id="${id}">${title}</h1>`
    });
    
    // 代码块转换 - CSDN风格
    html = html.replace(/```(\w+)?\s*([\s\S]*?)```/gs, (match, language, code) => {
      const lang = language || 'plaintext';
      const langClass = language ? `language-${language}` : '';
      const codeId = `code-block-${Math.random().toString(36).substr(2, 9)}`;
      
      // 转义HTML特殊字符
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      return `<div class="code-block-container">
        <div class="code-header">
          <div class="code-actions">
            <button class="code-copy-btn" data-target="${codeId}" title="复制代码">
              <CopyDocument class="code-icon" />
            </button>
          </div>
        </div>
        <div class="code-content" id="${codeId}">
          <pre><code class="${langClass}">${escapedCode}</code></pre>
        </div>
      </div>`;
    });
    
    // 其他基础格式转换
    html = html.replace(/^(?!<[h|p|ul|ol|blockquote])(.*$)/gm, '<p>$1</p>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/\*\*(.*)\*\*/gs, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gs, '<em>$1</em>');
    html = html.replace(/\[(.*)\]\((.*)\)/gs, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/`(.*?)`/gs, '<code>$1</code>');
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/!\[(.*)\]\((.*)\)/gs, '<img src="$2" alt="$1" class="note-image" />');
    html = html.replace(/\n{3,}/g, '\n\n');
    
    return html;
  } catch (error) {
    console.error('解析笔记内容失败:', error);
    return note.value.content;
  }
});

// 初始化复制功能
const initCopyFeature = (el) => {
  const copyButtons = el.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    // 先销毁已存在的clipboard实例，防止重复绑定
    if (btn._clipboard) {
      btn._clipboard.destroy();
    }
    
    // 适配代码块结构
    const clipboard = new Clipboard(btn, {
      text: () => {
        const pre = btn.closest('pre');
        const code = pre.querySelector('code');
        return code ? code.textContent : '';
      }
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

const handleToggleClick = (e) => {
  const btn = e.currentTarget;
  const pre = btn.closest('pre');
  const codeContent = pre.closest('.code-content');
  
  const isExpanded = !codeContent.classList.contains('collapsed');
  
  if (isExpanded) {
    codeContent.classList.add('collapsed');
    btn.innerHTML = '<ArrowRight class="code-icon" />';
  } else {
    codeContent.classList.remove('collapsed');
    btn.innerHTML = '<ArrowDown class="code-icon" />';
  }
};

const handleLineNumbersClick = (e) => {
  const btn = e.currentTarget;
  const pre = btn.closest('pre');
  const lineNumbers = pre.querySelector('.line-numbers');
  const code = pre.querySelector('code');
  
  if (lineNumbers) {
    if (lineNumbers.style.display === 'none') {
      lineNumbers.style.display = 'block';
      code.style.paddingLeft = '4rem';
    } else {
      lineNumbers.style.display = 'none';
      code.style.paddingLeft = '1rem';
    }
  }
};

const handleCodeTabClick = (e) => {
  const tab = e.currentTarget;
  const tabsContainer = tab.parentElement;
  const codeContainer = tabsContainer.closest('.code-block-container');
  const codeElement = codeContainer.querySelector('code');
  const codeBlock = codeContainer.querySelector('.code-content');
  
  // 移除所有标签的active状态
  tabsContainer.querySelectorAll('.code-tab').forEach(t => {
    t.classList.remove('active');
  });
  
  // 添加当前标签的active状态
  tab.classList.add('active');
  
  // 根据标签切换代码显示模式
  if (tab.textContent === '原始') {
    codeElement.classList.add('raw-code');
    // 移除语法高亮
    codeElement.className = codeElement.className.replace(/language-\w+/g, '');
  } else {
    codeElement.classList.remove('raw-code');
    // 重新应用语法高亮
    const langMatch = codeElement.className.match(/language-(\w+)/);
    if (langMatch && langMatch[1]) {
      hljs.highlightElement(codeElement);
    }
  }
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
    
    // 添加行号功能
    try {
      addLineNumbersManually(pre, code);
    } catch (error) {
      console.error('Failed to add line numbers manually:', error);
    }
    
    // 添加复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 复制';
    // 设置按钮位置为代码块右上角
    copyBtn.style.position = 'absolute';
    copyBtn.style.top = '10px';
    copyBtn.style.right = '10px';
    copyBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    copyBtn.style.border = 'none';
    copyBtn.style.color = '#fff';
    copyBtn.style.padding = '6px 12px';
    copyBtn.style.borderRadius = '4px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.fontSize = '12px';
    copyBtn.style.zIndex = '20'; // 确保在其他元素之上
    copyBtn.style.transition = 'all 0.2s ease';
    copyBtn.style.opacity = '0'; // 初始隐藏
    
    pre.appendChild(copyBtn);
    
    // 鼠标悬停时显示复制按钮
    pre.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1';
    });
    
    pre.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0';
    });
  });
  
  // 初始化复制功能
  initCopyFeature(el);
};

// 处理代码高亮、行号显示、复制功能等
const enhanceCodeBlocks = async () => {
  const contentElement = document.querySelector('.note-body');
  if (!contentElement) return;
  
  await processHighlight(contentElement);
  
  // 初始化主题
  await loadTheme(selectedTheme.value);
};

// 监听内容变化，重新处理代码块
defineExpose({
  enhanceCodeBlocks
});

// 目录相关方法
const toggleTocDisplay = () => {
  tocCollapsed.value = !tocCollapsed.value;
};

const toggleMobileToc = () => {
  mobileTocVisible.value = !mobileTocVisible.value;
};

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    // 添加80px偏移量，避免被顶部导航栏遮挡
    const offset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    activeSectionId.value = id;
    
    if (mobileTocVisible.value) {
      mobileTocVisible.value = false;
    }
  }
};

// 监听滚动事件，更新当前激活的目录项和滚动按钮显示
const handleScroll = () => {
  // 控制滚动到顶部按钮显示
  showScrollTop.value = window.scrollY > 500;
  
  // 处理目录激活状态
  if (tocItems.value.length === 0 || !showToc.value) return;

  const scrollPosition = window.scrollY + 100;

  let currentSectionId = '';
  for (let i = tocItems.value.length - 1; i >= 0; i--) {
    const item = tocItems.value[i];
    const element = document.getElementById(item.id);

    if (element && element.offsetTop <= scrollPosition) {
      currentSectionId = item.id;
      break;
    }
  }

  if (currentSectionId !== activeSectionId.value) {
    activeSectionId.value = currentSectionId;
  }
};

// 滚动到顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 更新目录
const updateToc = () => {
  const html = renderedContent.value;
  const items = extractTocItems(html);
  tocItems.value = items;
  
  if (items.length > 0) {
    activeSectionId.value = items[0].id;
  }
};

// 图片查看功能
const handleImageClick = (e) => {
  if (e.target.tagName === 'IMG') {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.dataset.imageViewer = 'true';
    viewer.innerHTML = `<img src="${e.target.src}" alt="${e.target.alt}" />`;
    
    viewer.addEventListener('click', () => {
      document.body.removeChild(viewer);
    });
    
    document.body.appendChild(viewer);
  }
};

// 获取笔记预览内容
const fetchNotePreview = async () => {
  loadingHtmlContent.value = true;
  try {
    const res = await getUserNotePreview(noteId);
    if (res.code !== 200) {
      throw new Error(res.msg || '获取笔记预览失败');
    }
    
    const previewData = res.data;
    
    // 如果是长笔记，开始轮询
    if (previewData.isLongNote) {
      isLongNote.value = true;
      pollLongNoteStatus();
      return;
    }
    
    // 更新笔记的 HTML 内容
    if (note.value) {
      note.value.htmlContent = previewData.html_content;
    } else {
      // 如果笔记数据还没加载，先存预览数据
      note.value = {
        htmlContent: previewData.html_content
      };
    }
    
    isLongNote.value = false;
    
    // 处理代码块和目录
    nextTick(() => {
      enhanceCodeBlocks();
      updateToc();
    });
  } catch (error) {
    console.error('获取笔记预览失败:', error.message || error);
    // 如果预览接口失败，仍然尝试加载笔记详情
  } finally {
    loadingHtmlContent.value = false;
  }
};

// 轮询长笔记状态
const pollLongNoteStatus = () => {
  const checkInterval = setInterval(async () => {
    try {
      const res = await getUserNotePreview(noteId);
      if (res.code === 200 && res.data && !res.data.isLongNote && res.data.html_content) {
        isLongNote.value = false;
        clearInterval(checkInterval);
        
        if (note.value) {
          note.value.htmlContent = res.data.html_content;
        } else {
          note.value = {
            htmlContent: res.data.html_content
          };
        }
        
        // 处理代码块和目录
        nextTick(() => {
          enhanceCodeBlocks();
          updateToc();
        });
      }
    } catch (error) {
      console.error('检查长笔记状态失败:', error);
      clearInterval(checkInterval);
    }
  }, 2000);
  
  // 60秒后停止轮询
  setTimeout(() => {
    clearInterval(checkInterval);
    if (isLongNote.value) {
      longNoteMessage.value = '笔记处理时间较长，请稍后刷新页面查看';
    }
  }, 60000);
};

// 获取笔记详情
const fetchNoteDetail = async () => {
  try {
    // 先获取笔记预览内容
    await fetchNotePreview();
    
    // 然后获取完整笔记详情
    const res = await getUserNoteDetail(noteId);
    if (res.code !== 200) {
      throw new Error(res.msg || '获取笔记详情失败');
    }
    
    const noteData = res.data;
    const normalizedNote = {
      ...noteData,
      view_count: noteData.view_count || noteData.views || 0,
      categories: noteData.categories || noteData.category_name || '',
      is_liked: noteData.is_liked || false,
      // 保留已经加载的HTML内容
      htmlContent: note.value?.htmlContent || noteData.htmlContent
    };

    note.value = normalizedNote;
    isLiked.value = normalizedNote.is_liked;
    likeIcon.value = normalizedNote.is_liked ? StarFilled : Star;
    
    // 加载封面图片
    if (normalizedNote.cover_image) {
      loadCoverImage(normalizedNote.cover_image)
    }

    // 增加浏览量
    increaseViewCount();

    // 如果HTML内容已经加载完成，处理代码块和目录
    if (!isLongNote.value && !loadingHtmlContent.value) {
      nextTick(() => {
        enhanceCodeBlocks();
        updateToc();
      });
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error.message || error);
    ElMessage.error(error.message || '获取笔记详情失败，请刷新重试');
  }
};

// 增加浏览量
const increaseViewCount = async () => {
  try {
    const response = await increaseNoteViewCount(noteId);
    if (response.data && response.data.code === 200 && note.value) {
      note.value.view_count = response.data.data.view_count;
    }
  } catch (error) {
    console.error('增加浏览量失败:', error);
  }
};

// 处理点赞
const handleLike = async () => {
  likeLoading.value = true;
  try {
    await likeNote(noteId, { type: 'like' });
    isLiked.value = !isLiked.value;
    likeIcon.value = isLiked.value ? StarFilled : Star;
    note.value.like_count = isLiked.value
      ? (note.value.like_count || 0) + 1
      : Math.max(0, (note.value.like_count || 0) - 1);
    ElMessage.success(isLiked.value ? '点赞成功' : '取消点赞成功');
  } catch (error) {
    console.error('点赞失败:', error);
    ElMessage.error('操作失败');
  } finally {
    likeLoading.value = false;
  }
};

// 处理分享
const handleShare = async () => {
  shareLoading.value = true;
  try {
    const shareLink = window.location.href;
    await navigator.clipboard.writeText(shareLink);
    ElMessage.success('分享链接已复制到剪贴板');
  } catch (error) {
    console.error('分享失败:', error);
    ElMessage.error('分享失败，请手动复制链接');
  } finally {
    shareLoading.value = false;
  }
};

// 处理举报
const handleReport = () => {
  ElMessageBox.prompt('请输入举报原因:', '举报笔记', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPattern: /^[\s\S]{10,}$/,
    inputErrorMessage: '举报原因至少10个字符'
  }).then(async ({ value }) => {
    reportLoading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success('举报已提交，感谢您的反馈');
    } catch (error) {
      console.error('举报失败:', error);
      ElMessage.error('举报失败');
    } finally {
      reportLoading.value = false;
    }
  }).catch(() => {
    ElMessage.info('已取消举报');
  });
};

// 获取评论列表
const fetchComments = async () => {
  try {
    const res = await getComments(noteId);
    comments.value = res.data || [];
  } catch (error) {
    console.error('获取评论失败:', error);
  }
};

// 提交评论
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }

  commentLoading.value = true;
  try {
    const res = await submitComment(noteId, {
      content: commentContent.value
    });
    comments.value.unshift(res.data);
    commentContent.value = '';
    ElMessage.success('评论成功');
  } catch (error) {
    console.error('评论失败:', error);
    ElMessage.error('评论失败');
  } finally {
    commentLoading.value = false;
  }
};

// 处理评论点赞
const handleCommentLike = async (comment) => {
  try {
    await likeComment(comment.id);
    comment.is_liked = !comment.is_liked;
    comment.like_count = comment.is_liked
      ? comment.like_count + 1
      : Math.max(0, comment.like_count - 1);
  } catch (error) {
    console.error('点赞失败:', error);
    ElMessage.error('操作失败');
  }
};

// 处理回复
const handleReply = (comment) => {
  replyingComment.value = comment;
  replyContent.value = '';
  setTimeout(() => {
    const replyInput = document.querySelector('.reply-input');
    if (replyInput) {
      replyInput.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};

// 取消回复
const cancelReply = () => {
  replyingComment.value = null;
  replyContent.value = '';
};

// 提交回复
const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }

  replyLoading.value = true;
  try {
    const res = await submitReply(replyingComment.value.id, {
      content: replyContent.value
    });
    const parentComment = comments.value.find(c => c.id === replyingComment.value.id);
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = [];
      }
      parentComment.replies.push(res.data);
    }
    cancelReply();
    ElMessage.success('回复成功');
  } catch (error) {
    console.error('回复失败:', error);
    ElMessage.error('回复失败');
  } finally {
    replyLoading.value = false;
  }
};

// 获取相关笔记
const fetchRelatedNotes = async () => {
  try {
    const res = await getRelatedNotes(noteId, { limit: 5 });
    relatedNotes.value = res.data || [];
  } catch (error) {
    console.error('获取相关笔记失败:', error);
  }
};

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// 页面加载时获取数据
onMounted(() => {
  fetchNoteDetail();
  fetchComments();
  fetchRelatedNotes();

  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('scroll', handleScroll);
  
  // 释放封面图片的临时URL
  if (coverImageRevoke) {
    coverImageRevoke();
    coverImageRevoke = null;
  }
  
  // 清理代码块事件
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.removeEventListener('click', handleCopyClick);
  });
  document.querySelectorAll('.code-toggle-btn').forEach(btn => {
    btn.removeEventListener('click', handleToggleClick);
  });
  document.querySelectorAll('.code-line-numbers-btn').forEach(btn => {
    btn.removeEventListener('click', handleLineNumbersClick);
  });
  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.removeEventListener('click', handleCodeTabClick);
  });
  
  // 清理图片查看器
  const viewer = document.querySelector('.image-viewer[data-image-viewer="true"]');
  if (viewer) {
    document.body.removeChild(viewer);
  }
});
</script>

<style scoped>
/* 长笔记提示样式 */
.long-note-tip {
  margin-bottom: 20px;
}

/* 确保Alert组件样式正常应用 */
:deep(.el-alert) {
  margin-bottom: 16px;
}

/* 封面图片样式 */
.note-cover {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-loading {
  color: #909399;
  font-size: 24px;
}

/* 原有样式保持不变 */
/* 主容器样式 */
.note-detail {
  position: relative;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

.note-container {
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 0 20px;
}

/* 目录侧边栏样式 */
.note-toc {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fafafa;
}

.toc-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.toc-toggle-btn {
  padding: 4px 8px;
  color: #999;
}

.toc-toggle-btn:hover {
  color: #409eff;
}

.toc-content {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 15px 20px;
  transition: all 0.3s ease;
}

.toc-collapsed .toc-content {
  display: none;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 8px;
  line-height: 1.4;
}

.toc-item a {
  display: block;
  padding: 4px 8px;
  border-radius: 4px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toc-item a:hover {
  background-color: #f0f0f0;
  color: #409eff;
}

.toc-active {
  background-color: #ecf5ff !important;
  color: #409eff !important;
  font-weight: 500;
}

.toc-level-2 {
  margin-left: 15px;
}

.toc-level-3 {
  margin-left: 30px;
}

/* 笔记内容样式 */
.note-content {
  flex: 1;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.note-header {
  padding: 30px 40px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.note-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  line-height: 1.4;
}

.note-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
}

.note-body {
  padding: 30px 40px;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

/* 笔记内容排版 */
.note-body h1,
.note-body h2,
.note-body h3 {
  margin-top: 40px;
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
  line-height: 1.5;
}

.note-body h1 {
  font-size: 24px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e8e8e8;
}

.note-body h2 {
  font-size: 22px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.note-body h3 {
  font-size: 20px;
}

.note-body p {
  margin-bottom: 20px;
  text-align: justify;
}

.note-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 20px auto;
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.note-image:hover {
  transform: scale(1.01);
}

.note-body blockquote {
  border-left: 4px solid #409eff;
  padding: 15px 20px;
  margin: 20px 0;
  background-color: #f8f9fa;
  color: #666;
  border-radius: 0 4px 4px 0;
}

.note-body ul,
.note-body ol {
  margin: 20px 0;
  padding-left: 30px;
}

.note-body li {
  margin-bottom: 10px;
}

.note-body a {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.note-body a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* CSDN风格代码块样式 */
.code-block-container {
  margin: 25px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

/* 代码块头部 */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9fafb;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.code-tabs {
  display: flex;
  gap: 2px;
}

.code-tab {
  padding: 4px 12px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
  background-color: #f3f4f6;
  margin-bottom: -1px;
}

.code-tab.active {
  background-color: #fff;
  color: #111827;
  border-top: 2px solid #3b82f6;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  font-weight: 500;
}

.code-tab:hover:not(.active) {
  background-color: #e5e7eb;
  color: #111827;
}

.code-info {
  flex: 1;
  text-align: center;
  color: #6b7280;
}

.code-language {
  font-weight: 500;
}

.code-actions {
  display: flex;
  gap: 5px;
}

.code-actions button {
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 13px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.code-actions button:hover {
  background-color: #e5e7eb;
  color: #3b82f6;
}

.code-icon {
  width: 16px;
  height: 16px;
}

/* 代码内容区域 */
.code-content {
  background-color: #1e293b; /* CSDN深色代码背景 */
  overflow-x: auto;
  max-height: 600px;
  transition: max-height 0.3s ease;
  position: relative;
}

.code-content.collapsed {
  max-height: 200px;
  position: relative;
}

.code-content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(to bottom, transparent, #1e293b);
  pointer-events: none;
}

.code-content pre {
  margin: 0;
  padding: 16px 16px 16px 60px; /* 为行号留出足够空间 */
  border-radius: 0;
  background-color: transparent;
  position: relative;
}

.code-content code {
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #e2e8f0; /* 代码文字颜色 */
  background-color: transparent;
  padding: 0;
}

/* 原始代码模式 */
.code-content code.raw-code {
  white-space: pre-wrap;
  background-color: #f8fafc;
  color: #1e293b;
  padding: 16px;
  border-radius: 4px;
}

/* 行号样式 */
.code-with-line-numbers {
  position: relative;
}

.line-numbers {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  padding: 16px 8px;
  background-color: #0f172a;
  border-right: 1px solid #334155;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  user-select: none;
  text-align: right;
  width: 45px;
  z-index: 15;
}

.line-numbers span {
  display: block;
}

/* 代码块底部 */
.code-footer {
  background-color: #f9fafb;
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.code-stats {
  font-size: 12px;
  color: #6b7280;
}

/* 复制提示 */
.copy-tooltip {
  position: absolute;
  top: -40px;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 25;
}

/* 复制按钮样式 */
.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  z-index: 20;
  transition: all 0.2s ease;
  opacity: 0;
}

.code-content:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: translateY(-1px);
}

/* 操作按钮样式 */
.note-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  border-top: 1px solid #e8e8e8;
  background-color: #fafafa;
}

.action-buttons,
.share-buttons {
  display: flex;
  gap: 15px;
}

.action-buttons .el-button,
.share-buttons .el-button {
  border-radius: 20px;
}

/* 评论区样式 */
.comment-section {
  margin-top: 30px;
  padding: 0 40px 40px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 25px;
  color: #333;
}

.comment-input {
  margin-bottom: 15px;
}

.comment-item {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: 500;
  color: #333;
}

.comment-time {
  color: #999;
  font-size: 13px;
}

.comment-text {
  margin-bottom: 15px;
  word-break: break-word;
  color: #333;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.comment-actions span {
  color: #999;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.comment-actions span:hover {
  background-color: #f0f0f0;
  color: #409eff;
}

/* 回复框样式 */
.reply-input {
  margin-top: 15px;
  margin-left: 63px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* 相关笔记样式 */
.related-notes {
  margin-top: 40px;
  padding: 0 40px 40px;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.related-card {
  transition: transform 0.2s ease;
}

.related-card:hover {
  transform: translateY(-5px);
}

.related-title {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.related-title:hover {
  color: #409eff;
}

/* 移动端样式 */
.mobile-toc-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #409eff;
  color: #fff;
  display: none;
}

/* 滚动到顶部按钮 */
.scroll-top-btn {
  position: fixed;
  bottom: 100px;
  right: 30px;
  z-index: 100;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: #fff;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  visibility: hidden;
  border: none;
}

.scroll-top-btn.visible {
  opacity: 1;
  visibility: visible;
}

.scroll-top-btn:hover {
  background-color: #409eff;
  color: #fff;
}

/* 目录切换箭头图标 */
.toggle-icon {
  display: inline-block;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid currentColor; /* 默认向左（展开状态） */
  transition: transform 0.3s ease;
}

/* 折叠时显示向右箭头 */
.toggle-icon.toc-collapsed-icon {
  border-left: none;
  border-right: 6px solid currentColor;
}

/* 图片查看器样式 */
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.image-viewer img {
  max-width: 95%;
  max-height: 95%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.3s ease;
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .note-container {
    flex-direction: column;
  }

  .note-toc {
    width: 100%;
    height: auto;
    position: relative;
    top: 0;
    margin-bottom: 20px;
  }

  .toc-content {
    max-height: 300px;
  }

  .mobile-toc-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .note-detail {
    padding: 10px 0;
  }

  .note-container {
    padding: 0 10px;
    gap: 15px;
  }

  .note-header {
    padding: 20px 20px 15px;
  }

  .note-title {
    font-size: 22px;
  }

  .note-meta {
    flex-wrap: wrap;
    gap: 10px;
  }

  .note-body {
    padding: 20px;
    font-size: 15px;
  }

  .note-actions {
    flex-direction: column;
    gap: 15px;
    padding: 20px;
  }

  .action-buttons,
  .share-buttons {
    justify-content: center;
    width: 100%;
  }

  .comment-section,
  .related-notes {
    padding: 0 20px 30px;
  }

  .comment-item {
    flex-direction: column;
  }

  .reply-input {
    margin-left: 0;
  }

  .code-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .code-info {
    order: 3;
    width: 100%;
    text-align: left;
  }

  .copy-tooltip {
    right: auto;
    left: 0;
  }
}

/* 主题选择器样式 */
.theme-selector {
  margin: 15px 0;
  display: flex;
  justify-content: flex-end;
}

.theme-selector .el-select {
  width: 180px;
}

/* 代码块样式 */
.note-body pre {
  position: relative;
  margin: 1.5em 0;
  background-color: #282c34;
  border-radius: 6px;
  overflow: hidden;
}

.note-body pre code {
  display: block;
  padding: 1rem 4rem 1rem 1rem;
  overflow-x: auto;
  color: #abb2bf;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  background-color: transparent !important;
}

/* 行号样式 */
.note-body pre .line-numbers {
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
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

/* 复制按钮样式 */
.note-body pre .copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.note-body pre .copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 代码折叠样式 */
.note-body .code-content.collapsed {
  max-height: 200px;
  overflow: hidden;
  position: relative;
}

.note-body .code-content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(to bottom, rgba(40, 44, 52, 0), rgba(40, 44, 52, 1));
}

/* 代码标签样式 */
.code-tabs {
  display: flex;
  gap: 10px;
  margin: 0 15px;
}

.code-tab {
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  color: #999;
}

.code-tab.active {
  background-color: #409eff;
  color: #fff;
}

/* 原始代码样式 */
.raw-code {
  background-color: #f6f8fa !important;
  color: #333 !important;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* 目录样式优化 */
.toc-item {
  position: relative;
}

.toc-item.toc-level-1 {
  font-weight: bold;
  margin-bottom: 8px;
}

.toc-item.toc-level-2 {
  margin-bottom: 5px;
}

.toc-item.toc-level-3 {
  margin-bottom: 3px;
  font-size: 0.9rem;
}

.toc-item a {
  display: block;
  padding: 4px 0;
  color: #666;
  text-decoration: none;
  transition: all 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-item a:hover {
  color: #409eff;
  padding-left: 4px;
}

.toc-item a.toc-active {
  color: #409eff;
  font-weight: 500;
}

.toc-item a.toc-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background-color: #409eff;
  border-radius: 3px;
}

/* 长笔记提示样式 */
.long-note-tip {
  margin-bottom: 20px;
}

:deep(.el-alert) {
  margin-bottom: 16px;
}
</style>
