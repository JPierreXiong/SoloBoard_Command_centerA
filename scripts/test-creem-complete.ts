/**
 * 完整的 Creem 支付集成测试
 * 
 * 测试流程：
 * 1. 检查环境配置
 * 2. 测试数据库连接
 * 3. 测试用户注册
 * 4. 测试用户登录
 * 5. 创建支付订单
 * 6. 模拟支付完成（需要手动）
 * 7. 验证订阅激活
 * 8. 验证用户权限
 */

// 加载环境变量
import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/core/db';
import { user, order, subscription } from '../src/config/db/schema';
import { eq } from 'drizzle-orm';

// 测试配置
const TEST_CONFIG = {
  testEmail: `test_${Date.now()}@example.com`,
  testPassword: 'Test123456!',
  testName: 'Test User',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
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

// 测试状态
const testState = {
  userId: '',
  userEmail: TEST_CONFIG.testEmail,
  sessionToken: '',
  orderId: '',
  orderNo: '',
  checkoutUrl: '',
  subscriptionId: '',
  subscriptionNo: '',
};

// 测试结果
const testResults = {
  envCheck: false,
  dbConnection: false,
  signup: false,
  signin: false,
  createPayment: false,
  paymentComplete: false,
  subscriptionActive: false,
  userPermissions: false,
};

// 1. 检查环境配置
async function checkEnvironment(): Promise<boolean> {
  section('1. 环境配置检查');
  
  const requiredVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'AUTH_SECRET': process.env.AUTH_SECRET,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'CREEM_API_KEY': process.env.CREEM_API_KEY,
    'CREEM_ENVIRONMENT': process.env.CREEM_ENVIRONMENT,
    'CREEM_SIGNING_SECRET': process.env.CREEM_SIGNING_SECRET,
  };
  
  let allConfigured = true;
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      success(`${key}: 已配置`);
    } else {
      error(`${key}: 未配置`);
      allConfigured = false;
    }
  }
  
  if (!allConfigured) {
    error('\n请先配置环境变量！');
    info('运行配置向导: .\\setup-creem.ps1');
    return false;
  }
  
  success('\n环境配置检查通过');
  return true;
}

// 2. 测试数据库连接
async function testDatabaseConnection(): Promise<boolean> {
  section('2. 数据库连接测试');
  
  try {
    info('正在连接数据库...');
    
    // 测试查询
    const result = await db.select().from(user).limit(1);
    
    success('数据库连接成功');
    info(`数据库中有 ${result.length > 0 ? '数据' : '空表'}`);
    
    return true;
  } catch (err: any) {
    error(`数据库连接失败: ${err.message}`);
    return false;
  }
}

// 3. 测试用户注册
async function testSignup(): Promise<boolean> {
  section('3. 用户注册测试');
  
  try {
    info(`Email: ${TEST_CONFIG.testEmail}`);
    info(`Name: ${TEST_CONFIG.testName}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/auth/sign-up/email`, {
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
    
    const data = await response.json();
    
    if (response.ok && data.user) {
      testState.userId = data.user.id;
      testState.sessionToken = data.token || '';
      
      success('用户注册成功');
      info(`User ID: ${testState.userId}`);
      
      return true;
    } else {
      error(`注册失败: ${response.status}`);
      error(`错误信息: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    error(`注册异常: ${err.message}`);
    return false;
  }
}

// 4. 测试用户登录
async function testSignin(): Promise<boolean> {
  section('4. 用户登录测试');
  
  try {
    info(`Email: ${TEST_CONFIG.testEmail}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      testState.sessionToken = data.token;
      
      success('用户登录成功');
      info(`Session Token: ${testState.sessionToken.substring(0, 20)}...`);
      
      return true;
    } else {
      error(`登录失败: ${response.status}`);
      error(`错误信息: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    error(`登录异常: ${err.message}`);
    return false;
  }
}

// 5. 创建支付订单
async function testCreatePayment(): Promise<boolean> {
  section('5. 创建支付订单测试');
  
  if (!testState.sessionToken) {
    error('未登录，无法创建订单');
    return false;
  }
  
  try {
    info('正在创建支付订单...');
    
    // 这里需要实际的产品ID，从环境变量获取
    const productId = process.env.CREEM_PRODUCT_ID_PRO || 'prod_test';
    
    info(`Product ID: ${productId}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${testState.sessionToken}`,
      },
      body: JSON.stringify({
        productId: productId,
        provider: 'creem',
        planName: 'pro',
        successUrl: `${TEST_CONFIG.appUrl}/payment/success`,
        cancelUrl: `${TEST_CONFIG.appUrl}/payment/cancel`,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.checkoutUrl) {
      testState.orderId = data.orderId || '';
      testState.orderNo = data.orderNo || '';
      testState.checkoutUrl = data.checkoutUrl;
      
      success('支付订单创建成功');
      info(`Order No: ${testState.orderNo}`);
      info(`Checkout URL: ${testState.checkoutUrl}`);
      
      return true;
    } else {
      error(`创建订单失败: ${response.status}`);
      error(`错误信息: ${JSON.stringify(data)}`);
      
      if (data.message && data.message.includes('product')) {
        warning('\n提示: 请先在 Creem Dashboard 创建产品');
        warning('然后设置环境变量: CREEM_PRODUCT_ID_PRO=prod_xxx');
      }
      
      return false;
    }
  } catch (err: any) {
    error(`创建订单异常: ${err.message}`);
    return false;
  }
}

// 6. 等待支付完成
async function waitForPaymentComplete(): Promise<boolean> {
  section('6. 等待支付完成');
  
  if (!testState.orderNo) {
    error('订单号不存在');
    return false;
  }
  
  log('\n📋 请在浏览器中打开以下链接完成支付:', colors.yellow);
  log(`   ${testState.checkoutUrl}`, colors.cyan);
  log('\n⏳ 支付完成后，按 Enter 继续测试...', colors.yellow);
  
  // 等待用户输入
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
  
  // 检查订单状态
  try {
    info('正在检查订单状态...');
    
    const orderRecord = await db.select().from(order).where(eq(order.orderNo, testState.orderNo)).limit(1);
    
    if (orderRecord.length > 0) {
      const orderData = orderRecord[0];
      
      info(`订单状态: ${orderData.status}`);
      
      if (orderData.status === 'paid') {
        success('✨ 订单已支付');
        testState.subscriptionNo = orderData.subscriptionNo || '';
        return true;
      } else {
        warning(`订单状态: ${orderData.status}`);
        warning('请确认支付已完成');
        return false;
      }
    } else {
      error('订单不存在');
      return false;
    }
  } catch (err: any) {
    error(`检查订单失败: ${err.message}`);
    return false;
  }
}

// 7. 验证订阅激活
async function testSubscriptionActive(): Promise<boolean> {
  section('7. 验证订阅激活');
  
  if (!testState.subscriptionNo) {
    warning('订阅号不存在，可能是一次性支付');
    return true;
  }
  
  try {
    info(`Subscription No: ${testState.subscriptionNo}`);
    
    const subscriptionRecord = await db.select().from(subscription).where(eq(subscription.subscriptionNo, testState.subscriptionNo)).limit(1);
    
    if (subscriptionRecord.length > 0) {
      const subData = subscriptionRecord[0];
      
      success('订阅记录存在');
      info(`状态: ${subData.status}`);
      info(`计划: ${subData.planName || 'N/A'}`);
      info(`周期: ${subData.currentPeriodStart?.toISOString()} - ${subData.currentPeriodEnd?.toISOString()}`);
      
      if (subData.status === 'active') {
        success('✨ 订阅已激活');
        return true;
      } else {
        warning(`订阅状态: ${subData.status}`);
        return false;
      }
    } else {
      error('订阅记录不存在');
      return false;
    }
  } catch (err: any) {
    error(`查询订阅失败: ${err.message}`);
    return false;
  }
}

// 8. 验证用户权限
async function testUserPermissions(): Promise<boolean> {
  section('8. 验证用户权限');
  
  try {
    info(`User ID: ${testState.userId}`);
    
    const userRecord = await db.select().from(user).where(eq(user.id, testState.userId)).limit(1);
    
    if (userRecord.length > 0) {
      const userData = userRecord[0];
      
      success('用户信息查询成功');
      info(`Email: ${userData.email}`);
      info(`Plan Type: ${userData.planType || 'free'}`);
      
      if (userData.planType === 'pro') {
        success('✨ 用户已升级到 Pro 版');
        return true;
      } else {
        warning(`当前计划: ${userData.planType || 'free'}`);
        warning('用户权限未更新，可能需要检查 Webhook');
        return false;
      }
    } else {
      error('用户不存在');
      return false;
    }
  } catch (err: any) {
    error(`查询用户失败: ${err.message}`);
    return false;
  }
}

// 主测试流程
async function runCompleteTest() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  🧪 Creem 支付完整集成测试', colors.cyan);
  log('  测试流程: 注册 → 登录 → 购买 → 验证权限', colors.cyan);
  log('='.repeat(70) + '\n', colors.cyan);
  
  // 显示测试配置
  info(`测试邮箱: ${TEST_CONFIG.testEmail}`);
  info(`应用地址: ${TEST_CONFIG.appUrl}`);
  
  // 1. 环境检查
  testResults.envCheck = await checkEnvironment();
  if (!testResults.envCheck) {
    error('\n❌ 环境配置不完整，测试终止');
    process.exit(1);
  }
  
  // 2. 数据库连接
  testResults.dbConnection = await testDatabaseConnection();
  if (!testResults.dbConnection) {
    error('\n❌ 数据库连接失败，测试终止');
    process.exit(1);
  }
  
  // 3. 用户注册
  testResults.signup = await testSignup();
  if (!testResults.signup) {
    error('\n❌ 用户注册失败，测试终止');
    process.exit(1);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. 用户登录
  testResults.signin = await testSignin();
  if (!testResults.signin) {
    error('\n❌ 用户登录失败，测试终止');
    process.exit(1);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 5. 创建支付
  testResults.createPayment = await testCreatePayment();
  if (!testResults.createPayment) {
    warning('\n⚠️  创建支付失败，跳过后续测试');
  } else {
    // 6. 等待支付完成
    testResults.paymentComplete = await waitForPaymentComplete();
    
    if (testResults.paymentComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 7. 验证订阅
      testResults.subscriptionActive = await testSubscriptionActive();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 8. 验证权限
      testResults.userPermissions = await testUserPermissions();
    }
  }
  
  // 输出测试报告
  section('测试报告');
  
  const testItems = [
    { name: '环境配置', result: testResults.envCheck },
    { name: '数据库连接', result: testResults.dbConnection },
    { name: '用户注册', result: testResults.signup },
    { name: '用户登录', result: testResults.signin },
    { name: '创建支付', result: testResults.createPayment },
    { name: '支付完成', result: testResults.paymentComplete },
    { name: '订阅激活', result: testResults.subscriptionActive },
    { name: '用户权限', result: testResults.userPermissions },
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
    log('\n✅ 测试合格，可以生成正式报告', colors.green);
  } else {
    log('\n⚠️  部分测试失败，请检查并修复问题。', colors.yellow);
    log('\n❌ 测试不合格，需要解决问题后重新测试', colors.red);
  }
  
  log('\n');
  process.exit(passedCount === totalCount ? 0 : 1);
}

// 运行测试
runCompleteTest().catch((err) => {
  error(`测试失败: ${err.message}`);
  console.error(err);
  process.exit(1);
});

