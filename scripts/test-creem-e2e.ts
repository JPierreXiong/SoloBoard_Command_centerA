/**
 * Creem 支付完整流程测试
 * 
 * 测试流程：
 * 1. 用户注册 (Sign Up)
 * 2. 用户登录 (Sign In)
 * 3. 创建支付订单
 * 4. 模拟支付完成
 * 5. 验证订阅状态
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

// 测试配置
const TEST_CONFIG = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testEmail: `test_${Date.now()}@example.com`,
  testPassword: 'Test123456!',
  testName: 'Test User',
  productId: process.env.CREEM_PRODUCT_ID_PRO || '', // Pro 版产品 ID
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function section(title: string) {
  log(`\n${'='.repeat(70)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(70)}`, colors.cyan);
}

function step(stepNumber: number, title: string) {
  log(`\n📍 Step ${stepNumber}: ${title}`, colors.magenta);
  log('-'.repeat(70), colors.magenta);
}

// 测试状态
const testState = {
  userId: '',
  sessionToken: '',
  orderId: '',
  checkoutUrl: '',
  subscriptionId: '',
};

// 1. 测试用户注册
async function testSignUp(): Promise<boolean> {
  step(1, '用户注册 (Sign Up)');
  
  try {
    info(`Email: ${TEST_CONFIG.testEmail}`);
    info(`Name: ${TEST_CONFIG.testName}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword,
        name: TEST_CONFIG.testName,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      testState.userId = data.user?.id || '';
      testState.sessionToken = data.session?.token || '';
      
      success('用户注册成功');
      info(`User ID: ${testState.userId}`);
      info(`Session Token: ${testState.sessionToken.substring(0, 20)}...`);
      
      return true;
    } else {
      const errorData = await response.json();
      error(`注册失败: ${response.status}`);
      error(`Error: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (err: any) {
    error(`注册异常: ${err.message}`);
    return false;
  }
}

// 2. 测试用户登录
async function testSignIn(): Promise<boolean> {
  step(2, '用户登录 (Sign In)');
  
  try {
    info(`Email: ${TEST_CONFIG.testEmail}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      testState.sessionToken = data.session?.token || testState.sessionToken;
      
      success('用户登录成功');
      info(`Session Token: ${testState.sessionToken.substring(0, 20)}...`);
      
      return true;
    } else {
      const errorData = await response.json();
      error(`登录失败: ${response.status}`);
      error(`Error: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (err: any) {
    error(`登录异常: ${err.message}`);
    return false;
  }
}

// 3. 测试创建支付订单
async function testCreatePayment(): Promise<boolean> {
  step(3, '创建支付订单 (Create Payment)');
  
  if (!testState.sessionToken) {
    error('未登录，无法创建订单');
    return false;
  }
  
  if (!TEST_CONFIG.productId) {
    warning('未配置产品 ID，请先在 Creem Dashboard 创建产品');
    warning('然后设置环境变量: CREEM_PRODUCT_ID_PRO=prod_xxx');
    return false;
  }
  
  try {
    info(`Product ID: ${TEST_CONFIG.productId}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testState.sessionToken}`,
      },
      body: JSON.stringify({
        productId: TEST_CONFIG.productId,
        provider: 'creem',
        successUrl: `${TEST_CONFIG.appUrl}/payment/success`,
        cancelUrl: `${TEST_CONFIG.appUrl}/payment/cancel`,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      testState.orderId = data.orderId || '';
      testState.checkoutUrl = data.checkoutUrl || '';
      
      success('支付订单创建成功');
      info(`Order ID: ${testState.orderId}`);
      info(`Checkout URL: ${testState.checkoutUrl}`);
      
      log('\n📋 请在浏览器中打开以下链接完成支付:', colors.yellow);
      log(`   ${testState.checkoutUrl}`, colors.cyan);
      log('\n⏳ 等待支付完成...', colors.yellow);
      
      return true;
    } else {
      const errorData = await response.json();
      error(`创建订单失败: ${response.status}`);
      error(`Error: ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (err: any) {
    error(`创建订单异常: ${err.message}`);
    return false;
  }
}

// 4. 测试查询订单状态
async function testCheckOrderStatus(): Promise<boolean> {
  step(4, '查询订单状态 (Check Order Status)');
  
  if (!testState.orderId) {
    error('订单 ID 不存在');
    return false;
  }
  
  try {
    info(`Order ID: ${testState.orderId}`);
    
    const response = await fetch(
      `${TEST_CONFIG.appUrl}/api/payment/order/${testState.orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${testState.sessionToken}`,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      success('订单状态查询成功');
      info(`Status: ${data.status}`);
      info(`Amount: ${data.amount / 100} ${data.currency}`);
      
      if (data.status === 'paid') {
        success('✨ 订单已支付');
        testState.subscriptionId = data.subscriptionId || '';
        return true;
      } else {
        warning(`订单状态: ${data.status}`);
        return false;
      }
    } else {
      error(`查询订单失败: ${response.status}`);
      return false;
    }
  } catch (err: any) {
    error(`查询订单异常: ${err.message}`);
    return false;
  }
}

// 5. 测试查询订阅状态
async function testCheckSubscription(): Promise<boolean> {
  step(5, '查询订阅状态 (Check Subscription)');
  
  if (!testState.subscriptionId) {
    warning('订阅 ID 不存在，可能是一次性支付');
    return true;
  }
  
  try {
    info(`Subscription ID: ${testState.subscriptionId}`);
    
    const response = await fetch(
      `${TEST_CONFIG.appUrl}/api/subscription/${testState.subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${testState.sessionToken}`,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      success('订阅状态查询成功');
      info(`Status: ${data.status}`);
      info(`Plan: ${data.planName || 'N/A'}`);
      info(`Current Period: ${data.currentPeriodStart} - ${data.currentPeriodEnd}`);
      
      if (data.status === 'active') {
        success('✨ 订阅已激活');
        return true;
      } else {
        warning(`订阅状态: ${data.status}`);
        return false;
      }
    } else {
      error(`查询订阅失败: ${response.status}`);
      return false;
    }
  } catch (err: any) {
    error(`查询订阅异常: ${err.message}`);
    return false;
  }
}

// 6. 测试用户权限
async function testUserPermissions(): Promise<boolean> {
  step(6, '验证用户权限 (Check User Permissions)');
  
  try {
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${testState.sessionToken}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      success('用户信息查询成功');
      info(`User ID: ${data.id}`);
      info(`Email: ${data.email}`);
      info(`Plan Type: ${data.planType || 'free'}`);
      
      if (data.planType === 'pro') {
        success('✨ 用户已升级到 Pro 版');
        return true;
      } else {
        warning(`当前计划: ${data.planType || 'free'}`);
        return false;
      }
    } else {
      error(`查询用户信息失败: ${response.status}`);
      return false;
    }
  } catch (err: any) {
    error(`查询用户信息异常: ${err.message}`);
    return false;
  }
}

// 7. 测试 Webhook 接收
async function testWebhookEndpoint(): Promise<boolean> {
  step(7, '测试 Webhook 端点 (Test Webhook Endpoint)');
  
  try {
    info('Testing webhook endpoint availability...');
    
    const webhookUrl = `${TEST_CONFIG.appUrl}/api/payment/notify/creem`;
    info(`Webhook URL: ${webhookUrl}`);
    
    // 只测试端点是否存在，不发送实际数据
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': 'test_signature',
      },
      body: JSON.stringify({
        eventType: 'test',
      }),
    });
    
    // 任何响应都说明端点存在
    if (response.status === 400 || response.status === 401 || response.status === 200) {
      success('Webhook 端点可访问');
      info(`Status: ${response.status}`);
      return true;
    } else if (response.status === 404) {
      error('Webhook 端点不存在 (404)');
      return false;
    } else {
      warning(`Webhook 端点响应异常: ${response.status}`);
      return true; // 不算失败
    }
  } catch (err: any) {
    error(`Webhook 测试异常: ${err.message}`);
    return false;
  }
}

// 主测试流程
async function runE2ETest() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  🧪 Creem Payment E2E Test Suite', colors.cyan);
  log('  端到端测试：注册 → 登录 → 购买 Pro 版', colors.cyan);
  log('='.repeat(70) + '\n', colors.cyan);
  
  // 显示测试配置
  section('测试配置');
  info(`App URL: ${TEST_CONFIG.appUrl}`);
  info(`Test Email: ${TEST_CONFIG.testEmail}`);
  info(`Product ID: ${TEST_CONFIG.productId || '未配置'}`);
  
  // 运行测试流程
  const results = {
    signUp: false,
    signIn: false,
    createPayment: false,
    checkOrder: false,
    checkSubscription: false,
    checkPermissions: false,
    webhookTest: false,
  };
  
  // 1. 注册
  results.signUp = await testSignUp();
  if (!results.signUp) {
    error('注册失败，测试终止');
    return;
  }
  
  // 等待 1 秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. 登录
  results.signIn = await testSignIn();
  if (!results.signIn) {
    error('登录失败，测试终止');
    return;
  }
  
  // 等待 1 秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. 创建支付
  results.createPayment = await testCreatePayment();
  if (!results.createPayment) {
    warning('创建支付失败，跳过后续测试');
  } else {
    // 提示用户完成支付
    log('\n⏸️  测试暂停，请完成以下操作:', colors.yellow);
    log('   1. 在浏览器中打开上面的 Checkout URL', colors.yellow);
    log('   2. 完成支付流程', colors.yellow);
    log('   3. 支付完成后，按 Enter 继续测试', colors.yellow);
    
    // 等待用户输入
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
    
    // 4. 查询订单状态
    results.checkOrder = await testCheckOrderStatus();
    
    // 等待 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. 查询订阅状态
    results.checkSubscription = await testCheckSubscription();
    
    // 等待 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. 验证用户权限
    results.checkPermissions = await testUserPermissions();
  }
  
  // 7. 测试 Webhook
  results.webhookTest = await testWebhookEndpoint();
  
  // 输出测试报告
  section('测试报告');
  
  const testItems = [
    { name: '用户注册', result: results.signUp },
    { name: '用户登录', result: results.signIn },
    { name: '创建支付', result: results.createPayment },
    { name: '订单状态', result: results.checkOrder },
    { name: '订阅状态', result: results.checkSubscription },
    { name: '用户权限', result: results.checkPermissions },
    { name: 'Webhook 端点', result: results.webhookTest },
  ];
  
  log('\n测试结果:', colors.cyan);
  testItems.forEach(item => {
    if (item.result) {
      success(`${item.name}: PASSED`);
    } else {
      error(`${item.name}: FAILED`);
    }
  });
  
  const passedCount = testItems.filter(item => item.result).length;
  const totalCount = testItems.length;
  const passRate = ((passedCount / totalCount) * 100).toFixed(2);
  
  log(`\n通过率: ${passedCount}/${totalCount} (${passRate}%)`, colors.cyan);
  
  if (passedCount === totalCount) {
    log('\n🎉 所有测试通过！Creem 支付集成成功。', colors.green);
  } else {
    log('\n⚠️  部分测试失败，请检查配置和实现。', colors.yellow);
  }
  
  // 清理建议
  section('清理建议');
  info('测试完成后，建议执行以下清理操作：');
  info('1. 删除测试用户账号');
  info('2. 取消测试订阅');
  info('3. 删除测试订单记录');
  
  log('\n');
}

// 运行测试
runE2ETest().catch((err) => {
  error(`E2E test failed: ${err.message}`);
  process.exit(1);
});


