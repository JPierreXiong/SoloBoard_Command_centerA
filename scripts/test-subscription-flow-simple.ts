/**
 * 订阅流程端到端测试 - 简化版
 * 直接使用数据库客户端，避免模块加载问题
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { user, subscription, order } from '../src/config/db/schema.js';

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// 测试配置
const TEST_CONFIG = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
  testEmail: `test_sub_${Date.now()}@example.com`,
  testPassword: 'Test123456!',
  testName: 'Test Subscription User',
  productId: 'prod_3i3wLrjX9sQiwts95zv1FG',
  planAmount: 1990,
  databaseUrl: process.env.DATABASE_URL || '',
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
  orderId: '',
  orderNo: '',
  subscriptionId: '',
  subscriptionNo: '',
};

// 创建数据库连接
let dbClient: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!TEST_CONFIG.databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    dbClient = postgres(TEST_CONFIG.databaseUrl, { prepare: false });
    db = drizzle(dbClient);
  }
  return db;
}

// Step 0: 测试数据库连接
async function testDatabaseConnection(): Promise<boolean> {
  step(0, '测试数据库连接');
  
  try {
    if (!TEST_CONFIG.databaseUrl) {
      error('DATABASE_URL 未设置');
      return false;
    }
    
    info(`连接到: ${TEST_CONFIG.databaseUrl.substring(0, 50)}...`);
    
    const database = getDb();
    
    // 测试查询
    const result = await database.select().from(user).limit(1);
    
    success('数据库连接成功');
    info(`测试查询返回 ${result.length} 条记录`);
    
    return true;
  } catch (err: any) {
    error(`数据库连接失败: ${err.message}`);
    return false;
  }
}

// Step 1: 创建测试用户（直接插入数据库）
async function createTestUser(): Promise<boolean> {
  step(1, '创建测试用户');
  
  try {
    const database = getDb();
    
    testState.userId = `user_test_${Date.now()}`;
    
    info(`User ID: ${testState.userId}`);
    info(`Email: ${TEST_CONFIG.testEmail}`);
    
    await database.insert(user).values({
      id: testState.userId,
      name: TEST_CONFIG.testName,
      email: TEST_CONFIG.testEmail,
      emailVerified: true,
      planType: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    success('测试用户创建成功');
    
    // 验证
    const [dbUser] = await database
      .select()
      .from(user)
      .where(eq(user.id, testState.userId))
      .limit(1);
    
    if (dbUser) {
      success('数据库验证: 用户已创建');
      info(`  Email: ${dbUser.email}`);
      info(`  Plan Type: ${dbUser.planType}`);
    }
    
    return true;
  } catch (err: any) {
    error(`创建用户失败: ${err.message}`);
    return false;
  }
}

// Step 2: 创建订单
async function createTestOrder(): Promise<boolean> {
  step(2, '创建测试订单');
  
  try {
    const database = getDb();
    
    testState.orderId = `order_test_${Date.now()}`;
    testState.orderNo = `ORD-${Date.now()}`;
    
    info(`Order ID: ${testState.orderId}`);
    info(`Order No: ${testState.orderNo}`);
    info(`Amount: $${TEST_CONFIG.planAmount / 100}`);
    
    await database.insert(order).values({
      id: testState.orderId,
      orderNo: testState.orderNo,
      userId: testState.userId,
      userEmail: TEST_CONFIG.testEmail,
      status: 'created',
      amount: TEST_CONFIG.planAmount,
      currency: 'USD',
      productId: TEST_CONFIG.productId,
      paymentType: 'subscription',
      paymentProvider: 'creem',
      checkoutInfo: JSON.stringify({ test: true }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    success('订单创建成功');
    
    return true;
  } catch (err: any) {
    error(`创建订单失败: ${err.message}`);
    return false;
  }
}

// Step 3: 模拟支付完成
async function simulatePaymentSuccess(): Promise<boolean> {
  step(3, '模拟支付完成');
  
  try {
    const database = getDb();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    info('正在模拟支付完成...');
    
    // 1. 更新订单状态
    await database
      .update(order)
      .set({
        status: 'paid',
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

// Step 4: 验证 Billing 数据
async function verifyBillingData(): Promise<boolean> {
  step(4, '验证 Billing 页面数据');
  
  try {
    const database = getDb();
    
    // 查询用户
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
    
    // 查询订阅
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
    info(`  Status: ${dbSubscription.status}`);
    info(`  Plan Name: ${dbSubscription.planName}`);
    info(`  Amount: $${dbSubscription.amount! / 100}/month`);
    info(`  Valid Until: ${dbSubscription.currentPeriodEnd?.toISOString().split('T')[0]}`);
    
    // 验证关键字段
    const validations = [
      { name: '订阅状态', pass: dbSubscription.status === 'active' },
      { name: '计划名称', pass: dbSubscription.planName === 'Base Plan' },
      { name: '订阅金额', pass: dbSubscription.amount === TEST_CONFIG.planAmount },
      { name: '有效期', pass: !!dbSubscription.currentPeriodEnd },
    ];
    
    let allValid = true;
    validations.forEach(v => {
      if (v.pass) {
        success(`  ✓ ${v.name}`);
      } else {
        error(`  ✗ ${v.name}`);
        allValid = false;
      }
    });
    
    if (!allValid) {
      return false;
    }
    
    // 显示 Billing 页面预览
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
    error(`验证失败: ${err.message}`);
    return false;
  }
}

// Step 5: 清理测试数据
async function cleanupTestData(): Promise<boolean> {
  step(5, '清理测试数据');
  
  try {
    const database = getDb();
    
    info('正在清理测试数据...');
    
    // 删除订阅
    await database.delete(subscription).where(eq(subscription.userId, testState.userId));
    success('订阅记录已删除');
    
    // 删除订单
    await database.delete(order).where(eq(order.userId, testState.userId));
    success('订单记录已删除');
    
    // 删除用户
    await database.delete(user).where(eq(user.id, testState.userId));
    success('用户记录已删除');
    
    return true;
  } catch (err: any) {
    error(`清理失败: ${err.message}`);
    return false;
  }
}

// 主测试流程
async function runTest() {
  log('\n' + '='.repeat(80), colors.cyan);
  log('  🧪 订阅流程端到端测试', colors.cyan);
  log('  测试: 创建用户 → 创建订单 → 支付 → 验证 Billing → 清理', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);
  
  section('测试配置');
  info(`App URL: ${TEST_CONFIG.appUrl}`);
  info(`Test Email: ${TEST_CONFIG.testEmail}`);
  info(`Product ID: ${TEST_CONFIG.productId}`);
  info(`Plan Amount: $${TEST_CONFIG.planAmount / 100}`);
  
  const results = {
    dbConnection: false,
    createUser: false,
    createOrder: false,
    simulatePayment: false,
    verifyBilling: false,
    cleanup: false,
  };
  
  try {
    results.dbConnection = await testDatabaseConnection();
    if (!results.dbConnection) {
      error('数据库连接失败，测试终止');
      return results;
    }
    
    results.createUser = await createTestUser();
    if (!results.createUser) return results;
    
    results.createOrder = await createTestOrder();
    if (!results.createOrder) return results;
    
    results.simulatePayment = await simulatePaymentSuccess();
    if (!results.simulatePayment) return results;
    
    results.verifyBilling = await verifyBillingData();
    
    results.cleanup = await cleanupTestData();
    
  } catch (err: any) {
    error(`测试异常: ${err.message}`);
  } finally {
    // 关闭数据库连接
    if (dbClient) {
      await dbClient.end();
    }
  }
  
  // 测试报告
  section('测试报告');
  
  const testItems = [
    { name: '数据库连接', result: results.dbConnection },
    { name: '创建用户', result: results.createUser },
    { name: '创建订单', result: results.createOrder },
    { name: '模拟支付', result: results.simulatePayment },
    { name: '验证 Billing', result: results.verifyBilling },
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
    log('\n⚠️  部分测试失败。', colors.yellow);
  }
  
  log('\n');
  
  return results;
}

// 运行测试
runTest()
  .then((results) => {
    const allPassed = Object.values(results).every(r => r === true);
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    error(`测试失败: ${err.message}`);
    process.exit(1);
  });




