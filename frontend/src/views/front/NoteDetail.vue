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
            <h1 class="note-title">{{ note.title }}</h1>
            <div class="note-meta">
              <span>{{ note.categories }}</span>
              <span>{{ formatDate(note.created_at) }}</span>
              <span>{{ note.view_count || 0 }} 浏览</span>
              <span>{{ note.like_count || 0 }} 喜欢</span>
            </div>
          </div>
        </template>

        <!-- 笔记内容 -->
        <div class="note-body" v-html="renderedContent" @click="handleImageClick"></div>

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
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getUserNoteDetail, likeNote, getComments, submitComment, likeComment, submitReply, getRelatedNotes } from '@/api/user'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, StarFilled, Share, Warning, CopyDocument, Check, List, Menu, ArrowDown, ArrowRight, Close } from '@element-plus/icons-vue'
import axios from 'axios'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark-dimmed.css' // 使用更接近CSDN的深色主题

// 路由
const route = useRoute()
const noteId = route.params.id

// 笔记数据
const note = ref(null)
const comments = ref([])
const relatedNotes = ref([])

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
        
        // CSDN风格代码块结构
        return `<div class="code-block-container">
          <div class="code-header">
            <div class="code-tabs">
              <div class="code-tab active">代码</div>
              <div class="code-tab">原始</div>
            </div>
            <div class="code-info">
              <span class="code-language">${lang}</span>
            </div>
            <div class="code-actions">
              <button class="code-line-numbers-btn" data-target="${codeId}" title="显示/隐藏行号">
                <el-icon><List /></el-icon>
              </button>
              <button class="code-toggle-btn" data-target="${codeId}" title="折叠/展开代码">
                <ArrowDown class="code-icon" />
              </button>
              <button class="code-copy-btn" data-target="${codeId}" title="复制代码">
                <CopyDocument class="code-icon" />
              </button>
            </div>
          </div>
          <div class="code-content" id="${codeId}">
            <pre><code${attrs}>${code}</code></pre>
          </div>
          <div class="code-footer">
            <span class="code-stats">${code.split('\n').filter(line => line.trim() !== '').length} 行</span>
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
          <div class="code-tabs">
            <div class="code-tab active">代码</div>
            <div class="code-tab">原始</div>
          </div>
          <div class="code-info">
            <span class="code-language">${lang}</span>
          </div>
          <div class="code-actions">
            <button class="code-line-numbers-btn" data-target="${codeId}" title="显示/隐藏行号">
              <el-icon><List /></el-icon>
            </button>
            <button class="code-toggle-btn" data-target="${codeId}" title="折叠/展开代码">
                <ArrowDown class="code-icon" />
              </button>
            <button class="code-copy-btn" data-target="${codeId}" title="复制代码">
              <CopyDocument class="code-icon" />
            </button>
          </div>
        </div>
        <div class="code-content" id="${codeId}">
          <pre><code class="${langClass}">${escapedCode}</code></pre>
        </div>
        <div class="code-footer">
          <span class="code-stats">${code.split('\n').filter(line => line.trim() !== '').length} 行</span>
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

// 代码块事件处理函数
const handleCopyClick = (e) => {
  const btn = e.currentTarget;
  const codeId = btn.getAttribute('data-target');
  const codeBlock = document.getElementById(codeId);
  if (!codeBlock) return;
  
  const code = codeBlock.querySelector('code').textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<Check class="code-icon" />';
    
    setTimeout(() => {
      btn.innerHTML = originalIcon;
    }, 2000);
    
    // 显示复制成功提示
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = '复制成功';
    btn.appendChild(tooltip);
    
    setTimeout(() => {
      tooltip.remove();
    }, 1500);
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
};

const handleToggleClick = (e) => {
  const btn = e.currentTarget;
  const codeId = btn.getAttribute('data-target');
  const codeBlock = document.getElementById(codeId);
  if (!codeBlock) return;
  
  const isExpanded = !codeBlock.classList.contains('collapsed');
  
  if (isExpanded) {
    codeBlock.classList.add('collapsed');
    btn.innerHTML = '<ArrowRight class="code-icon" />';
  } else {
    codeBlock.classList.remove('collapsed');
    btn.innerHTML = '<ArrowDown class="code-icon" />';
  }
};

const handleLineNumbersClick = (e) => {
  const btn = e.currentTarget;
  const codeId = btn.getAttribute('data-target');
  const codeBlock = document.getElementById(codeId);
  if (!codeBlock) return;
  
  const preElement = codeBlock.querySelector('pre');
  const lineNumbers = codeBlock.querySelector('.line-numbers');
  
  if (lineNumbers) {
    if (lineNumbers.style.display === 'none') {
      lineNumbers.style.display = 'block';
      preElement.style.paddingLeft = '50px';
    } else {
      lineNumbers.style.display = 'none';
      preElement.style.paddingLeft = '1rem';
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

// 处理代码高亮、行号显示、复制功能等
const enhanceCodeBlocks = () => {
  nextTick(() => {
    // 先解绑所有旧事件
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
    
    // 对每个代码块应用语法高亮
    document.querySelectorAll('pre code').forEach((block) => {
      // 仅对非原始模式的代码块应用高亮
      if (!block.classList.contains('raw-code')) {
        hljs.highlightElement(block);
      }
      
      // 添加行号
      const preElement = block.parentElement;
      let lineNumbers = preElement.querySelector('.line-numbers');
      
      // 如果还没有行号容器，则创建
      if (!lineNumbers) {
        const code = block.textContent;
        const lines = code.split('\n').filter(line => line.trim() !== '').length;
        lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';
        
        for (let i = 1; i <= lines; i++) {
          const line = document.createElement('span');
          line.textContent = i;
          lineNumbers.appendChild(line);
        }
        
        preElement.appendChild(lineNumbers);
        preElement.classList.add('code-with-line-numbers');
        preElement.style.paddingLeft = '50px';
      }
    });
    
    // 绑定新事件
    document.querySelectorAll('.code-copy-btn').forEach(btn => {
      btn.addEventListener('click', handleCopyClick);
    });
    document.querySelectorAll('.code-toggle-btn').forEach(btn => {
      btn.addEventListener('click', handleToggleClick);
    });
    document.querySelectorAll('.code-line-numbers-btn').forEach(btn => {
      btn.addEventListener('click', handleLineNumbersClick);
    });
    document.querySelectorAll('.code-tab').forEach(tab => {
      tab.addEventListener('click', handleCodeTabClick);
    });
  });
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
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// 获取笔记详情
const fetchNoteDetail = async () => {
  try {
    const res = await getUserNoteDetail(noteId);
    if (res.code !== 200) {
      throw new Error(res.msg || '获取笔记详情失败');
    }
    
    const noteData = res.data;
    const normalizedNote = {
      ...noteData,
      view_count: noteData.view_count || noteData.views || 0,
      categories: noteData.categories || noteData.category_name || '',
      is_liked: noteData.is_liked || false
    };

    note.value = normalizedNote;
    isLiked.value = normalizedNote.is_liked;
    likeIcon.value = normalizedNote.is_liked ? StarFilled : Star;

    // 增加浏览量
    increaseViewCount();

    // 处理代码块
    nextTick(() => {
      enhanceCodeBlocks();
      updateToc();
    });
  } catch (error) {
    console.error('获取笔记详情失败:', error.message || error);
    ElMessage.error(error.message || '获取笔记详情失败，请刷新重试');
  }
};

// 增加浏览量
const increaseViewCount = async () => {
  try {
    const response = await axios.post(`/user/notes/${noteId}/view`);
    if (response.data && response.data.code === 200 && note.value) {
      note.value.view_count += 1;
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
/* 主容器样式 */
.note-detail {
  position: relative;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

.note-container {
  max-width: 1200px;
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
  padding: 16px;
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
  width: 35px;
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
  z-index: 10;
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
</style>
