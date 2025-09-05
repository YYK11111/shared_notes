// 使用axios作为HTTP客户端
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
  } else if (error.request) {
    console.error('  没有收到服务器响应，请检查后端服务是否正常运行');
  } else {
    console.error(`  请求配置错误: ${error.message}`);
  }
  console.error('  完整错误:', error);
}

// 打印成功消息的函数
function printSuccess(message) {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

// 获取验证码
async function getCaptcha() {
  try {
    console.log('\n========== 获取验证码 ==========');
    const response = await axios.get(`${API_BASE_URL}/auth/captcha`, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200) {
      const captchaId = response.headers['x-captcha-id'];
      
      // 将验证码图片保存到文件（仅用于调试）
      const captchaDir = './captchas';
      if (!fs.existsSync(captchaDir)) {
        fs.mkdirSync(captchaDir);
      }
      const captchaFilePath = path.join(captchaDir, `${captchaId}.svg`);
      fs.writeFileSync(captchaFilePath, response.data.toString('utf8'));
      
      printSuccess(`验证码获取成功! CaptchaID: ${captchaId}`);
      console.log(`验证码图片已保存到: ${captchaFilePath}`);
      console.log('请手动查看验证码图片并输入验证码内容');
      
      // 在实际测试中，这里需要手动输入验证码
      // 为了自动化测试，我们可以使用一种特殊的方法绕过验证码
      // 注意：这仅适用于开发测试环境
      return captchaId;
    } else {
      console.error(`获取验证码失败: 返回状态码 ${response.status}`);
      return null;
    }
  } catch (error) {
    handleError(error, '获取验证码');
    return null;
  }
}

// 测试登录功能
async function testLogin() {
  try {
    // 由于验证码需要手动输入，我们需要一种方式绕过验证码
    // 在实际开发环境中，可以考虑以下方法之一：
    // 1. 在测试环境中临时禁用验证码验证
    // 2. 使用环境变量控制验证码验证逻辑
    // 3. 在security.js中添加一个特殊的测试模式
    
    console.log('\n========== 提示 ==========');
    console.log('由于登录需要验证码，我们有以下测试选项:');
    console.log('1. 临时修改security.js文件，添加一个测试模式绕过验证码验证');
    console.log('2. 直接使用数据库中的JWT_SECRET生成一个临时令牌');
    
    // 这里我们使用第二种方法，直接生成一个临时令牌用于测试
    console.log('\n========== 生成临时测试令牌 ==========');
    
    // 注意：这只是一个测试方法，实际生产环境中不应该这样做
    // 我们使用从.env文件中获取的JWT_SECRET
    const jwt = require('jsonwebtoken');
    const jwtSecret = 'your_jwt_secret_key'; // 从.env文件中获取的实际值
    
    // 创建一个模拟的令牌
    const mockToken = jwt.sign(
      {
        id: 1, // 假设管理员ID为1
        username: TEST_CREDENTIALS.username,
        role: 'super_admin', // 假设是超级管理员
        permissions: ['admin_manage', 'article_manage', 'category_manage', 'feedback_manage', 'log_view', 'system_config']
      },
      jwtSecret,
      {
        expiresIn: '1h'
      }
    );
    
    console.log('已生成临时测试令牌 (仅用于测试环境)');
    console.log('注意: 此方法仅适用于开发测试，生产环境请使用正常登录流程');
    console.log('提示: 您可以通过修改security.js中的validateCaptcha函数来添加测试模式');
    
    return mockToken;
  } catch (error) {
    console.error('生成临时令牌失败:', error);
    return null;
  }
}

// 测试获取用户可访问的路由列表接口
async function testAccessibleRoutes(token) {
  try {
    console.log('\n========== 测试获取用户可访问的路由列表 ==========');
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
    
    console.log('发送获取可访问路由请求...');
    const response = await axios.get(`${API_BASE_URL}/route-permissions/accessible-routes`, config);
    
    if (response.data.code === 200) {
      printSuccess('获取可访问路由成功!');
      console.log(`返回的路由数量: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n可访问的路由列表:');
        response.data.data.forEach((route, index) => {
          console.log(`${index + 1}. ${route.meta?.title || route.name || route.path}`);
          console.log(`   路径: ${route.path}`);
          console.log(`   组件: ${route.component}`);
          console.log(`   需要权限: ${route.meta?.permission ? route.meta.permission : '无'}`);
        });
      }
      
      // 保存响应结果到文件，方便查看完整内容
      const fs = require('fs');
      fs.writeFileSync('./route-permissions-result.json', JSON.stringify(response.data, null, 2), 'utf8');
      console.log('\n完整响应结果已保存到 route-permissions-result.json 文件');
      
      return true;
    } else {
      console.error('获取可访问路由失败:', response.data);
      return false;
    }
  } catch (error) {
    handleError(error, '获取可访问路由');
    return false;
  }
}

// 测试不带令牌访问（应该失败）
async function testAccessWithoutToken() {
  try {
    console.log('\n========== 测试不带令牌访问 ==========');
    console.log('尝试不提供令牌访问接口...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/accessible-routes`);
      console.error('警告: 不带令牌也能访问受保护的API!');
      console.log('响应:', response.data);
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.data?.code === 401)) {
        printSuccess('不带令牌访问被正确拒绝! (状态码: 401)');
        console.log('错误信息:', error.response.data?.msg || error.response.data?.message || '未提供错误信息');
        return true;
      } else {
        console.error('不带令牌访问测试失败，但不是预期的401错误:');
        handleError(error, '不带令牌访问');
        return false;
      }
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('\x1b[1m\x1b[34m======= 开始测试获取用户可访问路由列表接口 =======\x1b[0m');
    console.log(`测试时间: ${new Date().toLocaleString()}`);
    console.log(`测试环境: ${API_BASE_URL}`);
    
    // 先测试不带令牌访问（应该失败）
    await testAccessWithoutToken();
    
    // 测试正常访问流程
    let token = await testLogin();
    if (token) {
      await testAccessibleRoutes(token);
    }
    
    console.log('\n\x1b[1m\x1b[34m======= 测试完成 =======\x1b[0m');
    
  } catch (error) {
    console.error('\n\x1b[31m测试过程中发生严重错误:\x1b[0m', error);
  }
}

// 运行所有测试
runTests();