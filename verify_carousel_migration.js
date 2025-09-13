const { pool } = require('./backend/src/database/db');

// 验证轮播图表是否存在
async function verifyCarouselTable() {
  try {
    const connection = await pool.getConnection();
    
    console.log('验证轮播图表是否存在...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'carousels'"
    );
    
    if (tables.length > 0) {
      console.log('✓ 轮播图表已存在');
    } else {
      console.log('✗ 轮播图表不存在');
    }
    
    connection.release();
  } catch (error) {
    console.error('验证轮播图表失败:', error.message);
  }
}

// 验证轮播图管理权限是否存在
async function verifyCarouselPermission() {
  try {
    const connection = await pool.getConnection();
    
    console.log('验证轮播图管理权限是否存在...');
    const [permissions] = await connection.execute(
      'SELECT * FROM permissions WHERE name = ?',
      ['carousel_manage']
    );
    
    if (permissions.length > 0) {
      console.log('✓ 轮播图管理权限已存在:', permissions[0]);
      
      // 验证超级管理员是否拥有该权限
      console.log('验证超级管理员是否拥有轮播图管理权限...');
      const [role] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['超级管理员']
      );
      
      if (role.length > 0) {
        const [rolePermissions] = await connection.execute(
          'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [role[0].id, permissions[0].id]
        );
        
        if (rolePermissions.length > 0) {
          console.log('✓ 超级管理员已拥有轮播图管理权限');
        } else {
          console.log('✗ 超级管理员未拥有轮播图管理权限');
        }
      }
    } else {
      console.log('✗ 轮播图管理权限不存在');
    }
    
    connection.release();
  } catch (error) {
    console.error('验证轮播图管理权限失败:', error.message);
  }
}

// 执行验证
async function verify() {
  try {
    await verifyCarouselTable();
    await verifyCarouselPermission();
    console.log('\n验证完成！');
  } catch (error) {
    console.error('验证过程中出错:', error);
  } finally {
    process.exit(0);
  }
}

verify();