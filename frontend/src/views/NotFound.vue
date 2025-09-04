<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">页面不存在</div>
      <p class="error-description">
        抱歉，您访问的页面不存在或者已被删除。
      </p>
      <el-button type="primary" @click="goHome">
        <el-icon><House /></el-icon>
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 返回首页
const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.not-found-content {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 20px;
  line-height: 1;
}

.error-message {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.error-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.6;
}

.el-button {
  font-size: 16px;
  padding: 12px 24px;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-message {
    font-size: 20px;
  }
  
  .not-found-content {
    padding: 30px 20px;
  }
}
</style>