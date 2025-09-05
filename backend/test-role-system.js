const { pool } = require('./src/database/db');
require('dotenv').config();

async function testRoleSystem() {
  let connection;
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('开始测试角色系统...\n');
    
    // 1. 检查角色表结构
    console.log('测试1: 检查角色表结构...');
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM roles'
    );
    
    const hasCodeColumn = columns.some(col => col.Field === 'code');
    console.log(`✓ 角色表包含code字段: ${hasCodeColumn ? '是' : '否'}`);
    
    // 2. 检查角色数据
    console.log('\n测试2: 检查角色数据...');
    const [roles] = await connection.execute(
      'SELECT id, name, code, description FROM roles'
    );
    
    console.log('角色列表:');
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, 名称: ${role.name}, 代码: ${role.code}, 描述: ${role.description}`);
    });
    
    // 检查是否存在三个标准角色
    const expectedRoles = ['super_admin', 'admin', 'user'];
    expectedRoles.forEach(code => {
      const exists = roles.some(role => role.code === code);
      console.log(`  ✓ 角色 ${code} 存在: ${exists ? '是' : '否'}`);
    });
    
    // 3. 检查管理员账户关联
    console.log('\n测试3: 检查管理员账户角色关联...');
    const [admins] = await connection.execute(
      'SELECT a.id, a.username, a.role_id, r.code as role_code FROM admins a LEFT JOIN roles r ON a.role_id = r.id'
    );
    
    console.log('管理员账户列表:');
    admins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, 用户名: ${admin.username}, 角色ID: ${admin.role_id}, 角色代码: ${admin.role_code}`);
    });
    
    // 检查默认admin账户是否关联到super_admin角色
    const adminAccount = admins.find(a => a.username === 'admin');
    const isSuperAdmin = adminAccount && adminAccount.role_code === 'super_admin';
    console.log(`  ✓ 默认admin账户关联到super_admin角色: ${isSuperAdmin ? '是' : '否'}`);
    
    // 4. 验证代码文件修改
    console.log('\n测试4: 验证代码文件修改...');
    const fs = require('fs').promises;
    const path = require('path');
    
    // 检查authMiddleware.js
    const authMiddlewarePath = path.join(__dirname, 'src', 'middleware', 'authMiddleware.js');
    const authContent = await fs.readFile(authMiddlewarePath, 'utf8');
    
    const hasRoleCodeInQuery = authContent.includes('r.code as role_code');
    const usesRoleCodeInCheck = !authContent.includes('admin.role_name === \'super_admin\'') && 
                                authContent.includes('admin.role_code === \'super_admin\'');
    
    console.log(`  ✓ authMiddleware.js 中SQL查询包含role_code: ${hasRoleCodeInQuery ? '是' : '否'}`);
    console.log(`  ✓ authMiddleware.js 使用role_code进行判断: ${usesRoleCodeInCheck ? '是' : '否'}`);
    
    // 检查routePermissionRoutes.js
    const routePermissionPath = path.join(__dirname, 'src', 'routes', 'routePermissionRoutes.js');
    const routeContent = await fs.readFile(routePermissionPath, 'utf8');
    
    const usesRoleCodeInRoutes = !routeContent.includes('admin.role_name === \'超级管理员\'') && 
                                routeContent.includes('admin.role_code === \'super_admin\'');
    
    console.log(`  ✓ routePermissionRoutes.js 使用role_code进行判断: ${usesRoleCodeInRoutes ? '是' : '否'}`);
    
    // 检查adminRoutes.js
    const adminRoutesPath = path.join(__dirname, 'src', 'routes', 'adminRoutes.js');
    const adminContent = await fs.readFile(adminRoutesPath, 'utf8');
    
    const usesRoleCodeInAdminRoutes = !adminContent.includes('admin.role_name === \'超级管理员\'') && 
                                     adminContent.includes('admin.role_code === \'super_admin\'');
    
    console.log(`  ✓ adminRoutes.js 使用role_code进行判断: ${usesRoleCodeInAdminRoutes ? '是' : '否'}`);
    
    // 5. 总结测试结果
    console.log('\n---------------------------------------');
    console.log('测试总结:');
    
    const allTestsPassed = hasCodeColumn && 
                          expectedRoles.every(code => roles.some(role => role.code === code)) &&
                          isSuperAdmin && 
                          hasRoleCodeInQuery && 
                          usesRoleCodeInCheck && 
                          usesRoleCodeInRoutes && 
                          usesRoleCodeInAdminRoutes;
    
    if (allTestsPassed) {
      console.log('✓ 所有测试通过！角色系统已成功修复。');
    } else {
      console.log('✗ 部分测试未通过，请检查问题。');
    }
    
    console.log('\n重要提示:');
    console.log('1. 请重启后端服务使所有更改生效');
    console.log('2. 角色判断现在统一使用英文code字段');
    console.log('3. 系统已初始化三个标准角色: super_admin, admin, user');
    console.log('---------------------------------------');
    
  } catch (error) {
    console.error('测试角色系统失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 运行测试
console.log('角色系统修复测试脚本');
console.log('-------------------\n');
testRoleSystem().catch(console.error);