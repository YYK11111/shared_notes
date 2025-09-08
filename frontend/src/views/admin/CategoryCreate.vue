<template>
  <div class="admin-content">
    <div class="page-header">
      <h1>创建分类</h1>
      <el-button @click="router.back()" type="default">返回</el-button>
    </div>
    
    <el-card class="create-form-card">
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="formRules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="父分类" prop="parent_id">
          <el-cascader
            v-model="categoryForm.parent_id"
            :options="parentCategories"
            :props="cascaderProps"
            placeholder="请选择父分类"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="排序号" prop="sort_order">
          <el-input-number
            v-model="categoryForm.sort_order"
            :min="0"
            :max="9999"
            placeholder="请输入排序号"
          />
        </el-form-item>
        
        <el-form-item label="分类状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createCategory, getCategoryList } from '@/api/category'

const router = useRouter()
const categoryFormRef = ref(null)
const parentCategories = ref([])

// 表单数据
const categoryForm = reactive({
  name: '',
  parent_id: undefined,
  sort_order: 0,
  status: 1
})

// 级联选择器配置 - 支持选择任意一级选项
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true // 支持选择任意一级选项
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 获取父分类列表
const fetchParentCategories = async () => {
  try {
    const response = await getCategoryList({ page: 1, pageSize: 1000, status: 1 })
    if (response.code === 200 && response.data) {
      parentCategories.value = processCategoryData(response.data.list)
    } else {
      ElMessage.error('获取分类列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to fetch parent categories:', error)
  }
}

// 处理分类数据，构建级联选择器所需格式
const processCategoryData = (categories) => {
  const categoryMap = new Map()
  const roots = []

  // 先创建所有分类节点的映射，保留原始的children结构
  categories.forEach(category => {
    // 深拷贝以避免修改原始数据
    const node = { ...category }
    categoryMap.set(category.id, node)
  })

  // 构建分类树
  categories.forEach(category => {
    const node = categoryMap.get(category.id)
    if (category.parent_id === 0 || !category.parent_id) {
      // 根节点直接添加到结果中
      roots.push(node)
    } else {
      // 子节点添加到父节点的children数组中
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        // 避免重复添加
        if (!parent.children.some(child => child.id === node.id)) {
          parent.children.push(node)
        }
      }
    }
  })

  return roots
}

// 提交表单
const handleSubmit = async () => {
  try {
    await categoryFormRef.value.validate()
    
    // 处理父分类ID - 支持选择任意一级
    const submitData = {
      ...categoryForm,
      parent_id: categoryForm.parent_id ? (Array.isArray(categoryForm.parent_id) ? categoryForm.parent_id[categoryForm.parent_id.length - 1] : categoryForm.parent_id) : 0
    }
    
    const response = await createCategory(submitData)
    
    if (response.code === 200) {
      ElMessage.success('分类创建成功')
      router.push('/admin/categories')
    } else {
      ElMessage.error(response.message || '分类创建失败')
    }
  } catch (error) {
    if (error.name === 'Error') {
      ElMessage.error(error.message)
    } else {
      console.error('Form validation failed:', error)
    }
  }
}

// 取消操作
const handleCancel = () => {
  router.back()
}

// 组件挂载时获取父分类列表
onMounted(() => {
  fetchParentCategories()
})
</script>

<style scoped>
.admin-content {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-form-card {
  max-width: 600px;
}
</style>