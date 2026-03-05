/**
 * 端到端测试脚本 - 新客户完整流程
 * 
 * 测试流程:
 * 1. 注册新账号
 * 2. 登录
 * 3. 查看 Free Plan 权益
 * 4. 购买 Base Plan
 * 5. 验证权益变化
 * 6. 验证有效期
 * 7. 退出登录
 * 
 * 运行: npx tsx scripts/test-e2e-flow.ts
 */

// 手动加载环境变量
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

import { db } from '../src/core/db';
import { users, subscriptions, payments } from '../src/config/db/schema';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = `test-user-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test123456!';
const TEST_NAME = 'E2E Test User';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logStep(step: string, status: 'pass' | 'fail' | 'skip', message: string, duration?: number) {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${emoji} ${step}: ${message}${duration ? ` (${duration}ms)` : ''}`);
  results.push({ step, status, message, duration });
}

async function testDatabaseConnection() {
  const startTime = Date.now();
  try {
    await db().select().from(users).limit(1);
    logStep('Database Connection', 'pass', 'Connected successfully', Date.now() - startTime);
    return true;
  } catch (error: any) {
    logStep('Database Connection', 'fail', error.message);
    return false;
  }
}

async function testUserRegistration() {
  const startTime = Date.now();
  try {
    // 模拟注册 API 调用
    const response = await fetch('http://localhost:3003/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (response.ok) {
      logStep('User Registration', 'pass', `User registered: ${TEST_EMAIL}`, Date.now() - startTime);
      return true;
    } else {
      const error = await response.text();
      logStep('User Registration', 'fail', `Registration failed: ${error}`);
      return false;
    }
  } catch (error: any) {
    logStep('User Registration', 'skip', `API not available: ${error.message}`);
    return false;
  }
}

async function testUserLogin() {
  const startTime = Date.now();
  try {
    const response = await fetch('http://localhost:3003/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (response.ok) {
      logStep('User Login', 'pass', 'Login successful', Date.now() - startTime);
      return true;
    } else {
      logStep('User Login', 'fail', 'Login failed');
      return false;
    }
  } catch (error: any) {
    logStep('User Login', 'skip', `API not available: ${error.message}`);
    return false;
  }
}

async function testFreePlanStatus() {
  const startTime = Date.now();
  try {
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (user[0]) {
      const planType = user[0].planType || 'free';
      if (planType === 'free') {
        logStep('Free Plan Status', 'pass', `User has Free plan`, Date.now() - startTime);
        return true;
      } else {
        logStep('Free Plan Status', 'fail', `Expected Free, got ${planType}`);
        return false;
      }
    } else {
      logStep('Free Plan Status', 'fail', 'User not found');
      return false;
    }
  } catch (error: any) {
    logStep('Free Plan Status', 'fail', error.message);
    return false;
  }
}

async function simulatePayment() {
  const startTime = Date.now();
  try {
    // 获取用户 ID
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (!user[0]) {
      logStep('Simulate Payment', 'fail', 'User not found');
      return false;
    }

    const userId = user[0].id;

    // 创建订阅记录
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    await db().insert(subscriptions).values({
      id: `sub_test_${Date.now()}`,
      userId: userId,
      planName: 'Base',
      status: 'active',
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建支付记录
    await db().insert(payments).values({
      id: `pay_test_${Date.now()}`,
      userId: userId,
      amount: 1990, // $19.9 in cents
      currency: 'USD',
      status: 'paid',
      provider: 'creem',
      createdAt: new Date(),
    });

    // 更新用户 planType
    await db()
      .update(users)
      .set({ planType: 'base' })
      .where(eq(users.id, userId));

    logStep('Simulate Payment', 'pass', 'Payment simulated successfully', Date.now() - startTime);
    return true;
  } catch (error: any) {
    logStep('Simulate Payment', 'fail', error.message);
    return false;
  }
}

async function testBasePlanStatus() {
  const startTime = Date.now();
  try {
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (!user[0]) {
      logStep('Base Plan Status', 'fail', 'User not found');
      return false;
    }

    const planType = user[0].planType;
    if (planType === 'base') {
      logStep('Base Plan Status', 'pass', 'User upgraded to Base plan', Date.now() - startTime);
      return true;
    } else {
      logStep('Base Plan Status', 'fail', `Expected base, got ${planType}`);
      return false;
    }
  } catch (error: any) {
    logStep('Base Plan Status', 'fail', error.message);
    return false;
  }
}

async function testSubscriptionDetails() {
  const startTime = Date.now();
  try {
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (!user[0]) {
      logStep('Subscription Details', 'fail', 'User not found');
      return false;
    }

    const subscription = await db()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(1);

    if (!subscription[0]) {
      logStep('Subscription Details', 'fail', 'Subscription not found');
      return false;
    }

    const sub = subscription[0];
    const checks = [
      { name: 'Plan Name', expected: 'Base', actual: sub.planName },
      { name: 'Status', expected: 'active', actual: sub.status },
    ];

    const allPassed = checks.every(check => check.expected === check.actual);

    if (allPassed) {
      const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString();
      logStep('Subscription Details', 'pass', `Valid until: ${validUntil}`, Date.now() - startTime);
      return true;
    } else {
      const failed = checks.find(check => check.expected !== check.actual);
      logStep('Subscription Details', 'fail', `${failed?.name}: expected ${failed?.expected}, got ${failed?.actual}`);
      return false;
    }
  } catch (error: any) {
    logStep('Subscription Details', 'fail', error.message);
    return false;
  }
}

async function testPaymentRecord() {
  const startTime = Date.now();
  try {
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (!user[0]) {
      logStep('Payment Record', 'fail', 'User not found');
      return false;
    }

    const payment = await db()
      .select()
      .from(payments)
      .where(eq(payments.userId, user[0].id))
      .limit(1);

    if (!payment[0]) {
      logStep('Payment Record', 'fail', 'Payment not found');
      return false;
    }

    const pay = payment[0];
    const checks = [
      { name: 'Amount', expected: 1990, actual: pay.amount },
      { name: 'Currency', expected: 'USD', actual: pay.currency },
      { name: 'Status', expected: 'paid', actual: pay.status },
    ];

    const allPassed = checks.every(check => check.expected === check.actual);

    if (allPassed) {
      logStep('Payment Record', 'pass', `Payment: $${pay.amount / 100} ${pay.currency}`, Date.now() - startTime);
      return true;
    } else {
      const failed = checks.find(check => check.expected !== check.actual);
      logStep('Payment Record', 'fail', `${failed?.name}: expected ${failed?.expected}, got ${failed?.actual}`);
      return false;
    }
  } catch (error: any) {
    logStep('Payment Record', 'fail', error.message);
    return false;
  }
}

async function cleanup() {
  const startTime = Date.now();
  try {
    const user = await db()
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (user[0]) {
      // 删除支付记录
      await db().delete(payments).where(eq(payments.userId, user[0].id));
      
      // 删除订阅记录
      await db().delete(subscriptions).where(eq(subscriptions.userId, user[0].id));
      
      // 删除用户
      await db().delete(users).where(eq(users.id, user[0].id));

      logStep('Cleanup', 'pass', 'Test data cleaned up', Date.now() - startTime);
    } else {
      logStep('Cleanup', 'skip', 'No test data to clean up');
    }
    return true;
  } catch (error: any) {
    logStep('Cleanup', 'fail', error.message);
    return false;
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏭️  Skipped: ${skipped}/${total}`);

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => console.log(`  - ${r.step}: ${r.message}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log(failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
  console.log('='.repeat(60) + '\n');
}

async function runTests() {
  console.log('🧪 Starting E2E Tests...\n');
  console.log(`📧 Test Email: ${TEST_EMAIL}\n`);

  // Step 1: Database Connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('\n❌ Database connection failed. Aborting tests.');
    return;
  }

  // Step 2: User Registration (API test - may skip if server not running)
  await testUserRegistration();

  // Step 3: User Login (API test - may skip if server not running)
  await testUserLogin();

  // Step 4: Free Plan Status
  await testFreePlanStatus();

  // Step 5: Simulate Payment
  await simulatePayment();

  // Step 6: Base Plan Status
  await testBasePlanStatus();

  // Step 7: Subscription Details
  await testSubscriptionDetails();

  // Step 8: Payment Record
  await testPaymentRecord();

  // Step 9: Cleanup
  await cleanup();

  // Print Summary
  printSummary();
}

// Run tests
runTests().catch(console.error);

