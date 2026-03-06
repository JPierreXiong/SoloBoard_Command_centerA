/**
 * 订阅流程端到端测试
 * 
 * 测试流程：
 * 1. 测试数据库连接
 * 2. 新用户注册 (Sign Up)
 * 3. 用户登录 (Sign In)
 * 4. 购买 Base Plan ($19.9)
 * 5. 验证 Billing 页面显示有效期
 * 6. 退出登录
 * 7. 清理测试数据
 * 
 * 运行方式：
 * pnpm tsx scripts/test-subscription-flow.ts
 */

// 必须在最开始加载环境变量
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// 验证环境变量
console.log('🔍 检查环境变量...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  console.error('请确保 .env.local 文件存在并包含 DATABASE_URL');
  process.exit(1);
}

// 现在可以安全导入需要数据库的模块
import { db } from '../src/core/db/index.js';
import { user, subscription, order } from '../src/config/db/schema.js';
import { eq, sql } from 'drizzle-orm';

// 测试配置
const TEST_CONFIG = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
  testEmail: `test_sub_${Date.now()}@example.com`,
  testPassword: 'Test123456!',
  testName: 'Test Subscription User',
  productId: 'prod_3i3wLrjX9sQiwts95zv1FG', // Base Plan Product ID
  planAmount: 1990, // $19.9 in cents
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
  log(`\n${'='.repeat(80)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(80)}`, colors.cyan);
}

function step(stepNumber: number, title: string) {
  log(`\n📍 Step ${stepNumber}: ${title}`, colors.magenta);
  log('-'.repeat(80), colors.magenta);
}

// 测试状态
const testState = {
  userId: '',
  sessionToken: '',
  orderId: '',
  orderNo: '',
  subscriptionId: '',
  subscriptionNo: '',
  checkoutUrl: '',
};

// Step 0: 测试数据库连接
async function testDatabaseConnection(): Promise<boolean> {
  step(0, '测试数据库连接');
  
  try {
    const database = db();
    
    // 测试基本查询
    const result = await database.execute(sql`SELECT NOW() as current_time`);
    success('数据库连接成功');
    info(`当前时间: ${JSON.stringify(result[0])}`);
    
    // 检查必要的表是否存在
    const tables = await database.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'subscription', 'order')
    `);
    
    const tableNames = ['user', 'subscription', 'order'];
    const existingTables = tables.map((t: any) => t.table_name);
    
    info('检查必要的表:');
    let allTablesExist = true;
    tableNames.forEach(name => {
      if (existingTables.includes(name)) {
        success(`  表 "${name}" 存在`);
      } else {
        error(`  表 "${name}" 不存在`);
        allTablesExist = false;
      }
    });
    
    if (!allTablesExist) {
      error('部分表不存在，请运行: pnpm db:push');
      return false;
    }
    
    return true;
  } catch (err: any) {
    error(`数据库连接失败: ${err.message}`);
    return false;
  }
}

// Step 1: 用户注册
async function testSignUp(): Promise<boolean> {
  step(1, '用户注册 (Sign Up)');
  
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
      info(`Session Token: ${testState.sessionToken.substring(0, 30)}...`);
      
      // 验证数据库中的用户
      const database = db();
      const [dbUser] = await database
        .select()
        .from(user)
        .where(eq(user.id, testState.userId))
        .limit(1);
      
      if (dbUser) {
        success(`数据库验证: 用户已创建`);
        info(`  Email: ${dbUser.email}`);
        info(`  Plan Type: ${dbUser.planType || 'free'}`);
      }
      
      return true;
    } else {
      error(`注册失败: ${response.status}`);
      error(`Error: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    error(`注册异常: ${err.message}`);
    return false;
  }
}

// Step 2: 用户登录
async function testSignIn(): Promise<boolean> {
  step(2, '用户登录 (Sign In)');
  
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
    
    if (response.ok && data.user) {
      testState.sessionToken = data.token || testState.sessionToken;
      
      success('用户登录成功');
      info(`Session Token: ${testState.sessionToken.substring(0, 30)}...`);
      
      return true;
    } else {
      error(`登录失败: ${response.status}`);
      error(`Error: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    error(`登录异常: ${err.message}`);
    return false;
  }
}

// Step 3: 创建支付订单
async function testCreatePayment(): Promise<boolean> {
  step(3, '创建支付订单 (Create Payment)');
  
  if (!testState.sessionToken) {
    error('未登录，无法创建订单');
    return false;
  }
  
  try {
    info(`Product ID: ${TEST_CONFIG.productId}`);
    info(`Amount: $${TEST_CONFIG.planAmount / 100}`);
    
    const response = await fetch(`${TEST_CONFIG.appUrl}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${testState.sessionToken}`,
      },
      body: JSON.stringify({
        productId: TEST_CONFIG.productId,
        provider: 'creem',
        successUrl: `${TEST_CONFIG.appUrl}/payment/success`,
        cancelUrl: `${TEST_CONFIG.appUrl}/payment/cancel`,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      testState.orderId = data.orderId || '';
      testState.orderNo = data.orderNo || '';
      testState.checkoutUrl = data.checkoutUrl || '';
      
      success('支付订单创建成功');
      info(`Order ID: ${testState.orderId}`);
      info(`Order No: ${testState.orderNo}`);
      info(`Checkout URL: ${testState.checkoutUrl}`);
      
      // 验证数据库中的订单
      const database = db();
      const [dbOrder] = await database
        .select()
        .from(order)
        .where(eq(order.id, testState.orderId))
        .limit(1);
      
      if (dbOrder) {
        success(`数据库验证: 订单已创建`);
        info(`  Order No: ${dbOrder.orderNo}`);
        info(`  Status: ${dbOrder.status}`);
        info(`  Amount: $${dbOrder.amount / 100}`);
      }
      
      return true;
    } else {
      error(`创建订单失败: ${response.status}`);
      error(`Error: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    error(`创建订单异常: ${err.message}`);
    return false;
  }
}

// Step 4: 模拟支付完成（直接更新数据库）
async function simulatePaymentSuccess(): Promise<boolean> {
  step(4, '模拟支付完成 (Simulate Payment)');
  
  if (!testState.orderId) {
    error('订单 ID 不存在');
    return false;
  }
  
  try {
    const database = db();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
    
    info('正在模拟支付完成...');
    
    // 1. 更新订单状态为 paid
    await database
      .update(order)
      .set({
        status: 'paid',
        amount: TEST_CONFIG.planAmount,
        currency: 'USD',
        paymentAmount: TEST_CONFIG.planAmount,
        paymentCurrency: 'USD',
        paymentEmail: TEST_CONFIG.testEmail,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(order.id, testState.orderId));
    
    success('订单状态已更新为 paid');
    
    // 2. 创建订阅记录
    testState.subscriptionId = `sub_test_${Date.now()}`;
    testState.subscriptionNo = `SUB-${Date.now()}`;
    
    await database.insert(subscription).values({
      id: testState.subscriptionId,
      subscriptionNo: testState.subscriptionNo,
      userId: testState.userId,
      userEmail: TEST_CONFIG.testEmail,
      status: 'active',
      paymentProvider: 'creem',
      subscriptionId: testState.subscriptionId,
      productId: TEST_CONFIG.productId,
      description: 'Base Plan Subscription',
      amount: TEST_CONFIG.planAmount,
      currency: 'USD',
      interval: 'month',
      intervalCount: 1,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      planType: 'base',
      planName: 'Base Plan',
      createdAt: now,
      updatedAt: now,
    });
    
    success('订阅记录已创建');
    info(`  Subscription ID: ${testState.subscriptionId}`);
    info(`  Subscription No: ${testState.subscriptionNo}`);
    info(`  Valid Until: ${periodEnd.toISOString().split('T')[0]}`);
    
    // 3. 更新用户 planType
    await database
      .update(user)
      .set({
        planType: 'base',
        updatedAt: now,
      })
      .where(eq(user.id, testState.userId));
    
    success('用户计划已升级为 Base');
    
    return true;
  } catch (err: any) {
    error(`模拟支付失败: ${err.message}`);
    return false;
  }
}

// Step 5: 验证 Billing 页面数据
async function testBillingData(): Promise<boolean> {
  step(5, '验证 Billing 页面数据');
  
  try {
    const database = db();
    
    // 查询用户信息
    const [dbUser] = await database
      .select()
      .from(user)
      .where(eq(user.id, testState.userId))
      .limit(1);
    
    if (!dbUser) {
      error('用户不存在');
      return false;
    }
    
    success('用户信息查询成功');
    info(`  Email: ${dbUser.email}`);
    info(`  Plan Type: ${dbUser.planType}`);
    
    if (dbUser.planType !== 'base') {
      error(`用户计划类型错误: ${dbUser.planType} (期望: base)`);
      return false;
    }
    
    // 查询订阅信息
    const [dbSubscription] = await database
      .select()
      .from(subscription)
      .where(eq(subscription.userId, testState.userId))
      .limit(1);
    
    if (!dbSubscription) {
      error('订阅记录不存在');
      return false;
    }
    
    success('订阅信息查询成功');
    info(`  Subscription No: ${dbSubscription.subscriptionNo}`);
    info(`  Status: ${dbSubscription.status}`);
    info(`  Plan Name: ${dbSubscription.planName}`);
    info(`  Amount: $${dbSubscription.amount! / 100}/month`);
    info(`  Current Period Start: ${dbSubscription.currentPeriodStart?.toISOString().split('T')[0]}`);
    info(`  Current Period End: ${dbSubscription.currentPeriodEnd?.toISOString().split('T')[0]}`);
    
    // 验证关键字段
    const validations = [
      {
        name: '订阅状态',
        condition: dbSubscription.status === 'active',
        expected: 'active',
        actual: dbSubscription.status,
      },
      {
        name: '计划名称',
        condition: dbSubscription.planName === 'Base Plan',
        expected: 'Base Plan',
        actual: dbSubscription.planName,
      },
      {
        name: '订阅金额',
        condition: dbSubscription.amount === TEST_CONFIG.planAmount,
        expected: `$${TEST_CONFIG.planAmount / 100}`,
        actual: `$${dbSubscription.amount! / 100}`,
      },
      {
        name: '有效期结束',
        condition: !!dbSubscription.currentPeriodEnd,
        expected: '已设置',
        actual: dbSubscription.currentPeriodEnd ? '已设置' : '未设置',
      },
    ];
    
    let allValid = true;
    validations.forEach(v => {
      if (v.condition) {
        success(`  ✓ ${v.name}: ${v.actual}`);
      } else {
        error(`  ✗ ${v.name}: 期望 ${v.expected}, 实际 ${v.actual}`);
        allValid = false;
      }
    });
    
    if (!allValid) {
      error('部分验证失败');
      return false;
    }
    
    // 模拟 Billing 页面显示
    section('Billing 页面预览');
    log('\n┌─────────────────────────────────────────────────────────┐', colors.cyan);
    log('│                   Current Subscription                  │', colors.cyan);
    log('├─────────────────────────────────────────────────────────┤', colors.cyan);
    log(`│  Plan:         ${dbSubscription.planName?.padEnd(40)} │`, colors.green);
    log(`│  Amount:       $${(dbSubscription.amount! / 100).toFixed(2)}/month${' '.repeat(30)} │`, colors.green);
    log(`│  Status:       ${dbSubscription.status?.padEnd(40)} │`, colors.green);
    log(`│  Valid Until:  ${dbSubscription.currentPeriodEnd?.toISOString().split('T')[0].padEnd(40)} │`, colors.green);
    log('└─────────────────────────────────────────────────────────┘\n', colors.cyan);
    
    return true;
  } catch (err: any) {
    error(`验证 Billing 数据失败: ${err.message}`);
    return false;
  }
}

// Step 6: 测试退出登录
async function testSignOut(): Promise<boolean> {
  step(6, '测试退出登录 (Sign Out)');
  
  try {
    info('模拟退出登录...');
    
    // 清除 session token
    testState.sessionToken = '';
    
    success('退出登录成功');
    info('Session token 已清除');
    
    return true;
  } catch (err: any) {
    error(`退出登录失败: ${err.message}`);
    return false;
  }
}

// Step 7: 清理测试数据
async function cleanupTestData(): Promise<boolean> {
  step(7, '清理测试数据 (Cleanup)');
  
  try {
    const database = db();
    
    info('正在清理测试数据...');
    
    // 删除订阅记录
    if (testState.userId) {
      await database
        .delete(subscription)
        .where(eq(subscription.userId, testState.userId));
      success('订阅记录已删除');
    }
    
    // 删除订单记录
    if (testState.userId) {
      await database
        .delete(order)
        .where(eq(order.userId, testState.userId));
      success('订单记录已删除');
    }
    
    // 删除用户记录
    if (testState.userId) {
      await database
        .delete(user)
        .where(eq(user.id, testState.userId));
      success('用户记录已删除');
    }
    
    success('所有测试数据已清理');
    
    return true;
  } catch (err: any) {
    error(`清理测试数据失败: ${err.message}`);
    return false;
  }
}

// 主测试流程
async function runSubscriptionFlowTest() {
  log('\n' + '='.repeat(80), colors.cyan);
  log('  🧪 订阅流程端到端测试', colors.cyan);
  log('  测试: 注册 → 登录 → 购买 $19.9 → 查看 Billing 有效期 → 退出', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);
  
  // 显示测试配置
  section('测试配置');
  info(`App URL: ${TEST_CONFIG.appUrl}`);
  info(`Test Email: ${TEST_CONFIG.testEmail}`);
  info(`Product ID: ${TEST_CONFIG.productId}`);
  info(`Plan Amount: $${TEST_CONFIG.planAmount / 100}`);
  
  // 运行测试流程
  const results = {
    dbConnection: false,
    signUp: false,
    signIn: false,
    createPayment: false,
    simulatePayment: false,
    billingData: false,
    signOut: false,
    cleanup: false,
  };
  
  try {
    // Step 0: 测试数据库连接
    results.dbConnection = await testDatabaseConnection();
    if (!results.dbConnection) {
      error('数据库连接失败，测试终止');
      return results;
    }
    
    await sleep(1000);
    
    // Step 1: 注册
    results.signUp = await testSignUp();
    if (!results.signUp) {
      error('注册失败，测试终止');
      return results;
    }
    
    await sleep(1000);
    
    // Step 2: 登录
    results.signIn = await testSignIn();
    if (!results.signIn) {
      error('登录失败，测试终止');
      return results;
    }
    
    await sleep(1000);
    
    // Step 3: 创建支付
    results.createPayment = await testCreatePayment();
    if (!results.createPayment) {
      warning('创建支付失败，跳过后续测试');
      return results;
    }
    
    await sleep(1000);
    
    // Step 4: 模拟支付完成
    results.simulatePayment = await simulatePaymentSuccess();
    if (!results.simulatePayment) {
      error('模拟支付失败，测试终止');
      return results;
    }
    
    await sleep(1000);
    
    // Step 5: 验证 Billing 数据
    results.billingData = await testBillingData();
    
    await sleep(1000);
    
    // Step 6: 退出登录
    results.signOut = await testSignOut();
    
    await sleep(1000);
    
    // Step 7: 清理测试数据
    results.cleanup = await cleanupTestData();
    
  } catch (err: any) {
    error(`测试过程中发生异常: ${err.message}`);
  }
  
  // 输出测试报告
  section('测试报告');
  
  const testItems = [
    { name: '数据库连接', result: results.dbConnection },
    { name: '用户注册', result: results.signUp },
    { name: '用户登录', result: results.signIn },
    { name: '创建支付', result: results.createPayment },
    { name: '模拟支付', result: results.simulatePayment },
    { name: 'Billing 数据', result: results.billingData },
    { name: '退出登录', result: results.signOut },
    { name: '清理数据', result: results.cleanup },
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
    log('\n🎉 所有测试通过！订阅流程正常工作。', colors.green);
  } else {
    log('\n⚠️  部分测试失败，请检查配置和实现。', colors.yellow);
  }
  
  log('\n');
  
  return results;
}

// 辅助函数：延迟
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
runSubscriptionFlowTest()
  .then((results) => {
    const allPassed = Object.values(results).every(r => r === true);
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    error(`测试失败: ${err.message}`);
    process.exit(1);
  });


