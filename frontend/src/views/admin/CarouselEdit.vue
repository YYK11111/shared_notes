<template>
  <div class="carousel-content">
    <div class="page-header">
      <h1>{{ isEdit ? '编辑轮播图' : '创建轮播图' }}</h1>
      <el-button @click="router.back()" type="default">返回</el-button>
    </div>
    
    <el-card class="edit-form-card">
      <el-form
        ref="carouselFormRef"
        :model="carouselForm"
        :rules="formRules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="carouselForm.title"
            placeholder="请输入轮播图标题"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="链接" prop="link_url">
          <el-input
            v-model="carouselForm.link_url"
            placeholder="请输入点击轮播图跳转的链接"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort_order">
          <el-input-number
            v-model="carouselForm.sort_order"
            :min="0"
            :max="9999"
            placeholder="数字越小，排序越靠前"
            controls-position="right"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="carouselForm.status"
            active-value="1"
            inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="展示位置" prop="position">
          <el-select
            v-model="carouselForm.position"
            placeholder="请选择轮播图展示位置"
            clearable
          >
            <el-option label="首页" value="home_top" />
            <el-option label="分类" value="category_page" />
            <el-option label="笔记" value="note_page" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="carouselForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY年MM月DD日 HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="carouselForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY年MM月DD日 HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="图片上传" prop="file_id">
          <div class="upload-container">
            <div class="upload-tip">
              <el-alert
                title="提示：为保证显示效果，建议上传宽高比约为16:4（或8:2）的图片（例如1200×300像素）"
                type="info"
                show-icon
                :closable="false"
                style="margin-bottom: 10px;"
              />
            </div>
            <el-upload
              v-model:file-list="fileList"
              class="avatar-uploader"
              :before-upload="beforeUpload"
              accept="image/*"
              :auto-upload="true"
            >
              <el-button :loading="uploading" type="primary">
                <el-icon v-if="uploading"><Loading /></el-icon>
                <span v-if="!uploading">选择图片</span>
              </el-button>
            </el-upload>
            <div v-if="imageSrc" class="preview-image-container">
              <el-image
                :src="imageSrc"
                :preview-src-list="[imageSrc]"
                fit="cover"
                style="width: 300px; height: 150px;"
              />
              <el-button 
                type="text" 
                @click.stop="removeImage"
                class="remove-image-btn"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="carouselForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
            clearable
          />
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { Loading, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getCarouselDetail, 
  createCarousel, 
  updateCarousel 
} from '@/api/carousel'
import { uploadCarouselImage, getFileObjectUrl } from '@/api/file'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const carouselFormRef = ref()

// 判断是否为编辑模式
const isEdit = computed(() => !!route.params.id)

// 表单数据
const carouselForm = reactive({
  title: '',
  link_url: '',
  file_id: '', // 改为file_id
  sort_order: 0,
  status: '1',
  start_time: '',
  end_time: '',
  remark: '',
  position: 'home_top'
})

// 上传相关
const uploading = ref(false)
const fileList = ref([])
const imageSrc = ref('') // 用于预览图片的URL
let imageRevoke = null

// 表单验证规则
const formRules = reactive({
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' },
    { max: 50, message: '标题不能超过50个字符', trigger: 'blur' }
  ],
  link_url: [
    { max: 255, message: '链接不能超过255个字符', trigger: 'blur' }
  ],
  file_id: [
    { required: true, message: '请上传轮播图', trigger: 'change' }
  ]
})

// 获取轮播图详情
const fetchCarouselDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const res = await getCarouselDetail(route.params.id)
    if (res.code === 200) {
      const data = res.data
      carouselForm.title = data.title || ''
      carouselForm.link_url = data.link_url || ''
      carouselForm.file_id = data.file_id || ''
      carouselForm.sort_order = data.sort || 0
      carouselForm.status = data.status ? '1' : '0'
      carouselForm.start_time = data.start_time || ''
      carouselForm.end_time = data.end_time || ''
      carouselForm.remark = data.remark || ''
      carouselForm.position = data.position || 'home_top'
      
      // 如果有file_id，获取图片数据用于预览
      if (carouselForm.file_id) {
        try {
          // 先释放可能存在的旧URL
          if (imageRevoke) {
            imageRevoke();
          }
          const { url, revoke } = await getFileObjectUrl(carouselForm.file_id)
          imageSrc.value = url
          imageRevoke = revoke
        } catch (error) {
          console.error('获取图片预览失败:', error)
        }
      }
    } else {
      ElMessage.error(res.msg || '获取轮播图详情失败')
      router.back()
    }
  } catch (error) {
    console.error('获取轮播图详情失败:', error)
    ElMessage.error('获取轮播图详情失败')
    router.back()
  }
}

// 图片上传前校验
const beforeUpload = async (file) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  uploading.value = true
  try {
    // 调用统一的文件上传接口
    const response = await uploadCarouselImage(file)
    uploading.value = false
    
    if (response.code === 200) {
      carouselForm.file_id = response.data.fileId
      // 获取图片数据用于预览
      // 先释放可能存在的旧URL
      if (imageRevoke) {
        imageRevoke();
      }
      const { url, revoke } = await getFileObjectUrl(carouselForm.file_id)
      imageSrc.value = url
      imageRevoke = revoke
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(response.msg || '图片上传失败')
    }
  } catch (error) {
    uploading.value = false
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败，请重试')
  }
  
  return false // 阻止默认上传行为
}

// 移除图片
const removeImage = () => {
  carouselForm.file_id = ''
  imageSrc.value = ''
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    await carouselFormRef.value.validate()
    
    // 准备提交数据 - 添加日期格式转换
    const formatDateTime = (dateTime) => {
      if (!dateTime) return null
      // 确保日期时间格式符合MySQL的datetime类型要求
      // 如果是ISO格式字符串，需要转换为YYYY-MM-DD HH:mm:ss格式
      if (typeof dateTime === 'string' && dateTime.includes('T') && dateTime.includes('Z')) {
        const date = new Date(dateTime)
        return date.toISOString().replace('T', ' ').slice(0, 19)
      }
      return dateTime
    }
    
    const submitData = {
      name: carouselForm.title, // 后端需要name字段，使用title的值
      title: carouselForm.title,
      link_url: carouselForm.link_url,
      file_id: carouselForm.file_id, // 使用file_id替代image_url
      sort: carouselForm.sort_order,
      status: parseInt(carouselForm.status),
      start_time: formatDateTime(carouselForm.start_time),
      end_time: formatDateTime(carouselForm.end_time),
      remark: carouselForm.remark,
      position: carouselForm.position
    }
    
    // 发送请求
    let res
    if (isEdit.value) {
      res = await updateCarousel(route.params.id, submitData)
    } else {
      res = await createCarousel(submitData)
    }
    
    // 处理响应
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '轮播图更新成功' : '轮播图创建成功')
      router.push('/admin/carousels')
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '轮播图更新失败' : '轮播图创建失败'))
    }
  } catch (error) {
    console.error(isEdit.value ? '更新轮播图失败:' : '创建轮播图失败:', error)
    if (error.name !== 'Error' || !error._normalized) {
      // 非表单验证错误
      ElMessage.error(isEdit.value ? '轮播图更新失败' : '轮播图创建失败')
    }
  }
}

// 取消操作
const handleCancel = () => {
  router.back()
}

// 组件挂载时获取数据
onMounted(() => {
  if (isEdit.value) {
    fetchCarouselDetail()
  }
})

// 清理：组件卸载时释放资源
onUnmounted(() => {
  // 释放图片临时URL
  if (imageRevoke) {
    imageRevoke();
    imageRevoke = null;
  }
})
</script>

<style scoped>
.carousel-content {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-form-card {
  max-width: 800px;
}

.upload-container {
  position: relative;
}

.preview-image-container {
  margin-top: 10px;
  position: relative;
  display: inline-block;
}

.remove-image-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 4px;
}

.remove-image-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
}
</style>