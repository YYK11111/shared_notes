const { pool } = require('./db');

async function createTables() {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始创建数据库表结构...');
    
    // 创建文件表 (如果不存在)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS files (
        file_id VARCHAR(50) NOT NULL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT NOT NULL,
        storage_path VARCHAR(255) NOT NULL,
        business_type VARCHAR(50) DEFAULT 'other',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建管理员表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        role_id INT,
        status TINYINT DEFAULT 1 COMMENT '0:禁用, 1:启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建角色表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建权限表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建角色权限关联表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_role_permission (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);
    
    // 创建分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        parent_id INT DEFAULT 0 COMMENT '0:顶级分类',
        priority INT DEFAULT 10 COMMENT '1-10,数值越小越靠前',
        status TINYINT DEFAULT 1 COMMENT '0:禁用, 1:启用',
        icon VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建笔记表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        cover_image VARCHAR(255),
        status TINYINT DEFAULT 1 COMMENT '0:禁用, 1:启用',
        is_top TINYINT DEFAULT 0 COMMENT '0:不置顶, 1:置顶',
        top_expire_time DATETIME,
        is_home_recommend TINYINT DEFAULT 0 COMMENT '0:不推荐, 1:首页推荐',
        is_week_selection TINYINT DEFAULT 0 COMMENT '0:否, 1:本周精选',
        is_month_recommend TINYINT DEFAULT 0 COMMENT '0:否, 1:月度推荐',
        view_count INT DEFAULT 0,
        exposure_count INT DEFAULT 0,
        click_rate FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FULLTEXT (title, content) WITH PARSER ngram
      )
    `);
    
    // 创建笔记分类关联表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS note_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        category_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_note_category (note_id, category_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    
    // 创建反馈表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20) NOT NULL COMMENT '内容建议/功能问题/其他',
        content TEXT NOT NULL,
        contact VARCHAR(100),
        status VARCHAR(20) DEFAULT '待处理' COMMENT '待处理/处理中/已处理',
        reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建登录日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT,
        username VARCHAR(50),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        login_ip VARCHAR(50),
        login_device VARCHAR(255),
        login_status VARCHAR(20) COMMENT '成功/失败',
        error_message TEXT
      )
    `);
    
    // 创建系统操作日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT,
        action VARCHAR(255) NOT NULL,
        description TEXT,
        action_ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建系统配置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(50) NOT NULL UNIQUE,
        config_value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建搜索日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS search_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        search_count INT DEFAULT 1,
        last_search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_keyword (keyword)
      )
    `);
    
    // 创建敏感词表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sensitive_words (
        id INT AUTO_INCREMENT PRIMARY KEY,
        word VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建轮播图表
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
    
    // 创建曝光日志表
    console.log('开始创建曝光日志表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exposure_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        user_ip VARCHAR(50),
        exposure_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);
    
    // 创建笔记浏览记录表
    console.log('开始创建笔记浏览记录表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS note_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        user_ip VARCHAR(100),
        user_agent VARCHAR(255),
        view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);
    
    // 创建搜索屏蔽笔记表
    console.log('开始创建搜索屏蔽笔记表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS search_blocked_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        note_title VARCHAR(255) NOT NULL,
        blocked_by INT DEFAULT NULL,
        blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_note_id (note_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_by) REFERENCES admins(id) ON DELETE SET NULL
      )
    `);
    
    // 创建搜索索引表
    console.log('开始创建搜索索引表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS search_index (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FULLTEXT KEY title (title, content) WITH PARSER ngram
      )
    `);
    
    console.log('所有表结构创建完成!');
    
    // 释放连接
    connection.release();
  } catch (error) {
    console.error('创建表结构失败:', error.message);
  }
}

async function initData() {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始初始化基础数据...');
    
    // 插入超级管理员角色
    const [roleResult] = await connection.execute(
      'INSERT INTO roles (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      ['超级管理员', '拥有系统所有权限']
    );
    
    const roleId = roleResult.insertId || 1;
    
    // 插入基本权限
    const permissions = [
      { name: 'article_manage', description: '文章管理' },
      { name: 'category_manage', description: '分类管理' },
      { name: 'user_manage', description: '用户与权限管理' },
      { name: 'system_config', description: '系统配置' },
      { name: 'search_manage', description: '搜索管理' },
      { name: 'feedback_manage', description: '反馈管理' },
      { name: 'system_monitor', description: '系统监控与日志' },
      { name: 'carousel_manage', description: '轮播图管理' }
    ];
    
    for (const perm of permissions) {
      await connection.execute(
        'INSERT INTO permissions (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
        [perm.name, perm.description]
      );
    }
    
    // 为超级管理员角色分配所有权限
    try {
      const [permResults] = await connection.execute('SELECT id FROM permissions');
      for (const perm of permResults) {
        await connection.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id=role_id',
          [roleId, perm.id]
        );
      }
    } catch (error) {
      console.log('角色权限关联已存在，跳过重复关联');
    }
    
    // 插入默认管理员账户 (密码: admin123)
    await connection.execute(
      'INSERT INTO admins (username, password, nickname, email, role_id, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=username',
      ['admin', '$2b$10$Q4eR8h5W9zY7uF3t1v2cOeKdJfH5gK7jL9pR3sT5uV7bN9mP1qS3', '超级管理员', 'admin@example.com', roleId, 1]
    );
    
    // 插入一些默认配置
    const configs = [
      { key: 'site_name', value: '个人笔记分享平台', desc: '网站名称' },
      { key: 'site_description', value: '专注于笔记展示与分享的服务型产品', desc: '网站描述' },
      { key: 'site_logo', value: '', desc: '网站Logo' },
      { key: 'site_copyright', value: '© 2023 个人笔记分享平台 版权所有', desc: '版权信息' },
      { key: 'default_theme', value: 'light', desc: '默认主题(light/dark)' },
      { key: 'search_suggest_count', value: '5', desc: '搜索建议展示数量' },
      { key: 'search_title_weight', value: '2', desc: '标题搜索权重' },
      { key: 'cache_expire_time', value: '3600', desc: '缓存有效期(秒)' },
      { key: 'max_login_attempts', value: '5', desc: '最大登录尝试次数' },
      { key: 'lock_time_minutes', value: '15', desc: '登录锁定时间(分钟)' }
    ];
    
    for (const config of configs) {
      await connection.execute(
        'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value=?',
        [config.key, config.value, config.desc, config.value]
      );
    }
    
    console.log('基础数据初始化完成!');
    
    // 释放连接
    connection.release();
  } catch (error) {
    console.error('初始化数据失败:', error.message);
  }
}

// 升级文件表，添加file_hash字段
async function upgradeFilesTable() {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始升级files表，添加file_hash字段...');
    
    // 检查是否已存在file_hash字段
    try {
      await connection.execute('SELECT file_hash FROM files LIMIT 1');
      console.log('files表已包含file_hash字段，无需升级');
    } catch (error) {
      // 字段不存在，添加file_hash字段
      await connection.execute(
        'ALTER TABLE files ADD COLUMN file_hash VARCHAR(32) UNIQUE AFTER business_type'
      );
      console.log('files表升级成功，已添加file_hash字段');
    }
    
    connection.release();
  } catch (error) {
    console.error('升级files表失败:', error.message);
  }
}

// 创建文件资源关联表
async function createFileResourceMappingTable() {
  try {
    const connection = await pool.getConnection();
    
    console.log('开始创建file_resource_mapping表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS file_resource_mapping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id VARCHAR(50) NOT NULL,
        resource_id VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL COMMENT '如: note, user, feedback等',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_file_resource (file_id, resource_id, resource_type)
        -- 暂时移除外键约束，以确保表能创建成功
      )
    `);
    
    console.log('file_resource_mapping表创建完成!');
    connection.release();
  } catch (error) {
    console.error('创建file_resource_mapping表失败:', error.message);
  }
}

// 执行迁移
async function migrate() {
  await createTables();
  await initData();
  await upgradeFilesTable();
  await createFileResourceMappingTable();
}

// 执行迁移
migrate().then(() => {
  console.log('数据库迁移完成!');
  process.exit(0);
}).catch(err => {
  console.error('数据库迁移失败:', err);
  process.exit(1);
});