// main.js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { registerComponents } from './components'

// mavon-editor 配置
import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

// 6. 创建应用
const app = createApp(App)
const pinia = createPinia()

// 7. 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 8. 安装插件
app.use(ElementPlus)
   .use(pinia)
   .use(router)
   .use(mavonEditor)

// 9. 注册全局组件
registerComponents(app)

// 10. 挂载
try {
  app.mount('#app')
} catch (e) {
  console.error('应用挂载失败:', e)
}

// 全局错误兜底
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误捕获:', err, instance, info)
}