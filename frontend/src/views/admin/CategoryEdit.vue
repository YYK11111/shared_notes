<template>
  <div class="admin-content">
    <div class="page-header">
      <h1>编辑分类</h1>
      <el-button @click="router.back()" type="default">返回</el-button>
    </div>
    
    <el-card class="edit-form-card">
      <el-form
        v-if="categoryDetail"
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
      
      <div v-else class="loading-state">
        <el-empty description="加载中..." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCategoryDetail, updateCategory, getCategoryList } from '@/api/category'

const router = useRouter()
const route = useRoute()
const categoryFormRef = ref(null)
const parentCategories = ref([])
const categoryDetail = ref(null)
const categoryId = ref(route.params.id)

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

// 获取分类详情
const fetchCategoryDetail = async () => {
  try {
    const response = await getCategoryDetail(categoryId.value)
    if (response.code === 200 && response.data) {
      categoryDetail.value = response.data
      
      // 填充表单数据
      categoryForm.name = response.data.name
      categoryForm.sort_order = response.data.sort_order || 0
      categoryForm.status = response.data.status || 1
      
      // 处理父分类数据
      if (response.data.parent_id && response.data.parent_id !== 0) {
        // 构建父分类路径
        await buildParentPath(response.data.parent_id)
      }
    } else {
      ElMessage.error(response.message || '获取分类详情失败')
      router.push('/admin/categories')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to fetch category detail:', error)
    router.push('/admin/categories')
  }
}

// 获取父分类列表
const fetchParentCategories = async () => {
  try {
    const response = await getCategoryList({ page: 1, pageSize: 1000, status: 1 })
    if (response.code === 200 && response.data) {
      // 排除当前编辑的分类及其子分类，避免循环引用
      const filteredCategories = filterOutCurrentCategoryAndChildren(response.data.list, categoryId.value)
      parentCategories.value = processCategoryData(filteredCategories)
    } else {
      ElMessage.error('获取分类列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请重试')
    console.error('Failed to fetch parent categories:', error)
  }
}

// 过滤掉当前分类及其子分类
const filterOutCurrentCategoryAndChildren = (categories, currentId) => {
  // 创建分类映射
  const categoryMap = new Map()
  const result = []
  
  // 先创建映射，深拷贝保留原始children
  categories.forEach(cat => {
    // 使用深拷贝避免修改原始数据
    const clonedCat = JSON.parse(JSON.stringify(cat))
    categoryMap.set(cat.id, clonedCat)
  })
  
  // 构建分类树
  categories.forEach(cat => {
    if (cat.id !== currentId) {
      // 检查父分类是否是当前分类
      if (cat.parent_id !== currentId) {
        result.push(categoryMap.get(cat.id))
      }
    }
  })
  
  return result
}

// 处理分类数据，构建级联选择器所需格式
const processCategoryData = (categories) => {
  // 使用深拷贝避免修改原始数据
  const clonedCategories = JSON.parse(JSON.stringify(categories))
  
  const categoryMap = new Map()
  const roots = []

  // 先创建所有分类节点，保留原始children结构
  clonedCategories.forEach(category => {
    categoryMap.set(category.id, category)
    // 确保children数组存在
    if (!Array.isArray(category.children)) {
      category.children = []
    }
  })

  // 构建分类树，确保每个节点都有正确的父子关系
  clonedCategories.forEach(category => {
    if (category.parent_id === 0 || !category.parent_id) {
      // 根节点直接加入结果
      if (!roots.some(root => root.id === category.id)) {
        roots.push(category)
      }
    } else {
      const parent = categoryMap.get(category.parent_id)
      if (parent && parent.children) {
        // 避免重复添加子节点
        if (!parent.children.some(child => child.id === category.id)) {
          parent.children.push(category)
        }
      }
    }
  })

  return roots
}

// 构建父分类路径
const buildParentPath = async (parentId) => {
  try {
    const response = await getCategoryDetail(parentId)
    if (response.code === 200 && response.data) {
      const path = [response.data.id]
      // 如果父分类还有父分类，继续向上构建路径
      if (response.data.parent_id && response.data.parent_id !== 0) {
        const parentPath = await buildParentPathRecursive(response.data.parent_id)
        categoryForm.parent_id = [...parentPath, response.data.id]
      } else {
        // 暂时只设置直接父分类，简化实现
        categoryForm.parent_id = path
      }
    }
  } catch (error) {
    console.error('Failed to build parent path:', error)
  }
}

// 递归构建父分类路径
const buildParentPathRecursive = async (parentId) => {
  try {
    const response = await getCategoryDetail(parentId)
    if (response.code === 200 && response.data) {
      if (response.data.parent_id && response.data.parent_id !== 0) {
        const parentPath = await buildParentPathRecursive(response.data.parent_id)
        return [...parentPath, response.data.id]
      } else {
        return [response.data.id]
      }
    }
    return []
  } catch (error) {
    console.error('Failed to build parent path recursively:', error)
    return []
  }
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
    
    const response = await updateCategory(categoryId.value, submitData)
    
    if (response.code === 200) {
      ElMessage.success('分类更新成功')
      router.push('/admin/categories')
    } else {
      ElMessage.error(response.message || '分类更新失败')
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

// 组件挂载时获取数据
onMounted(async () => {
  await fetchCategoryDetail()
  await fetchParentCategories()
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

.edit-form-card {
  max-width: 600px;
}

.loading-state {
  padding: 40px 0;
  text-align: center;
}
</style>