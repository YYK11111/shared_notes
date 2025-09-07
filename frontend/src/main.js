import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
// 导入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { registerComponents } from './components'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 安装插件
app.use(ElementPlus)
   .use(pinia)
   .use(router)

// 注册全局组件
registerComponents(app)

// 挂载应用并添加错误处理
try {
  app.mount('#app')
} catch (error) {
  console.error('应用挂载失败:', error)
}

// 可选：添加全局错误捕获
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误捕获:', err, instance, info)
  // 可以在这里添加错误上报逻辑
}
