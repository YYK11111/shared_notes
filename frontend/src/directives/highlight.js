import hljs from 'highlight.js';
import Clipboard from 'clipboard';
import 'highlight.js/styles/github-dark.css';

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
const initCopy功能 = (el) => {
  const copyButtons = el.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    const clipboard = new Clipboard(btn, {
      text: () => btn.nextElementSibling.textContent
    });
    
    clipboard.on('success', () => {
      btn.textContent = '✓ 已复制';
      setTimeout(() => { btn.textContent = '📋 复制'; }, 2000);
    });
  });
};

export default {
  mounted(el) {
    const blocks = el.querySelectorAll('pre code');
    
    blocks.forEach(block => {
      // 高亮代码
      hljs.highlightElement(block);
      
      // 获取原始代码
      const code = block.textContent;
      
      // 创建行号
      const lineNumbers = createLineNumbers(code);
      
      // 创建复制按钮
      const copyBtn = '<button class="copy-btn">📋 复制</button>';
      
      // 重构代码块结构
      const pre = block.parentElement;
      pre.classList.add('code-block-wrapper');
      pre.innerHTML = `${copyBtn}${lineNumbers}<code class="${block.className}">${block.innerHTML}</code>`;
    });
    
    // 初始化复制功能
    initCopy功能(el);
  },
  updated(el) {
    // 内容更新时重新处理
    this.mounted(el);
  }
};