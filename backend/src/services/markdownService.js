const { marked } = require('marked');
const crypto = require('crypto');
const xss = require('xss');

class MarkdownService {
  constructor() {
    // 配置marked，启用更多扩展语法支持
    marked.setOptions({
      breaks: true, // 转换换行符为<br>
      gfm: true, // 启用GitHub风格的Markdown
      smartLists: true,
      smartypants: true,
      langPrefix: 'language-', // 为代码块添加语言前缀，便于前端高亮
      tables: true, // 启用表格支持
      taskLists: true, // 启用任务列表支持
      mangle: false, // 不混淆电子邮件地址
      headerIds: true, // 为标题添加id属性
    });

    // 创建Markdown转换缓存
    this.markdownCache = new Map();
    this.CACHE_EXPIRY = 3600000; // 缓存过期时间：1小时
    this.MAX_CACHE_SIZE = 100; // 最大缓存条目数
    this.LONG_NOTE_THRESHOLD = 10000; // 长笔记阈值：10000字符

    // 定期清理缓存（每10分钟）
    this.startCacheCleanup();
  }

  /**
   * 启动定期清理缓存的定时器
   */
  startCacheCleanup() {
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  /**
   * 清理过期缓存
   */
  cleanupCache() {
    const now = Date.now();
    let size = this.markdownCache.size;
    
    // 按插入顺序遍历缓存条目
    for (const [key, { timestamp }] of this.markdownCache.entries()) {
      // 删除过期条目
      if (now - timestamp > this.CACHE_EXPIRY) {
        this.markdownCache.delete(key);
      }
      // 如果缓存大小仍然超过限制，删除最早的条目
      else if (size > this.MAX_CACHE_SIZE) {
        this.markdownCache.delete(key);
        size--;
      } else {
        break;
      }
    }
  }

  /**
   * 生成缓存键
   * @param {string} content - Markdown内容
   * @returns {string} 缓存键
   */
  generateCacheKey(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 利用marked库的Markdown转HTML函数 - 带缓存
   * @param {string} markdown - Markdown内容
   * @returns {string} 转换后的HTML内容
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 生成缓存键
    const cacheKey = this.generateCacheKey(markdown);
    
    // 检查缓存
    const cached = this.markdownCache.get(cacheKey);
    if (cached) {
      // 更新缓存时间戳
      this.markdownCache.set(cacheKey, {
        html: cached.html,
        timestamp: Date.now()
      });
      return cached.html;
    }
    
    // 使用xss库净化HTML，防止XSS攻击
    const html = xss(marked.parse(markdown));
    
    // 存储到缓存
    this.markdownCache.set(cacheKey, {
      html,
      timestamp: Date.now()
    });
    
    // 如果缓存过大，清理过期缓存
    if (this.markdownCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
    
    return html;
  }

  /**
   * 异步处理长笔记的Markdown转换
   * @param {string} markdown - Markdown内容
   * @returns {Promise<string>} 转换后的HTML内容
   */
  asyncMarkdownToHtml(markdown) {
    return new Promise((resolve, reject) => {
      try {
        // 使用setImmediate将处理放入下一个事件循环
        setImmediate(() => {
          try {
            const html = xss(marked.parse(markdown));
            resolve(html);
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取笔记的HTML预览
   * @param {string} markdown - Markdown内容
   * @param {boolean} isLongNote - 是否为长笔记
   * @returns {Promise<string>} 转换后的HTML内容
   */
  async getNoteHtmlPreview(markdown, isLongNote = false) {
    if (!markdown) return '';
    
    // 根据笔记长度选择不同的处理方式
    if (isLongNote || markdown.length > this.LONG_NOTE_THRESHOLD) {
      return this.asyncMarkdownToHtml(markdown);
    } else {
      return this.markdownToHtml(markdown);
    }
  }
}

module.exports = new MarkdownService();