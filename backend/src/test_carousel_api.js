const axios = require('axios');

// 配置axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api/admin',
  timeout: 10000,
});

// 配置auth axios实例
const authApi = axios.create({
  baseURL: 'http://localhost:3000/api/auth',
  timeout: 10000,
});

// 全局变量存储测试数据
let authToken = '';
let createdCarouselId = null;

// 测试用例：登录获取token
async function login() {
  try {
    // 1. 获取验证码
    let captchaId = '';
    let captcha = '1234'; // 这里简化处理，使用固定验证码
    
    try {
      const captchaResponse = await authApi.get('/captcha', {
        responseType: 'arraybuffer'
      });
      captchaId = captchaResponse.headers['x-captcha-id'];
      console.log(`✅ 获取验证码成功，验证码ID: ${captchaId}`);
    } catch (captchaError) {
      console.error('❌ 获取验证码失败，但继续测试（使用默认值）:', captchaError.message);
      captchaId = 'test-captcha-id'; // 测试环境使用默认值
    }
    
    // 2. 登录
    const response = await authApi.post('/login', {
      username: 'admin',
      password: 'admin123',
      captcha: captcha,
      captchaId: captchaId
    });
    
    if (response.data.code === 200 && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ 登录成功，已获取认证token');
      return true;
    } else {
      console.error('❌ 登录失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    if (error.response) {
      console.error('详细错误:', error.response.data);
    }
    return false;
  }
}

// 测试用例：创建轮播图
async function testCreateCarousel() {
  try {
    const response = await api.post('/carousels', {
      name: '测试轮播图',
      description: '这是一个测试用的轮播图',
      image_url: 'https://example.com/test-carousel.jpg',
      title: '测试轮播图标题',
      subtitle: '测试轮播图副标题',
      link_url: 'https://example.com',
      link_target: '_blank',
      status: 1,
      sort: 10,
      position: 'home_top'
    });
    
    if (response.data.code === 200) {
      createdCarouselId = response.data.data.id;
      console.log(`✅ 创建轮播图成功，ID: ${createdCarouselId}`);
      return true;
    } else {
      console.error('❌ 创建轮播图失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 创建轮播图请求失败:', error.message);
    if (error.response) {
      console.error('详细错误:', error.response.data);
    }
    return false;
  }
}

// 测试用例：获取轮播图列表
async function testGetCarousels() {
  try {
    const response = await api.get('/carousels', {
      params: {
        page: 1,
        pageSize: 10
      }
    });
    
    if (response.data.code === 200) {
      console.log(`✅ 获取轮播图列表成功，共 ${response.data.data.list.length} 条记录`);
      return true;
    } else {
      console.error('❌ 获取轮播图列表失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 获取轮播图列表请求失败:', error.message);
    return false;
  }
}

// 测试用例：获取单个轮播图详情
async function testGetCarouselDetail() {
  if (!createdCarouselId) {
    console.error('❌ 获取轮播图详情失败：没有有效的轮播图ID');
    return false;
  }
  
  try {
    const response = await api.get(`/carousels/${createdCarouselId}`);
    
    if (response.data.code === 200) {
      console.log(`✅ 获取轮播图详情成功，名称: ${response.data.data.name}`);
      return true;
    } else {
      console.error('❌ 获取轮播图详情失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 获取轮播图详情请求失败:', error.message);
    return false;
  }
}

// 测试用例：更新轮播图
async function testUpdateCarousel() {
  if (!createdCarouselId) {
    console.error('❌ 更新轮播图失败：没有有效的轮播图ID');
    return false;
  }
  
  try {
    const response = await api.put(`/carousels/${createdCarouselId}`, {
      name: '测试轮播图（已更新）',
      description: '这是一个更新后的测试轮播图',
      image_url: 'https://example.com/test-carousel-updated.jpg',
      title: '更新后的轮播图标题',
      subtitle: '更新后的轮播图副标题',
      link_url: 'https://example.com/updated',
      link_target: '_self',
      status: 1,
      sort: 5,
      position: 'home_top'
    });
    
    if (response.data.code === 200) {
      console.log('✅ 更新轮播图成功');
      return true;
    } else {
      console.error('❌ 更新轮播图失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 更新轮播图请求失败:', error.message);
    return false;
  }
}

// 测试用例：删除轮播图
async function testDeleteCarousel() {
  if (!createdCarouselId) {
    console.error('❌ 删除轮播图失败：没有有效的轮播图ID');
    return false;
  }
  
  try {
    const response = await api.delete(`/carousels/${createdCarouselId}`);
    
    if (response.data.code === 200) {
      console.log('✅ 删除轮播图成功');
      return true;
    } else {
      console.error('❌ 删除轮播图失败:', response.data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 删除轮播图请求失败:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试轮播图管理API...\n');
  
  // 执行测试用例
  const loginResult = await login();
  if (!loginResult) {
    console.log('\n❌ 测试失败：无法登录系统');
    return;
  }
  
  await testGetCarousels();
  await testCreateCarousel();
  await testGetCarouselDetail();
  await testUpdateCarousel();
  await testDeleteCarousel();
  
  console.log('\n测试完成！');
}

// 运行测试
runTests().catch(err => {
  console.error('测试过程中出现错误:', err);
});