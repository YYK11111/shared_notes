// 全局组件注册
// 导入所有全局组件
import Breadcrumb from './Breadcrumb.vue'
import Loading from './Loading.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import Message from './Message.vue'
import DataTable from './DataTable.vue'
import FormValidator from './FormValidator.vue'
import NoteCard from './NoteCard.vue'

// 组件列表
const components = {
  Breadcrumb,
  Loading,
  ConfirmDialog,
  Message,
  DataTable,
  FormValidator,
  NoteCard
}

// 注册所有组件
const registerComponents = (app) => {
  Object.keys(components).forEach(key => {
    app.component(`El${key}`, components[key])
  })
}

// 导出单个组件和注册函数
export {
  Breadcrumb,
  Loading,
  ConfirmDialog,
  Message,
  DataTable,
  FormValidator,
  NoteCard,
  registerComponents
}

// 导出默认注册函数
export default registerComponents