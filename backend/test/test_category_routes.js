const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// API基础URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// 测试工具函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// 测试函数
async function runTest(name, testFunction) {
  testResults.total++;
  console.log(`\n开始测试: ${name}`);
  
  try {
    const result = await testFunction();
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed', result });
    console.log(`✓ 测试通过: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
    console.error(`✗ 测试失败: ${name}`);
    console.error(`   错误: ${error.message}`);
  }
}

// 打印测试结果摘要
function printTestSummary() {
  console.log('\n====================================');
  console.log('              测试摘要              ');
  console.log('====================================');
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log('====================================');
  
  // 打印失败的测试详情
  if (testResults.failed > 0) {
    console.log('\n失败的测试详情:');
    testResults.tests
      .filter(test => test.status === 'failed')
      .forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
  }
}

// 测试用例
async function runTests() {
  let authToken = null;
  let testCategoryId = null;
  
  // 1. 测试健康检查接口
  await runTest('健康检查接口', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000 // 设置超时时间为5秒
    });
    if (response.data.status !== 'ok' || response.data.message !== 'Server is running') {
      throw new Error('健康检查失败');
    }
    return response.data;
  });

  try {
    // 2. 测试登录接口
    await runTest('登录接口', async () => {
      // 使用用户提供的正确凭据
      const username = 'admin';
      const password = 'admin123';
      
      console.log(`  使用用户名: ${username}, 密码: ${password} 进行登录`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      if (response.data.code !== 200 || !response.data.data || !response.data.data.token) {
        throw new Error('登录失败: ' + JSON.stringify(response.data));
      }
      
      // 保存认证令牌，用于后续需要认证的测试
      authToken = response.data.data.token;
      console.log('  登录成功，获取到令牌');
      return response.data;
    });

    // 如果登录成功，继续测试需要认证的接口
    if (authToken) {
      // 设置axios默认headers
      const authAxios = axios.create({
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // 3. 测试获取分类列表接口
      await runTest('获取分类列表接口', async () => {
        const response = await authAxios.get(`${API_BASE_URL}/categories`);
        if (response.data.code !== 200 || !response.data.data) {
          throw new Error('获取分类列表失败');
        }
        return response.data;
      });

      // 4. 测试创建分类接口
      await runTest('创建分类接口', async () => {
        const response = await authAxios.post(`${API_BASE_URL}/categories`, {
          name: `测试分类_${Date.now()}`,
          description: '这是一个测试分类',
          parent_id: 0,
          priority: 5,
          status: 1,
          icon: 'category_icon'
        });
        
        if (response.data.code !== 200 || !response.data.data || !response.data.data.id) {
          throw new Error('创建分类失败');
        }
        
        // 保存测试分类ID，用于后续测试
        testCategoryId = response.data.data.id;
        console.log(`  创建的分类ID: ${testCategoryId}`);
        return response.data;
      });

      // 等待一下，确保数据库操作完成
      await delay(500);

      // 5. 测试获取分类详情接口
      await runTest('获取分类详情接口', async () => {
        if (!testCategoryId) {
          throw new Error('没有有效的分类ID，无法测试获取详情');
        }
        
        const response = await authAxios.get(`${API_BASE_URL}/categories/${testCategoryId}`);
        if (response.data.code !== 200 || !response.data.data) {
          throw new Error('获取分类详情失败');
        }
        return response.data;
      });

      // 6. 测试更新分类接口
      await runTest('更新分类接口', async () => {
        if (!testCategoryId) {
          throw new Error('没有有效的分类ID，无法测试更新');
        }
        
        const response = await authAxios.put(`${API_BASE_URL}/categories/${testCategoryId}`, {
          name: `更新后的测试分类_${Date.now()}`,
          description: '这是更新后的测试分类描述',
          parent_id: 0,
          priority: 3,
          status: 1,
          icon: 'updated_category_icon'
        });
        
        if (response.data.code !== 200) {
          throw new Error('更新分类失败');
        }
        return response.data;
      });

      // 7. 测试获取分类笔记数量统计接口
      await runTest('获取分类笔记数量统计接口', async () => {
        const response = await authAxios.get(`${API_BASE_URL}/categories/stats/note-count`);
        if (response.data.code !== 200 || !response.data.data) {
          throw new Error('获取分类笔记数量统计失败');
        }
        return response.data;
      });

      // 8. 测试删除分类接口
      await runTest('删除分类接口', async () => {
        if (!testCategoryId) {
          throw new Error('没有有效的分类ID，无法测试删除');
        }
        
        const response = await authAxios.delete(`${API_BASE_URL}/categories/${testCategoryId}`);
        if (response.data.code !== 200) {
          throw new Error('删除分类失败');
        }
        return response.data;
      });

      // 测试无效ID的情况
      await runTest('测试无效ID获取分类详情', async () => {
        try {
          const response = await authAxios.get(`${API_BASE_URL}/categories/999999`);
          // 如果没有抛出异常，但状态码不是200，也视为失败
          if (response.data.code !== 200) {
            return response.data;
          }
          throw new Error('预期返回404，但实际返回了成功响应');
        } catch (error) {
          // axios会在HTTP状态码不是2xx时抛出异常
          if (error.response && error.response.status === 404) {
            return error.response.data;
          }
          throw error;
        }
      });

      // 测试无效ID的删除
      await runTest('测试无效ID删除分类', async () => {
        try {
          const response = await authAxios.delete(`${API_BASE_URL}/categories/999999`);
          // 如果没有抛出异常，但状态码不是200，也视为失败
          if (response.data.code !== 200) {
            return response.data;
          }
          throw new Error('预期返回404，但实际返回了成功响应');
        } catch (error) {
          // axios会在HTTP状态码不是2xx时抛出异常
          if (error.response && error.response.status === 404) {
            return error.response.data;
          }
          throw error;
        }
      });

    } else {
      console.log('\n⚠️ 登录失败，跳过需要认证的接口测试');
    }
  } catch (error) {
    console.log('\n⚠️ 测试过程中出现异常:', error.message);
  }

  // 打印测试结果摘要
  printTestSummary();
}

// 运行所有测试
console.log('开始运行分类接口测试...');
runTests().catch(error => {
  console.error('测试过程中出现异常:', error);
  printTestSummary();
});