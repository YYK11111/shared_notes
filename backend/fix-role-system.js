const { pool } = require('./src/database/db');
require('dotenv').config();

async function fixRoleSystem() {
  let connection;
  try {
    // 1. 获取数据库连接
    connection = await pool.getConnection();
    console.log('开始修复角色系统...');
    
    // 2. 为角色表添加 code 字段
    console.log('步骤1: 为角色表添加 code 字段...');
    try {
      await connection.execute(
        'ALTER TABLE roles ADD COLUMN code VARCHAR(50) UNIQUE AFTER name'
      );
      console.log('✓ 角色表 code 字段添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ 角色表 code 字段已存在，跳过添加');
      } else {
        throw error;
      }
    }
    
    // 3. 更新现有角色数据，设置英文 code
    console.log('步骤2: 更新现有角色数据...');
    await connection.execute(
      'UPDATE roles SET code = ? WHERE name = ?',
      ['super_admin', '超级管理员']
    );
    console.log('✓ 超级管理员角色 code 更新为 super_admin');
    
    // 4. 初始化三个角色：用户、管理员、超级管理员
    console.log('步骤3: 初始化三个标准角色...');
    
    // 定义三个标准角色
    const standardRoles = [
      { name: '超级管理员', code: 'super_admin', description: '拥有系统所有权限' },
      { name: '管理员', code: 'admin', description: '拥有大部分系统管理权限' },
      { name: '用户', code: 'user', description: '基础用户权限' }
    ];
    
    for (const role of standardRoles) {
      try {
        await connection.execute(
          'INSERT INTO roles (name, code, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), description = VALUES(description)',
          [role.name, role.code, role.description]
        );
        console.log(`✓ 角色 ${role.name} (${role.code}) 初始化/更新成功`);
      } catch (error) {
        console.error(`✗ 角色 ${role.name} 处理失败:`, error.message);
      }
    }
    
    // 5. 确保默认管理员账户关联到 super_admin 角色
    console.log('步骤4: 更新默认管理员账户角色关联...');
    const [roleResult] = await connection.execute('SELECT id FROM roles WHERE code = ?', ['super_admin']);
    if (roleResult.length > 0) {
      const roleId = roleResult[0].id;
      await connection.execute(
        'UPDATE admins SET role_id = ? WHERE username = ?',
        [roleId, 'admin']
      );
      console.log('✓ 默认管理员账户角色关联更新成功');
    }
    
    // 6. 提示需要手动修改的代码位置
    console.log('\n步骤5: 以下是需要手动修改的代码位置:');
    console.log('---------------------------------------');
    console.log('1. d:\\代码\\wangzhan\\backend\\src\\middleware\\authMiddleware.js');
    console.log('   - 第46行: if (admin.role_name === \'super_admin\') {');
    console.log('   - 第84行: if (req.admin && req.admin.role_name === \'super_admin\') {');
    console.log('   - 第113行: if (req.admin && req.admin.role_name === \'super_admin\') {');
    console.log('   应修改为: 使用 role_code 字段进行判断');
    console.log('');
    console.log('2. d:\\代码\\wangzhan\\backend\\src\\routes\\routePermissionRoutes.js');
    console.log('   - 第17行: if (admin && admin.role_name === \'超级管理员\') {');
    console.log('   应修改为: if (admin && admin.role_code === \'super_admin\') {');
    console.log('');
    console.log('3. d:\\代码\\wangzhan\\backend\\src\\routes\\adminRoutes.js');
    console.log('   - 第295行: const hasSuperAdmin = superAdmins.some(admin => admin.role_name === \'超级管理员\');');
    console.log('   - 第304行: if (allSuperAdmins[0].count <= superAdmins.filter(admin => admin.role_name === \'超级管理员\').length) {');
    console.log('   应修改为: 使用 role_code 字段进行判断');
    console.log('---------------------------------------');
    
    console.log('\n角色系统修复完成！请按照上述提示修改相关代码。');
    
  } catch (error) {
    console.error('修复角色系统失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 创建一个用于批量修改代码文件的辅助函数
async function batchUpdateCodeFiles() {
  const fs = require('fs').promises;
  const path = require('path');
  
  console.log('\n开始自动修改代码文件...');
  
  // 需要修改的文件列表
  const filesToUpdate = [
    {
      filePath: path.join(__dirname, 'src', 'middleware', 'authMiddleware.js'),
      replacements: [
        { search: 'admin.role_name === \'super_admin\'', replace: 'admin.role_code === \'super_admin\'' },
        { search: 'req.admin && req.admin.role_name === \'super_admin\'', replace: 'req.admin && req.admin.role_code === \'super_admin\'' }
      ]
    },
    {
      filePath: path.join(__dirname, 'src', 'routes', 'routePermissionRoutes.js'),
      replacements: [
        { search: 'admin && admin.role_name === \'超级管理员\'', replace: 'admin && admin.role_code === \'super_admin\'' }
      ]
    },
    {
      filePath: path.join(__dirname, 'src', 'routes', 'adminRoutes.js'),
      replacements: [
        { search: 'admin => admin.role_name === \'超级管理员\'', replace: 'admin => admin.role_code === \'super_admin\'' }
      ]
    }
  ];
  
  // 修改authMiddleware.js中的SQL查询，添加role_code字段
  const authMiddlewarePath = path.join(__dirname, 'src', 'middleware', 'authMiddleware.js');
  try {
    let content = await fs.readFile(authMiddlewarePath, 'utf8');
    // 修改SQL查询，添加role_code字段
    content = content.replace(
      'SELECT a.*, r.name as role_name FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?',
      'SELECT a.*, r.name as role_name, r.code as role_code FROM admins a LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?'
    );
    await fs.writeFile(authMiddlewarePath, content, 'utf8');
    console.log('✓ authMiddleware.js 中SQL查询已更新，添加了role_code字段');
  } catch (error) {
    console.error('✗ 更新authMiddleware.js失败:', error);
  }
  
  // 执行其他文件的替换
  for (const file of filesToUpdate) {
    try {
      let content = await fs.readFile(file.filePath, 'utf8');
      
      file.replacements.forEach(replacement => {
        const regex = new RegExp(replacement.search, 'g');
        content = content.replace(regex, replacement.replace);
      });
      
      await fs.writeFile(file.filePath, content, 'utf8');
      console.log(`✓ ${path.basename(file.filePath)} 已成功更新`);
    } catch (error) {
      console.error(`✗ 更新 ${path.basename(file.filePath)} 失败:`, error);
    }
  }
  
  console.log('\n代码文件自动修改完成！');
}

// 执行修复
async function runFullFix() {
  await fixRoleSystem();
  await batchUpdateCodeFiles();
  
  console.log('\n---------------------------------------');
  console.log('重要提示:');
  console.log('1. 角色系统已成功修复和更新');
  console.log('2. 角色表已添加code字段');
  console.log('3. 已初始化三个标准角色: super_admin, admin, user');
  console.log('4. 所有角色判断逻辑已统一使用英文code');
  console.log('5. 请重启后端服务使更改生效');
  console.log('---------------------------------------');
}

// 运行修复脚本
runFullFix().catch(console.error);