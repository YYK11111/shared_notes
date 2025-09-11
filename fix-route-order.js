const fs = require('fs');
const path = require('path');

// adminRoutes.js文件路径
const adminRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'adminRoutes.js');

// 读取当前adminRoutes.js内容
let adminRoutesContent = fs.readFileSync(adminRoutesPath, 'utf8');

console.log('\n=====================================');
console.log('       修复adminRoutes.js路由顺序问题');
console.log('=====================================');

// 分析文件内容
console.log('1. 正在分析当前路由顺序...');

// 检查是否存在路由顺序问题
const hasRouteOrderIssue = 
  adminRoutesContent.includes("router.get('/:id', authMiddleware") && 
  adminRoutesContent.includes("router.get('/roles', authMiddleware") &&
  adminRoutesContent.indexOf("router.get('/:id', authMiddleware") < adminRoutesContent.indexOf("router.get('/roles', authMiddleware");

if (hasRouteOrderIssue) {
  console.log('✅ 发现路由顺序问题：动态路由/:id在静态路由/roles之前');
  console.log('2. 正在修复路由顺序...');
  
  // 提取整个文件内容，以便进行更精确的处理
  const lines = adminRoutesContent.split('\n');
  
  // 查找动态路由/:id的开始和结束位置
  let dynamicRouteStart = -1;
  let dynamicRouteEnd = -1;
  let braceCount = 0;
  let inDynamicRoute = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith("router.get('/:id', authMiddleware")) {
      dynamicRouteStart = i;
      inDynamicRoute = true;
    }
    
    if (inDynamicRoute) {
      // 计算花括号
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // 当花括号数量回到0时，表示动态路由函数体结束
      if (braceCount === 0 && dynamicRouteStart !== -1) {
        dynamicRouteEnd = i;
        break;
      }
    }
  }
  
  // 查找静态路由/roles的开始位置
  let rolesRouteStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("router.get('/roles', authMiddleware")) {
      rolesRouteStart = i;
      break;
    }
  }
  
  if (dynamicRouteStart !== -1 && dynamicRouteEnd !== -1 && rolesRouteStart !== -1) {
    console.log(`  - 动态路由/:id位置: 行${dynamicRouteStart+1}-${dynamicRouteEnd+1}`);
    console.log(`  - 静态路由/roles位置: 行${rolesRouteStart+1}`);
    
    // 提取动态路由代码块
    const dynamicRouteLines = lines.slice(dynamicRouteStart, dynamicRouteEnd + 1);
    
    // 创建新的路由顺序：将动态路由移到静态路由之后
    // 1. 先获取文件开头到动态路由之前的内容
    const beforeDynamicRoute = lines.slice(0, dynamicRouteStart);
    // 2. 然后获取动态路由之后到静态路由之前的内容（不包含动态路由）
    const betweenRoutes = lines.slice(dynamicRouteEnd + 1, rolesRouteStart);
    // 3. 然后获取静态路由及其之后的内容
    const afterRolesRoute = lines.slice(rolesRouteStart);
    // 4. 合并所有内容，并将动态路由放在最后
    const newLines = [...beforeDynamicRoute, ...betweenRoutes, ...afterRolesRoute, '', ...dynamicRouteLines];
    
    // 重新生成文件内容
    const newContent = newLines.join('\n');
    
    // 备份原始文件
    const backupPath = adminRoutesPath + '.bak';
    fs.writeFileSync(backupPath, adminRoutesContent);
    console.log('3. 已备份原始文件到:', backupPath);
    
    // 写入修复后的内容
    fs.writeFileSync(adminRoutesPath, newContent);
    console.log('4. 路由顺序已修复完成！');
    console.log('   - 现在静态路由/roles在动态路由/:id之前');
    console.log('   - 这将解决/api/admin/roles路径被错误匹配到动态路由的问题');
  } else {
    console.error('❌ 无法精确定位路由位置，请手动检查adminRoutes.js文件');
  }
} else {
  console.log('✅ 路由顺序已经正确：静态路由/roles在动态路由/:id之前');
  console.log('   不需要修复');
}

// 检查其他可能的路由顺序问题
console.log('\n5. 检查其他可能的路由顺序问题...');

const otherStaticRoutes = [
  "router.get('/admins', authMiddleware",
  "router.post('/roles', authMiddleware",
  "router.put('/roles/:id', authMiddleware",
  "router.delete('/roles/:id', authMiddleware",
  "router.get('/roles/:id/permissions', authMiddleware",
  "router.put('/roles/:id/permissions', authMiddleware",
  "router.get('/login-logs', authMiddleware"
];

let otherIssuesFound = false;
for (const route of otherStaticRoutes) {
  if (adminRoutesContent.includes(route) && 
      adminRoutesContent.indexOf("router.get('/:id', authMiddleware") < adminRoutesContent.indexOf(route)) {
    console.log(`❌ 发现其他路由顺序问题：${route} 在动态路由/:id之后`);
    otherIssuesFound = true;
  }
}

if (!otherIssuesFound) {
  console.log('✅ 没有发现其他路由顺序问题');
}

console.log('\n=====================================');
console.log('       修复完成');
console.log('=====================================');
console.log('\n修复后的路由访问提示：');
console.log('1. 角色列表接口：http://localhost:3000/api/admin/roles');
console.log('2. 管理员列表接口：http://localhost:3000/api/admin/admins');
console.log('3. 单个管理员接口：http://localhost:3000/api/admin/{id}');
console.log('\n请重启后端服务以应用修复！');