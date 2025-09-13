const { pool } = require('./db');

// 创建轮播图表
exports.createCarouselTable = async () => {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始创建轮播图表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS carousels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '轮播图名称',
        description TEXT COMMENT '描述说明',
        image_url VARCHAR(255) NOT NULL COMMENT '图片地址',
        title VARCHAR(255) COMMENT '标题文本',
        subtitle TEXT COMMENT '副标题文本',
        link_url VARCHAR(255) COMMENT '跳转链接',
        link_target VARCHAR(10) DEFAULT '_self' COMMENT '链接打开方式',
        status TINYINT DEFAULT 1 COMMENT '状态: 0禁用, 1启用',
        sort INT DEFAULT 100 COMMENT '排序值',
        start_time DATETIME COMMENT '生效开始时间',
        end_time DATETIME COMMENT '生效结束时间',
        position VARCHAR(50) DEFAULT 'home_top' COMMENT '展示位置',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('轮播图表创建完成!');
    connection.release();
  } catch (error) {
    console.error('创建轮播图表失败:', error.message);
  }
};

// 添加轮播图管理权限
exports.addCarouselPermission = async () => {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始添加轮播图管理权限...');
    
    // 检查是否已存在轮播图管理权限
    const [existingPermission] = await connection.execute(
      'SELECT id FROM permissions WHERE name = ?',
      ['carousel_manage']
    );
    
    if (existingPermission.length === 0) {
      // 插入轮播图管理权限
      await connection.execute(
        'INSERT INTO permissions (name, description) VALUES (?, ?)',
        ['carousel_manage', '轮播图管理']
      );
      console.log('轮播图管理权限添加成功!');
    } else {
      console.log('轮播图管理权限已存在，无需重复添加!');
    }
    
    // 为超级管理员角色分配轮播图管理权限
    const [permission] = await connection.execute(
      'SELECT id FROM permissions WHERE name = ?',
      ['carousel_manage']
    );
    
    if (permission.length > 0) {
      const permId = permission[0].id;
      const [superAdminRole] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['超级管理员']
      );
      
      if (superAdminRole.length > 0) {
        const roleId = superAdminRole[0].id;
        
        // 检查是否已分配权限
        const [existingMapping] = await connection.execute(
          'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [roleId, permId]
        );
        
        if (existingMapping.length === 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permId]
          );
          console.log('已为超级管理员角色分配轮播图管理权限!');
        }
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('添加轮播图管理权限失败:', error.message);
  }
};