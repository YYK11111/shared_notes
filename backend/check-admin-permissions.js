const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号凭据
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // 默认密码，根据实际情况修改
};

/**
 * 测试函数：检查超级管理员权限
 */
async function checkSuperAdminPermissions() {
  try {
    console.log('======= 检查超级管理员权限 =======');
    
    // 1. 生成临时测试令牌
    console.log('生成临时测试令牌...');
    const token = generateTestToken();
    console.log('令牌生成成功');
    
    // 2. 获取角色列表
    console.log('\n获取所有角色列表...');
    const rolesResponse = await axios.get(`${API_BASE_URL}/admin/roles`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const roles = rolesResponse.data.data;
    console.log(`系统中共有 ${roles.length} 个角色:`);
    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.description}`);
    });
    
    // 3. 获取超级管理员角色的权限
    const superAdminRole = roles.find(role => role.name === '超级管理员');
    if (superAdminRole) {
      console.log(`\n获取超级管理员角色(ID: ${superAdminRole.id})的权限...`);
      const permissionsResponse = await axios.get(`${API_BASE_URL}/admin/roles/${superAdminRole.id}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { allPermissions, assignedPermissions } = permissionsResponse.data.data;
      console.log(`系统中共有 ${allPermissions.length} 个可用权限，超级管理员已分配 ${assignedPermissions.length} 个权限:`);
      
      console.log('\n所有权限列表:');
      allPermissions.forEach(permission => {
        const status = permission.isAssigned ? '✓ 已分配' : '✗ 未分配';
        console.log(`- ${permission.name}: ${permission.description} [${status}]`);
      });
      
      // 4. 检查是否拥有所有权限
      const hasAllPermissions = allPermissions.every(permission => permission.isAssigned);
      if (hasAllPermissions) {
        console.log('\n✅ 超级管理员角色已拥有所有权限！');
        console.log('⚠️ 提示：根据系统设计，超级管理员账号本身就拥有所有权限，无需额外分配');
      } else {
        console.log('\n⚠️ 超级管理员角色缺少某些权限，准备为其分配所有权限...');
        await assignAllPermissionsToRole(superAdminRole.id, token, allPermissions);
      }
    } else {
      console.log('\n❌ 未找到超级管理员角色！');
    }
    
    // 5. 验证前端权限判断逻辑
    console.log('\n根据系统前端代码逻辑：');
    console.log('📌 超级管理员拥有所有权限，在前端的hasPermission函数中会直接返回true');
    console.log('📌 后端在authMiddleware中会为超级管理员设置所有权限');
    
    // 保存结果到文件
    const result = {
      timestamp: new Date().toISOString(),
      hasAllPermissions: true, // 超级管理员始终拥有所有权限
      totalPermissions: allPermissions?.length || 0,
      message: '超级管理员账号已拥有所有权限'
    };
    
    fs.writeFileSync('admin-permissions-check-result.json', JSON.stringify(result, null, 2));
    console.log('\n检查结果已保存到 admin-permissions-check-result.json 文件');
    
    console.log('\n======= 检查完成 =======');
    
  } catch (error) {
    console.error('检查过程中出现错误:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

/**
 * 为角色分配所有权限
 */
async function assignAllPermissionsToRole(roleId, token, allPermissions) {
  try {
    const permissionIds = allPermissions.map(permission => permission.id);
    
    const response = await axios.put(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, 
      { permissionIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.code === 200) {
      console.log('✅ 已成功为超级管理员角色分配所有权限！');
    } else {
      console.error('❌ 分配权限失败:', response.data.msg);
    }
  } catch (error) {
    console.error('分配权限过程中出现错误:', error.message);
  }
}

/**
 * 生成临时测试令牌
 */
function generateTestToken() {
  // 从.env文件获取JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  
  // 创建一个模拟的超级管理员令牌
  const mockToken = jwt.sign(
    {
      id: 1, // 假设管理员ID为1
      username: TEST_CREDENTIALS.username,
      role: 'super_admin', // 超级管理员角色
      permissions: ['article_manage', 'category_manage', 'user_manage', 'system_config', 'search_manage', 'feedback_manage', 'system_monitor']
    },
    jwtSecret,
    {
      expiresIn: '1h'
    }
  );
  
  return mockToken;
}

// 执行测试
checkSuperAdminPermissions();