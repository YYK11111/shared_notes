const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:3000/api/notes';
let authToken = '';
let testNoteId = null;
let testBatchNoteIds = [];

// 登录获取token
async function login() {
  try {
    console.log('正在登录...');
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123' // 使用用户提供的正确密码
    });
    authToken = response.data.data.token;
    console.log('登录成功，获取到token');
    return true;
  } catch (error) {
    console.error('登录失败:', error.message);
    return false;
  }
}

// 创建axios实例
function createApiInstance() {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// 测试获取笔记列表接口
async function testGetNotesList() {
  try {
    console.log('\n测试获取笔记列表接口...');
    const api = createApiInstance();
    const response = await api.get(`${BASE_URL}?page=1&pageSize=10`);
    console.log('获取笔记列表成功，返回数据:', response.data);
    return true;
  } catch (error) {
    console.error('获取笔记列表失败:', error.message);
    return false;
  }
}

// 测试创建笔记接口
async function testCreateNote() {
  try {
    console.log('\n测试创建笔记接口...');
    const api = createApiInstance();
    const response = await api.post(BASE_URL, {
      title: '测试笔记标题' + Date.now(),
      content: '测试笔记内容',
      category_ids: [],
      status: 1,
      is_top: 0,
      top_expire_time: null,
      is_home_recommend: 0,
      is_week_selection: 0,
      is_month_recommend: 0
    });
    testNoteId = response.data.data.id;
    console.log('创建笔记成功，笔记ID:', testNoteId);
    return true;
  } catch (error) {
    console.error('创建笔记失败:', error.message);
    return false;
  }
}

// 测试获取单条笔记接口
async function testGetSingleNote() {
  try {
    if (!testNoteId) {
      console.log('\n跳过获取单条笔记测试，没有可用的笔记ID');
      return false;
    }
    console.log('\n测试获取单条笔记接口...');
    const api = createApiInstance();
    const response = await api.get(`${BASE_URL}/${testNoteId}`);
    console.log('获取单条笔记成功，笔记标题:', response.data.data.title);
    return true;
  } catch (error) {
    console.error('获取单条笔记失败:', error.message);
    return false;
  }
}

// 测试更新笔记接口
async function testUpdateNote() {
  try {
    if (!testNoteId) {
      console.log('\n跳過更新笔记测试，没有可用的笔记ID');
      return false;
    }
    console.log('\n测试更新笔记接口...');
    const api = createApiInstance();
    const response = await api.put(`${BASE_URL}/${testNoteId}`, {
      title: '更新后的测试笔记标题' + Date.now(),
      content: '更新后的测试笔记内容',
      category_ids: [],
      status: 1,
      is_top: 0,
      top_expire_time: null,
      is_home_recommend: 0,
      is_week_selection: 0,
      is_month_recommend: 0
    });
    console.log('更新笔记成功:', response.data.msg);
    return true;
  } catch (error) {
    console.error('更新笔记失败:', error.message);
    return false;
  }
}

// 测试切换笔记置顶状态接口
async function testToggleNoteTop() {
  try {
    if (!testNoteId) {
      console.log('\n跳過切换置顶状态测试，没有可用的笔记ID');
      return false;
    }
    console.log('\n测试切换笔记置顶状态接口...');
    const api = createApiInstance();
    // 先设置为置顶
    const topResponse = await api.put(`${BASE_URL}/${testNoteId}/top`, {
      top: 1
    });
    console.log('设置笔记置顶成功:', topResponse.data.msg);
    // 再取消置顶
    const untopResponse = await api.put(`${BASE_URL}/${testNoteId}/top`, {
      top: 0
    });
    console.log('取消笔记置顶成功:', untopResponse.data.msg);
    return true;
  } catch (error) {
    console.error('切换笔记置顶状态失败:', error.message);
    return false;
  }
}

// 测试笔记统计概览接口
async function testNoteStatsOverview() {
  try {
    console.log('\n测试笔记统计概览接口...');
    const api = createApiInstance();
    const response = await api.get(`${BASE_URL}/stats/overview`);
    console.log('获取笔记统计概览成功，总笔记数:', response.data.data.total);
    return true;
  } catch (error) {
    console.error('获取笔记统计概览失败:', error.message);
    return false;
  }
}

// 测试笔记统计详情接口
async function testNoteStatsDetail() {
  try {
    if (!testNoteId) {
      console.log('\n跳過笔记统计详情测试，没有可用的笔记ID');
      return false;
    }
    console.log('\n测试笔记统计详情接口...');
    const api = createApiInstance();
    const response = await api.get(`${BASE_URL}/stats/detail?noteId=${testNoteId}&timeRange=7d&type=views`);
    console.log('获取笔记统计详情成功，返回数据条数:', response.data.data.stats.length);
    return true;
  } catch (error) {
    console.error('获取笔记统计详情失败:', error.message);
    return false;
  }
}

// 批量创建笔记用于测试批量操作
async function batchCreateTestNotes(count = 3) {
  try {
    const api = createApiInstance();
    const createPromises = [];
    
    for (let i = 0; i < count; i++) {
      createPromises.push(api.post(BASE_URL, {
        title: '批量测试笔记' + Date.now() + '-' + i,
        content: '批量测试笔记内容',
        category_ids: [],
        status: 1
      }));
    }
    
    const results = await Promise.all(createPromises);
    testBatchNoteIds = results.map(res => res.data.data.id);
    console.log('批量创建测试笔记成功，创建了', count, '条笔记');
    return true;
  } catch (error) {
    console.error('批量创建测试笔记失败:', error.message);
    return false;
  }
}

// 测试批量修改笔记状态接口
async function testBatchUpdateStatus() {
  try {
    if (!testBatchNoteIds || testBatchNoteIds.length === 0) {
      console.log('\n准备批量创建测试笔记...');
      const created = await batchCreateTestNotes();
      if (!created) {
        console.log('批量创建测试笔记失败，跳过批量修改状态测试');
        return false;
      }
    }
    
    console.log('\n测试批量修改笔记状态接口...');
    const api = createApiInstance();
    // 测试数组形式的ID
    const arrayResponse = await api.post(`${BASE_URL}/batch-update-status`, {
      ids: testBatchNoteIds,
      status: 0
    });
    console.log('批量修改笔记状态成功（数组形式）:', arrayResponse.data.msg);
    
    // 测试单个ID
    const singleResponse = await api.post(`${BASE_URL}/batch-update-status`, {
      ids: testBatchNoteIds[0],
      status: 1
    });
    console.log('批量修改笔记状态成功（单个ID）:', singleResponse.data.msg);
    return true;
  } catch (error) {
    console.error('批量修改笔记状态失败:', error.message);
    return false;
  }
}

// 测试批量笔记统计筛选接口
async function testBatchNoteStatsFilter() {
  try {
    console.log('\n测试批量笔记统计筛选接口...');
    const api = createApiInstance();
    const response = await api.post(`${BASE_URL}/stats/filter`, {
      condition: {
        views_count: 0 // 筛选查看次数大于0的笔记
      },
      timeRange: '7d',
      page: 1,
      pageSize: 10
    });
    console.log('批量笔记统计筛选成功，符合条件的笔记数:', response.data.data.total);
    return true;
  } catch (error) {
    console.error('批量笔记统计筛选失败:', error.message);
    return false;
  }
}

// 测试批量删除笔记接口
async function testBatchDeleteNotes() {
  try {
    if (!testBatchNoteIds || testBatchNoteIds.length === 0) {
      console.log('\n没有可用的批量笔记ID，跳过批量删除测试');
      return false;
    }
    
    console.log('\n测试批量删除笔记接口...');
    const api = createApiInstance();
    const response = await api.post(`${BASE_URL}/batch-delete`, {
      ids: testBatchNoteIds
    });
    console.log('批量删除笔记成功:', response.data.msg);
    testBatchNoteIds = [];
    return true;
  } catch (error) {
    console.error('批量删除笔记失败:', error.message);
    return false;
  }
}

// 测试删除笔记接口
async function testDeleteNote() {
  try {
    if (!testNoteId) {
      console.log('\n没有可用的笔记ID，跳过删除测试');
      return false;
    }
    
    console.log('\n测试删除笔记接口...');
    const api = createApiInstance();
    const response = await api.delete(`${BASE_URL}/${testNoteId}`);
    console.log('删除笔记成功:', response.data.msg);
    testNoteId = null;
    return true;
  } catch (error) {
    console.error('删除笔记失败:', error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试noteRoutes.js中的所有接口...\n');
  
  // 记录测试结果
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  // 先登录获取token
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n登录失败，无法继续测试');
    return;
  }
  
  // 定义测试函数数组
  const testFunctions = [
    { name: '获取笔记列表', fn: testGetNotesList },
    { name: '创建笔记', fn: testCreateNote },
    { name: '获取单条笔记', fn: testGetSingleNote },
    { name: '更新笔记', fn: testUpdateNote },
    { name: '切换笔记置顶状态', fn: testToggleNoteTop },
    { name: '笔记统计概览', fn: testNoteStatsOverview },
    { name: '笔记统计详情', fn: testNoteStatsDetail },
    { name: '批量修改笔记状态', fn: testBatchUpdateStatus },
    { name: '批量笔记统计筛选', fn: testBatchNoteStatsFilter },
    { name: '批量删除笔记', fn: testBatchDeleteNotes },
    { name: '删除笔记', fn: testDeleteNote }
  ];
  
  // 运行每个测试
  for (const test of testFunctions) {
    testResults.total++;
    const startTime = Date.now();
    const success = await test.fn();
    const duration = Date.now() - startTime;
    
    if (success) {
      testResults.passed++;
      testResults.details.push({ name: test.name, status: '通过', duration: duration + 'ms' });
    } else {
      testResults.failed++;
      testResults.details.push({ name: test.name, status: '失败', duration: duration + 'ms' });
    }
  }
  
  // 输出测试总结
  console.log('\n\n测试总结:');
  console.log('总测试数:', testResults.total);
  console.log('通过数:', testResults.passed);
  console.log('失败数:', testResults.failed);
  console.log('\n测试详情:');
  testResults.details.forEach(detail => {
    console.log(`- ${detail.name}: ${detail.status} (${detail.duration})`);
  });
  
  // 保存测试结果到文件
  const resultFilePath = path.join(__dirname, 'note_routes_test_results.json');
  fs.writeFileSync(resultFilePath, JSON.stringify(testResults, null, 2));
  console.log('\n测试结果已保存到:', resultFilePath);
}

// 执行测试
runAllTests().catch(err => {
  console.error('测试过程中发生错误:', err);
});