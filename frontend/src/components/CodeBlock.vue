<template>
  <div class="code-container">
    <div class="code-header">
      <div class="code-info">
        <span class="code-language">{{ language || 'plaintext' }}</span>
      </div>
    </div>
    <div class="code-content">
      <pre ref="preElement" class="code-pre">
        <code class="code-code" v-html="highlightedCode"></code>
      </pre>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import hljs from 'highlight.js'

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript'
  }
})

const preElement = ref(null)

// 计算高亮后的代码
const highlightedCode = computed(() => {
  try {
    if (hljs.getLanguage(props.language)) {
      return hljs.highlight(props.code, { language: props.language }).value
    } else {
      return hljs.highlightAuto(props.code).value
    }
  } catch (error) {
    console.warn('代码高亮失败:', error)
    return props.code
  }
})
</script>

<style scoped>
.code-container {
  margin: 1rem 0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e4e8;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f6f8fa;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e1e4e8;
  font-size: 0.8rem;
}

.code-info {
  display: flex;
  align-items: center;
}

.code-language {
  color: #656d76;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.code-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.code-actions button {
  background: transparent;
  border: none;
  color: #656d76;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-actions button:hover {
  background-color: #e1e4e8;
  color: #24292e;
}

.code-actions button.code-copy-btn.copied {
  color: #28a745;
}

.code-actions button.code-copy-btn.copied:hover {
  background-color: #e6f3ea;
  color: #28a745;
}

.copy-tooltip {
  position: absolute;
  top: -2rem;
  right: 0;
  background-color: #333;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 1000;
}

.code-content {
  display: flex;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.code-content.collapsed {
  max-height: 6rem;
  overflow: hidden;
  position: relative;
}

.code-content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3rem;
  background: linear-gradient(to top, #fafafa, transparent);
}

.code-pre {
  background-color: #fafafa;
  padding: 1rem;
  margin: 0;
  border: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  flex: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-pre.show-line-numbers {
  padding-left: 0;
}

.code-code {
  background-color: transparent;
  padding: 0;
  font-size: inherit;
}

.line-numbers {
  background-color: #f6f8fa;
  padding: 1rem 0.5rem;
  border-right: 1px solid #e1e4e8;
  text-align: right;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #656d76;
  user-select: none;
  min-width: 2rem;
}

.line-numbers span {
  display: block;
}

.code-footer {
  background-color: #f6f8fa;
  padding: 0.5rem 1rem;
  border-top: 1px solid #e1e4e8;
  font-size: 0.8rem;
  color: #656d76;
}

.code-stats {
  font-weight: 500;
}
</style>