/**
 * 认证功能测试脚本
 * 测试 Sign Up 和 Sign In 功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3003';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60) + '\n');
}

async function waitForServer(maxAttempts = 30) {
  log('等待服务器启动...', 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(BASE_URL, { timeout: 2000 });
      log('✅ 服务器已就绪', 'green');
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  log('\n❌ 服务器启动超时', 'red');
  return false;
}

async function testSignUp() {
  section('测试 1: 用户注册 (Sign Up)');
  
  try {
    log(`测试邮箱: ${TEST_EMAIL}`, 'yellow');
    log(`测试密码: ${TEST_PASSWORD}`, 'yellow');
    log(`用户名: ${TEST_NAME}`, 'yellow');
    console.log('');
    
    const response = await axios.post(
      `${BASE_URL}/api/auth/sign-up/email`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // 接受所有状态码
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    log(`响应数据: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    
    if (response.status === 200 || response.status === 201) {
      log('✅ 注册成功！', 'green');
      return { success: true, data: response.data };
    } else {
      log(`❌ 注册失败: ${response.status}`, 'red');
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`❌ 注册请求失败: ${error.message}`, 'red');
    if (error.response) {
      log(`响应状态: ${error.response.status}`, 'red');
      log(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function testSignIn() {
  section('测试 2: 用户登录 (Sign In)');
  
  try {
    log(`测试邮箱: ${TEST_EMAIL}`, 'yellow');
    log(`测试密码: ${TEST_PASSWORD}`, 'yellow');
    console.log('');
    
    const response = await axios.post(
      `${BASE_URL}/api/auth/sign-in/email`,
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    log(`响应数据: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    
    if (response.status === 200) {
      log('✅ 登录成功！', 'green');
      return { success: true, data: response.data };
    } else {
      log(`❌ 登录失败: ${response.status}`, 'red');
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`❌ 登录请求失败: ${error.message}`, 'red');
    if (error.response) {
      log(`响应状态: ${error.response.status}`, 'red');
      log(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function testGetSession(cookies) {
  section('测试 3: 获取会话 (Get Session)');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/auth/get-session`,
      {
        headers: {
          'Cookie': cookies || '',
        },
        validateStatus: () => true,
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    log(`响应数据: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    
    if (response.status === 200 && response.data.user) {
      log('✅ 会话获取成功！', 'green');
      return { success: true, data: response.data };
    } else {
      log(`⚠️  会话未找到或已过期`, 'yellow');
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`❌ 会话请求失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function generateReport(results) {
  section('测试报告');
  
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  
  console.log('测试结果汇总:');
  console.log(`  总测试数: ${total}`);
  log(`  通过: ${passed}`, passed === total ? 'green' : 'yellow');
  log(`  失败: ${failed}`, failed === 0 ? 'green' : 'red');
  console.log('');
  
  console.log('详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`  ${status} 测试 ${index + 1}: ${result.name}`, color);
    if (!result.success && result.error) {
      log(`     错误: ${JSON.stringify(result.error)}`, 'red');
    }
  });
  
  console.log('');
  console.log('='.repeat(60));
  
  if (passed === total) {
    log('🎉 所有测试通过！认证功能正常工作。', 'green');
  } else {
    log('⚠️  部分测试失败，请检查错误信息。', 'yellow');
  }
  
  console.log('='.repeat(60));
}

async function main() {
  console.log('\n');
  log('SoloBoard 认证功能测试', 'blue');
  log('测试 Sign Up 和 Sign In 功能', 'blue');
  console.log('');
  
  // 等待服务器启动
  const serverReady = await waitForServer();
  if (!serverReady) {
    log('\n请先启动开发服务器: pnpm dev', 'yellow');
    process.exit(1);
  }
  
  const results = [];
  
  // 测试注册
  const signUpResult = await testSignUp();
  results.push({ name: '用户注册', ...signUpResult });
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试登录
  const signInResult = await testSignIn();
  results.push({ name: '用户登录', ...signInResult });
  
  // 提取 cookies（如果有）
  let cookies = '';
  if (signInResult.success && signInResult.data) {
    // 尝试从响应中提取 session token
    cookies = signInResult.data.token || '';
  }
  
  // 测试会话
  const sessionResult = await testGetSession(cookies);
  results.push({ name: '获取会话', ...sessionResult });
  
  // 生成报告
  await generateReport(results);
}

// 运行测试
main().catch(error => {
  log(`\n❌ 测试执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});












