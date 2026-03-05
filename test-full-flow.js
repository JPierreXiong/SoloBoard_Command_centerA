/**
 * 完整流程测试脚本
 * 测试: Sign Up -> Sign In -> 访问 Dashboard -> 支付流程
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
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
        validateStatus: () => true,
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    
    if (response.status === 200 || response.status === 201) {
      log('✅ 注册成功！', 'green');
      log(`用户 ID: ${response.data.user?.id}`, 'green');
      return { success: true, data: response.data, cookies: response.headers['set-cookie'] };
    } else {
      log(`❌ 注册失败: ${response.status}`, 'red');
      log(`错误: ${JSON.stringify(response.data)}`, 'red');
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`❌ 注册请求失败: ${error.message}`, 'red');
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
    
    if (response.status === 200) {
      log('✅ 登录成功！', 'green');
      log(`用户 ID: ${response.data.user?.id}`, 'green');
      return { success: true, data: response.data, cookies: response.headers['set-cookie'] };
    } else {
      log(`❌ 登录失败: ${response.status}`, 'red');
      log(`错误: ${JSON.stringify(response.data)}`, 'red');
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`❌ 登录请求失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testDashboardAccess(cookies) {
  section('测试 3: 访问 Dashboard');
  
  try {
    log('尝试访问 /zh/soloboard...', 'yellow');
    
    const response = await axios.get(
      `${BASE_URL}/zh/soloboard`,
      {
        headers: {
          'Cookie': cookies ? cookies.join('; ') : '',
        },
        validateStatus: () => true,
        maxRedirects: 0, // 不自动跟随重定向
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    
    if (response.status === 200) {
      log('✅ Dashboard 访问成功！', 'green');
      return { success: true };
    } else if (response.status === 302 || response.status === 307) {
      const redirectUrl = response.headers.location;
      log(`⚠️  重定向到: ${redirectUrl}`, 'yellow');
      if (redirectUrl && redirectUrl.includes('sign-in')) {
        log('❌ 会话未保持，被重定向到登录页', 'red');
        return { success: false, error: 'Session not persisted' };
      }
      return { success: true, redirect: redirectUrl };
    } else if (response.status === 500) {
      log('❌ 服务器错误 (500)', 'red');
      return { success: false, error: 'Server error' };
    } else {
      log(`❌ 访问失败: ${response.status}`, 'red');
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    log(`❌ Dashboard 访问失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testPaymentFlow(cookies) {
  section('测试 4: 支付流程 (19.9 USD)');
  
  try {
    log('检查定价页面...', 'yellow');
    
    const response = await axios.get(
      `${BASE_URL}/zh/pricing`,
      {
        headers: {
          'Cookie': cookies ? cookies.join('; ') : '',
        },
        validateStatus: () => true,
      }
    );
    
    log(`响应状态: ${response.status}`, 'yellow');
    
    if (response.status === 200) {
      log('✅ 定价页面访问成功！', 'green');
      log('💡 支付流程需要手动测试:', 'yellow');
      log('   1. 访问 http://localhost:3003/zh/pricing', 'yellow');
      log('   2. 选择 Base Plan (19.9 USD)', 'yellow');
      log('   3. 点击购买按钮', 'yellow');
      log('   4. 完成支付流程', 'yellow');
      return { success: true, manual: true };
    } else {
      log(`❌ 定价页面访问失败: ${response.status}`, 'red');
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    log(`❌ 支付流程测试失败: ${error.message}`, 'red');
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
    if (result.manual) {
      log(`     ⚠️  需要手动测试`, 'yellow');
    }
  });
  
  console.log('');
  console.log('='.repeat(70));
  
  if (passed === total) {
    log('🎉 所有自动化测试通过！', 'green');
    log('💡 请手动完成支付流程测试', 'yellow');
  } else {
    log('⚠️  部分测试失败，请检查错误信息。', 'yellow');
  }
  
  console.log('='.repeat(70));
  
  return passed === total;
}

async function main() {
  console.log('\n');
  log('SoloBoard 完整流程测试', 'cyan');
  log('测试: Sign Up -> Sign In -> Dashboard -> Payment', 'cyan');
  console.log('');
  
  // 等待服务器启动
  const serverReady = await waitForServer();
  if (!serverReady) {
    log('\n请先启动开发服务器: pnpm dev', 'yellow');
    process.exit(1);
  }
  
  const results = [];
  let cookies = null;
  
  // 测试注册
  const signUpResult = await testSignUp();
  results.push({ name: '用户注册', ...signUpResult });
  if (signUpResult.success) {
    cookies = signUpResult.cookies;
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试登录
  const signInResult = await testSignIn();
  results.push({ name: '用户登录', ...signInResult });
  if (signInResult.success) {
    cookies = signInResult.cookies || cookies;
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试 Dashboard 访问
  const dashboardResult = await testDashboardAccess(cookies);
  results.push({ name: 'Dashboard 访问', ...dashboardResult });
  
  // 测试支付流程
  const paymentResult = await testPaymentFlow(cookies);
  results.push({ name: '支付流程', ...paymentResult });
  
  // 生成报告
  const allPassed = await generateReport(results);
  
  process.exit(allPassed ? 0 : 1);
}

// 运行测试
main().catch(error => {
  log(`\n❌ 测试执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});








