<script setup>
import { RouterView } from 'vue-router';
import './style.css';
</script>

<template>
  <div id="app">
    <!-- 路由视图，用于渲染匹配的路由组件 -->
    <RouterView />
  </div>
</template>

<style scoped>
/* 应用特定的组件样式可以在这里添加 */
</style>
