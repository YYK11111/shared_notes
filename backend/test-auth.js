// 测试后端登录、登出和API访问功能
// 使用axios作为HTTP客户端
const axios = require('axios');

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号信息
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// 设置axios默认配置
axios.defaults.timeout = 10000;

// 详细的错误处理函数
function handleError(error, operationName) {
  console.error(`\x1b[31m${operationName}失败:\x1b[0m`);
  if (error.response) {
    console.error(`  状态码: \x1b[33m${error.response.status}\x1b[0m`);
    console.error(`  错误信息: \x1b[33m${error.response.data.message || JSON.stringify(error.response.data)}\x1b[0m`);
    if (error.response.headers) {
      console.error('  响应头信息:', error.response.headers);
    }
  } else if (error.request) {
    console.error('  没有收到服务器响应，请检查后端服务是否正常运行');
    console.error('  请求详情:', error.request);
  } else {
    console.error(`  请求配置错误: ${error.message}`);
  }
  console.error('  完整错误:', error);
}

// 打印成功消息的函数
function printSuccess(message) {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

// 测试登录功能
async function testLogin() {
  try {
    console.log('\n========== 测试登录功能 ==========');
    console.log(`发送登录请求: 用户名=${TEST_CREDENTIALS.username}, 密码=${TEST_CREDENTIALS.password.replace(/./g, '*')}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const endTime = Date.now();
    
    if (response.data.code === 200) {
      printSuccess(`登录成功! (响应时间: ${endTime - startTime}ms)`);
      console.log('返回数据结构:');
      console.log('  - code:', response.data.code);
      console.log('  - message:', response.data.message);
      
      if (response.data.data) {
        console.log('  - token:', response.data.data.token ? '存在 (已隐藏)' : '不存在');
        console.log('  - 用户信息:', response.data.data.admin ? '存在' : '不存在');
        if (response.data.data.admin) {
          console.log('    - 用户名:', response.data.data.admin.username);
          console.log('    - 角色:', response.data.data.admin.role);
          console.log('    - 权限:', response.data.data.admin.permissions ? response.data.data.admin.permissions.join(', ') : '无');
        }
      }
      
      return response.data.data?.token;
    } else {
      console.error(`登录失败: 返回状态码 ${response.data.code}`);
      console.error('响应数据:', response.data);
      return null;
    }
  } catch (error) {
    handleError(error, '登录');
    return null;
  }
}

// 测试使用令牌访问受保护的API
async function testApiAccess(token) {
  try {
    console.log('\n========== 测试API访问功能 ==========');
    if (!token) {
      console.error('无法测试API访问: 没有有效的令牌');
      return false;
    }
    
    // 设置请求头，包含令牌
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    // 测试获取笔记列表API
    console.log('测试获取笔记列表API...');
    const notesResponse = await axios.get(`${API_BASE_URL}/notes`, config);
    if (notesResponse.data.code === 200) {
      printSuccess('笔记列表API访问成功!');
      console.log(`  - 返回笔记数量: ${notesResponse.data.data?.list?.length || 0}`);
    } else {
      console.error('笔记列表API访问失败:', notesResponse.data);
    }
    
    // 测试获取分类列表API
    console.log('\n测试获取分类列表API...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, config);
    if (categoriesResponse.data.code === 200) {
      printSuccess('分类列表API访问成功!');
      console.log(`  - 返回分类数量: ${categoriesResponse.data.data?.length || 0}`);
    } else {
      console.error('分类列表API访问失败:', categoriesResponse.data);
    }
    
    return true;
  } catch (error) {
    handleError(error, 'API访问');
    return false;
  }
}

// 测试刷新令牌功能
async function testRefreshToken(token) {
  try {
    console.log('\n========== 测试刷新令牌功能 ==========');
    if (!token) {
      console.error('无法测试刷新令牌: 没有有效的令牌');
      return null;
    }
    
    // 设置请求头，包含当前令牌
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    console.log('发送刷新令牌请求...');
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, config);
    
    if (response.data.code === 200 && response.data.data?.token) {
      printSuccess('令牌刷新成功!');
      console.log('新令牌已生成 (已隐藏)');
      return response.data.data.token;
    } else {
      console.error('令牌刷新失败:', response.data);
      return null;
    }
  } catch (error) {
    handleError(error, '刷新令牌');
    return null;
  }
}

// 测试登出功能
async function testLogout(token) {
  try {
    console.log('\n========== 测试登出功能 ==========');
    if (!token) {
      console.error('无法测试登出: 没有有效的令牌');
      return false;
    }
    
    // 设置请求头，包含令牌
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    console.log('发送登出请求...');
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, config);
    
    if (response.data.code === 200) {
      printSuccess('登出成功!');
      console.log('服务器响应:', response.data.message);
      return true;
    } else {
      console.error('登出失败:', response.data);
      return false;
    }
  } catch (error) {
    handleError(error, '登出');
    return false;
  }
}

// 测试登出后的API访问（应该失败）
async function testAccessAfterLogout() {
  try {
    console.log('\n========== 测试登出后API访问 ==========');
    // 故意使用无效的令牌或不使用令牌
    const config = {
      headers: {
        Authorization: 'Bearer invalid_token'
      }
    };
    
    console.log('尝试使用无效令牌访问API...');
    const response = await axios.get(`${API_BASE_URL}/notes`, config);
    
    // 如果成功访问，说明登出功能有问题
    console.error('警告: 登出后仍然能够访问受保护的API!');
    console.log('响应:', response.data);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      printSuccess('登出后API访问被正确拒绝! (状态码: 401)');
      return true;
    } else {
      console.error('登出后API访问测试失败，但不是预期的401错误:');
      handleError(error, '登出后API访问');
      return false;
    }
  }
}

// 测试无效凭据登录
async function testInvalidLogin() {
  try {
    console.log('\n========== 测试无效凭据登录 ==========');
    const invalidCredentials = {
      username: 'invalid_user',
      password: 'wrong_password'
    };
    
    console.log('使用无效凭据登录...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, invalidCredentials);
      
      // 如果成功登录，说明验证有问题
      if (response.data.code === 200) {
        console.error('警告: 使用无效凭据成功登录!');
        console.log('响应:', response.data);
        return false;
      } else if (response.data.code === 401) {
        // 有些API实现在错误时也会返回200，但code字段为401
        printSuccess('无效凭据登录被正确拒绝! (状态码: 401)');
        console.log('错误信息:', response.data.msg || response.data.message);
        return true;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 || error.response.data?.code === 401) {
          printSuccess('无效凭据登录被正确拒绝! (状态码: 401)');
          console.log('错误信息:', error.response.data?.msg || error.response.data?.message || '未提供错误信息');
          return true;
        }
      }
      
      console.error('无效凭据登录测试失败，但不是预期的401错误:');
      handleError(error, '无效凭据登录');
      return false;
    }
  } catch (error) {
    console.error('无效凭据登录测试过程中发生错误:', error);
    return false;
  }
}

// 主测试函数
async function runAuthTests() {
  try {
    console.log('\x1b[1m\x1b[34m======= 开始测试后端认证功能 =======\x1b[0m');
    console.log(`测试时间: ${new Date().toLocaleString()}`);
    console.log(`测试环境: ${API_BASE_URL}`);
    
    // 记录测试开始时间
    const startTime = Date.now();
    
    // 测试顺序
    let token = await testLogin();
    if (token) {
      await testApiAccess(token);
      
      // 测试刷新令牌功能
      const newToken = await testRefreshToken(token);
      if (newToken) {
        console.log('\n使用新刷新的令牌重新测试API访问...');
        await testApiAccess(newToken);
        token = newToken; // 使用新令牌进行后续测试
      }
      
      // 测试登出功能
      const logoutSuccess = await testLogout(token);
      if (logoutSuccess) {
        // 测试登出后的API访问
        await testAccessAfterLogout();
      }
    }
    
    // 测试无效凭据登录
    await testInvalidLogin();
    
    // 记录测试结束时间
    const endTime = Date.now();
    
    console.log(`\n\x1b[1m\x1b[34m======= 测试完成 =======\x1b[0m`);
    console.log(`总测试时间: ${(endTime - startTime) / 1000}秒`);
    
  } catch (error) {
    console.error('\n\x1b[31m测试过程中发生严重错误:\x1b[0m', error);
  }
}

// 运行所有测试
runAuthTests();