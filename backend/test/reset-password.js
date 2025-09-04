const bcrypt = require('bcryptjs');
const { pool } = require('../src/database/dbConfig');

async function resetAdminPassword() {
  try {
    // 连接数据库
    await pool.getConnection();
    console.log('数据库连接成功');
    
    // 定义新密码
    const newPassword = 'admin123';
    
    // 生成bcrypt哈希
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`生成的密码哈希: ${hashedPassword}`);
    
    // 更新管理员密码
    const [result] = await pool.execute(
      'UPDATE admins SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('管理员密码已成功重置为: admin123');
    } else {
      console.log('未找到admin用户，尝试创建新的管理员账户');
      // 尝试创建新的管理员账户
      try {
        await pool.execute(
          'INSERT INTO admins (username, password, nickname, email, role_id, status) VALUES (?, ?, ?, ?, 1, 1)',
          ['admin', hashedPassword, '超级管理员', 'admin@example.com']
        );
        console.log('新的管理员账户已创建，密码为: admin123');
      } catch (err) {
        console.error('创建管理员账户失败:', err.message);
      }
    }
    
    // 关闭连接
    pool.end();
  } catch (error) {
    console.error('重置密码失败:', error.message);
  }
}

// 执行脚本
resetAdminPassword();