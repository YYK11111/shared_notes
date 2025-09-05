<template>
  <div class="form-validator">
    <slot :validate="validate" :reset="reset" :errors="errors" />
    
    <!-- 错误提示区域 -->
    <div v-if="showSummary && Object.keys(errors).length > 0" class="error-summary">
      <h4 class="error-summary-title">请修复以下问题：</h4>
      <ul class="error-summary-list">
        <li v-for="(error, field) in errors" :key="field" class="error-summary-item">
          <span class="error-field-name">{{ getFieldName(field) }}：</span>
          <span class="error-message">{{ error }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, defineProps, defineEmits } from 'vue'

// 定义组件属性
const props = defineProps({
  // 验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 表单数据
  model: {
    type: Object,
    default: () => ({})
  },
  // 字段名称映射
  fieldNames: {
    type: Object,
    default: () => ({})
  },
  // 是否显示错误摘要
  showSummary: {
    type: Boolean,
    default: false
  },
  // 是否在输入时验证
  validateOnInput: {
    type: Boolean,
    default: true
  },
  // 是否在失去焦点时验证
  validateOnBlur: {
    type: Boolean,
    default: true
  }
})

// 定义组件事件
const emit = defineEmits(['validate', 'valid', 'invalid'])

// 错误信息
const errors = reactive({})

// 验证状态
const isValid = ref(true)

// 获取字段显示名称
const getFieldName = (field) => {
  return props.fieldNames[field] || field
}

// 验证单个字段
const validateField = (field, value, rules) => {
  // 清除该字段的错误
  delete errors[field]
  
  // 如果没有规则，直接返回true
  if (!rules || !rules.length) {
    return true
  }
  
  // 遍历规则进行验证
  for (const rule of rules) {
    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = rule.message || `${getFieldName(field)}不能为空`
      return false
    }
    
    // 如果值为空，且不是必填，则跳过后续验证
    if ((value === undefined || value === null || value === '') && !rule.required) {
      continue
    }
    
    // 类型验证
    if (rule.type) {
      let isValidType = true
      switch (rule.type) {
        case 'string':
          isValidType = typeof value === 'string'
          break
        case 'number':
          isValidType = typeof value === 'number' && !isNaN(value)
          break
        case 'boolean':
          isValidType = typeof value === 'boolean'
          break
        case 'array':
          isValidType = Array.isArray(value)
          break
        case 'object':
          isValidType = typeof value === 'object' && value !== null && !Array.isArray(value)
          break
        case 'date':
          isValidType = !isNaN(Date.parse(value))
          break
        case 'email':
          isValidType = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          break
        case 'url':
          isValidType = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value)
          break
        case 'phone':
          isValidType = /^1[3-9]\d{9}$/.test(value)
          break
        default:
          isValidType = true
      }
      
      if (!isValidType) {
        errors[field] = rule.message || `${getFieldName(field)}格式不正确`
        return false
      }
    }
    
    // 长度验证
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors[field] = rule.message || `${getFieldName(field)}长度不能少于${rule.minLength}个字符`
      return false
    }
    
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors[field] = rule.message || `${getFieldName(field)}长度不能超过${rule.maxLength}个字符`
      return false
    }
    
    // 数值范围验证
    if (rule.min !== undefined && value < rule.min) {
      errors[field] = rule.message || `${getFieldName(field)}不能小于${rule.min}`
      return false
    }
    
    if (rule.max !== undefined && value > rule.max) {
      errors[field] = rule.message || `${getFieldName(field)}不能大于${rule.max}`
      return false
    }
    
    // 正则表达式验证
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${getFieldName(field)}格式不正确`
      return false
    }
    
    // 自定义验证函数
    if (rule.validator && typeof rule.validator === 'function') {
      const result = rule.validator(value, props.model)
      if (result === false || (typeof result === 'string')) {
        errors[field] = result === false ? rule.message || `${getFieldName(field)}验证失败` : result
        return false
      }
    }
    
    // 枚举验证
    if (rule.enum && Array.isArray(rule.enum) && !rule.enum.includes(value)) {
      errors[field] = rule.message || `${getFieldName(field)}必须是${rule.enum.join('、')}中的一个`
      return false
    }
    
    // 相等验证
    if (rule.equalTo && value !== props.model[rule.equalTo]) {
      errors[field] = rule.message || `${getFieldName(field)}与${getFieldName(rule.equalTo)}不一致`
      return false
    }
  }
  
  return true
}

// 验证所有字段
const validate = (fields = null) => {
  // 重置错误
  Object.keys(errors).forEach(key => delete errors[key])
  
  // 确定要验证的字段
  const fieldsToValidate = fields && Array.isArray(fields) ? fields : Object.keys(props.rules)
  
  // 验证每个字段
  let valid = true
  for (const field of fieldsToValidate) {
    if (props.rules[field]) {
      const fieldValid = validateField(field, props.model[field], props.rules[field])
      valid = valid && fieldValid
    }
  }
  
  // 更新验证状态
  isValid.value = valid
  
  // 触发事件
  emit('validate', valid, errors)
  if (valid) {
    emit('valid')
  } else {
    emit('invalid', errors)
  }
  
  return valid
}

// 重置验证
const reset = () => {
  Object.keys(errors).forEach(key => delete errors[key])
  isValid.value = true
}

// 监听模型变化，实现输入时验证
if (props.validateOnInput) {
  // 注意：在实际使用时，可能需要更复杂的监听逻辑
}

// 暴露方法给父组件
defineExpose({
  validate,
  reset,
  validateField,
  errors,
  isValid
})
</script>

<style scoped>
.form-validator {
  position: relative;
}

.error-summary {
  margin-top: 16px;
  padding: 16px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
}

.error-summary-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
}

.error-summary-list {
  margin: 0;
  padding-left: 20px;
}

.error-summary-item {
  margin-bottom: 8px;
  font-size: 13px;
  color: #f56c6c;
  line-height: 1.5;
}

.error-summary-item:last-child {
  margin-bottom: 0;
}

.error-field-name {
  font-weight: 500;
}

.error-message {
  color: #f56c6c;
}
</style>