const { pool } = require('../database/db');

const { query } = require('../../database/dbConfig');

async function queryRoles() {
  try {
    console.log('查询roles表结构...');
    const rolesStructure = await query(
      'SHOW COLUMNS FROM roles'
    );
    console.log('roles表结构:', rolesStructure);

    console.log('\n查询roles表数据...');
    const rolesData = await query(
      'SELECT * FROM roles'
    );
    console.log('roles表数据:', rolesData);

    console.log('\n查询管理员表数据...');
    const adminsData = await query(
      'SELECT a.*, r.name as role_name, r.code as role_code FROM admins a LEFT JOIN roles r ON a.role_id = r.id'
    );
    console.log('管理员表数据:', adminsData);

    console.log('\n查询权限表数据...');
    const permissionsData = await query(
      'SELECT * FROM permissions'
    );
    console.log('权限表数据:', permissionsData);

  } catch (error) {
    console.error('查询数据库失败:', error);
  } finally {
    process.exit();
  }
}

queryRoles();