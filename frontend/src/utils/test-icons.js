// 测试脚本，用于查看@element-plus/icons-vue包中所有可用的图标名称
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 打印所有图标名称
console.log('Element Plus 图标列表:', Object.keys(ElementPlusIconsVue));

// 查找与眼睛相关的图标
const eyeRelatedIcons = Object.keys(ElementPlusIconsVue).filter(name => 
  name.toLowerCase().includes('eye') || name.toLowerCase().includes('view')
);
console.log('与眼睛/查看相关的图标:', eyeRelatedIcons);

// 导出所有图标（便于在main.js中全局注册）
export default ElementPlusIconsVue;