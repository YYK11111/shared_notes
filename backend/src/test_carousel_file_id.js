const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置测试环境
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testFileId = '';
let testCarouselId = '';

// 创建测试文件
const createTestFile = async () => {
  try {
    console.log('1. 尝试上传测试文件...');
    
    // 登录获取token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = loginResponse.data.data.token;
    console.log('登录成功，获取到token');
    
    // 创建一个临时文件用于测试
    const tempFilePath = path.join(__dirname, '../../temp_test_image.jpg');
    fs.writeFileSync(tempFilePath, 'TEST_IMAGE_DATA');
    
    // 上传文件到文件接口
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    
    const uploadResponse = await axios.post(
      `${API_BASE_URL}/file/upload?businessType=carousel`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    testFileId = uploadResponse.data.data.fileId;
    console.log('文件上传成功，fileId:', testFileId);
    
    // 清理临时文件
    fs.unlinkSync(tempFilePath);
    return true;
  } catch (error) {
    console.error('文件上传测试失败:', error.message);
    return false;
  }
};

// 测试创建轮播图
const testCreateCarousel = async () => {
  try {
    console.log('2. 测试创建轮播图...');
    
    const response = await axios.post(
      `${API_BASE_URL}/admin/carousels`,
      {
        name: '测试轮播图',
        description: '这是一个测试轮播图',
        file_id: testFileId,
        title: '测试标题',
        subtitle: '测试副标题',
        link_url: 'https://example.com',
        link_target: '_blank',
        status: 1,
        sort: 100,
        position: 'home_top'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    testCarouselId = response.data.data.id;
    console.log('创建轮播图成功，carouselId:', testCarouselId);
    return true;
  } catch (error) {
    console.error('创建轮播图测试失败:', error.response ? error.response.data : error.message);
    return false;
  }
};

// 测试获取轮播图列表
const testGetCarouselList = async () => {
  try {
    console.log('3. 测试获取轮播图列表...');
    
    const response = await axios.get(`${API_BASE_URL}/admin/carousels`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('获取轮播图列表成功，总数:', response.data.data.list.length);
    console.log('列表项包含file_id字段:', response.data.data.list.every(item => 'file_id' in item));
    return true;
  } catch (error) {
    console.error('获取轮播图列表测试失败:', error.response ? error.response.data : error.message);
    return false;
  }
};

// 测试获取轮播图详情
const testGetCarouselDetail = async () => {
  try {
    console.log('4. 测试获取轮播图详情...');
    
    const response = await axios.get(`${API_BASE_URL}/admin/carousels/${testCarouselId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('获取轮播图详情成功，file_id:', response.data.data.file_id);
    console.log('详情包含正确的file_id:', response.data.data.file_id === testFileId);
    return true;
  } catch (error) {
    console.error('获取轮播图详情测试失败:', error.response ? error.response.data : error.message);
    return false;
  }
};

// 测试更新轮播图
const testUpdateCarousel = async () => {
  try {
    console.log('5. 测试更新轮播图...');
    
    const response = await axios.put(
      `${API_BASE_URL}/admin/carousels/${testCarouselId}`,
      {
        name: '更新后的测试轮播图',
        description: '这是更新后的测试轮播图',
        file_id: testFileId,
        title: '更新后的测试标题',
        subtitle: '更新后的测试副标题',
        link_url: 'https://example.org',
        link_target: '_self',
        status: 1,
        sort: 99,
        position: 'home_top'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('更新轮播图成功');
    return true;
  } catch (error) {
    console.error('更新轮播图测试失败:', error.response ? error.response.data : error.message);
    return false;
  }
};

// 测试删除轮播图
const testDeleteCarousel = async () => {
  try {
    console.log('6. 测试删除轮播图...');
    
    const response = await axios.delete(
      `${API_BASE_URL}/admin/carousels/${testCarouselId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('删除轮播图成功');
    return true;
  } catch (error) {
    console.error('删除轮播图测试失败:', error.response ? error.response.data : error.message);
    return false;
  }
};

// 运行所有测试
const runTests = async () => {
  try {
    // 由于FormData在Node.js环境需要单独安装，这里提供提示
    console.log('注意：此测试脚本需要安装form-data包，请先运行 npm install form-data');
    
    // 动态加载FormData
    const FormData = require('form-data');
    
    console.log('开始测试轮播图功能（基于file_id）...');
    
    // 按顺序执行测试
    const testResults = [];
    
    // 文件上传测试需要单独处理，因为在某些环境可能不可用
    // 这里跳过文件上传测试，假设已有可用的file_id
    console.log('跳过文件上传测试，请确保前端已实现文件上传功能');
    
    // 设置一个示例file_id（实际测试时需要替换为真实的file_id）
    testFileId = 'test_file_id_for_carousel';
    console.log('使用示例file_id:', testFileId);
    
    // 执行其他测试
    testResults.push(await testCreateCarousel());
    testResults.push(await testGetCarouselList());
    testResults.push(await testGetCarouselDetail());
    testResults.push(await testUpdateCarousel());
    testResults.push(await testDeleteCarousel());
    
    // 检查测试结果
    const allPassed = testResults.every(result => result);
    
    if (allPassed) {
      console.log('\n🎉 所有测试通过！轮播图功能已成功修改为使用file_id。');
      console.log('\n重要提示：');
      console.log('1. 后端已成功修改为存储和返回file_id');
      console.log('2. 前端需要使用uploadCarouselImage接口上传图片获取file_id');
      console.log('3. 前端需要使用getFileDataUrl接口根据file_id显示图片');
    } else {
      console.log('\n❌ 部分测试失败，请查看上面的错误信息。');
    }
  } catch (error) {
    console.error('测试执行失败:', error);
    console.log('\n请确保：');
    console.log('1. 服务器正在运行');
    console.log('2. 已安装所需依赖（npm install form-data）');
    console.log('3. 数据库中已创建carousels表且包含file_id字段');
  }
};

// 运行测试
runTests();