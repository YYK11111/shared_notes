const { pool } = require('./src/database/db');
require('dotenv').config();

async function finalRoleFix() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('开始最终角色系统修复...\n');
    
    // 1. 清理重复的超级管理员角色
    console.log('步骤1: 清理重复的超级管理员角色...');
    const [roles] = await connection.execute(
      'SELECT id, name, code FROM roles WHERE code = ? OR name = ?',
      ['super_admin', '超级管理员']
    );
    
    if (roles.length > 1) {
      // 找到正确的super_admin角色（有code的那个）
      const correctRole = roles.find(role => role.code === 'super_admin');
      const duplicateRoles = roles.filter(role => role.id !== correctRole.id);
      
      console.log(`  - 找到${roles.length}个超级管理员相关角色`);
      console.log(`  - 正确的角色ID: ${correctRole.id}`);
      console.log(`  - 重复角色ID: ${duplicateRoles.map(r => r.id).join(', ')}`);
      
      // 更新所有关联到重复角色的管理员账户
      for (const duplicate of duplicateRoles) {
        const [admins] = await connection.execute(
          'SELECT id FROM admins WHERE role_id = ?',
          [duplicate.id]
        );
        
        if (admins.length > 0) {
          console.log(`  - 将${admins.length}个管理员从角色ID ${duplicate.id} 迁移到角色ID ${correctRole.id}`);
          await connection.execute(
            'UPDATE admins SET role_id = ? WHERE role_id = ?',
            [correctRole.id, duplicate.id]
          );
        }
        
        // 删除重复角色
        console.log(`  - 删除重复角色ID: ${duplicate.id}`);
        await connection.execute(
          'DELETE FROM roles WHERE id = ?',
          [duplicate.id]
        );
      }
      
      console.log('✓ 重复角色清理完成');
    } else {
      console.log('✓ 没有发现重复的超级管理员角色');
    }
    
    // 2. 验证最终的角色数据
    console.log('\n步骤2: 验证最终角色数据...');
    const [finalRoles] = await connection.execute(
      'SELECT id, name, code, description FROM roles ORDER BY id ASC'
    );
    
    console.log('最终角色列表:');
    finalRoles.forEach(role => {
      console.log(`  - ID: ${role.id}, 名称: ${role.name}, 代码: ${role.code}, 描述: ${role.description}`);
    });
    
    // 3. 提供完整的修复总结
    console.log('\n---------------------------------------');
    console.log('角色系统修复总结:');
    console.log('---------------------------------------');
    console.log('1. 数据库修改:');
    console.log('   ✓ 角色表已添加code字段（VARCHAR(50), UNIQUE）');
    console.log('   ✓ 已初始化三个标准角色:');
    console.log('     - super_admin (超级管理员): 拥有系统所有权限');
    console.log('     - admin (管理员): 拥有大部分系统管理权限');
    console.log('     - user (用户): 基础用户权限');
    console.log('   ✓ 默认管理员账户(admin)已关联到super_admin角色');
    console.log('   ✓ 重复角色已清理');
    console.log('');
    console.log('2. 代码修改:');
    console.log('   ✓ authMiddleware.js: 更新SQL查询添加role_code字段，修改角色判断逻辑');
    console.log('   ✓ routePermissionRoutes.js: 修改角色判断逻辑，统一使用role_code');
    console.log('   ✓ adminRoutes.js: 修改角色判断逻辑，统一使用role_code');
    console.log('');
    console.log('3. 系统改进:');
    console.log('   ✓ 角色判断现在统一使用英文code字段，避免中英文不一致问题');
    console.log('   ✓ 系统支持三个标准角色，权限层级更清晰');
    console.log('   ✓ 角色表结构更完善，支持code和name字段分离');
    console.log('');
    console.log('4. 使用说明:');
    console.log('   - 后端服务需要重启以应用所有更改');
    console.log('   - 角色判断逻辑统一使用role_code字段');
    console.log('   - 管理员列表接口路径为: GET /api/admin');
    console.log('   - 角色管理相关接口位于: GET/POST/PUT/DELETE /api/admin/roles');
    console.log('---------------------------------------');
    
    console.log('\n🎉 角色系统修复已全部完成！🎉');
    
  } catch (error) {
    console.error('最终角色系统修复失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 运行最终修复
console.log('角色系统最终修复脚本');
console.log('-------------------\n');
finalRoleFix().catch(console.error);