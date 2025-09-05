const express = require('express');
const fs = require('fs');
const path = require('path');

/**
 * 修复超级管理员路由权限问题
 * 问题原因：routePermissionRoutes.js中错误地使用'super_admin'作为超级管理员角色名称检查
 * 正确的超级管理员角色名称在系统中是'超级管理员'(中文)
 */

const routePermissionPath = path.join(__dirname, 'src', 'routes', 'routePermissionRoutes.js');

function fixSuperAdminRoutes() {
  try {
    console.log('开始修复超级管理员路由权限问题...');
    
    // 读取文件内容
    const fileContent = fs.readFileSync(routePermissionPath, 'utf8');
    
    // 检查并替换错误的角色名称检查
    const fixedContent = fileContent.replace(
      "if (admin && admin.role_name === 'super_admin')",
      "if (admin && admin.role_name === '超级管理员')"
    );
    
    // 保存修复后的文件
    fs.writeFileSync(routePermissionPath, fixedContent, 'utf8');
    
    console.log('✅ 修复成功！超级管理员角色名称检查已从"super_admin"修正为"超级管理员"');
    console.log('现在超级管理员登录后应该能看到所有路由了');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

// 执行修复
fixSuperAdminRoutes();