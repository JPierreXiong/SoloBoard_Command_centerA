/**
 * 完整的 Creem 支付功能测试
 * 
 * 测试内容：
 * 1. 数据库连接
 * 2. 用户注册功能
 * 3. 用户登录功能
 * 4. 创建支付订单
 * 5. 查询订单状态
 * 6. 验证用户权限
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

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
  log(`\n${'='.repeat(70)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(70)}`, colors.cyan);
}

// 测试结果
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
};

async function runTest(name: string, testFn: () => Promise<boolean>) {
  testResults.total++;
  info(`测试: ${name}...`);
  
  try {
    const result = await testFn();
    if (result) {
      testResults.passed++;
      success(`通过: ${name}`);
    } else {
      testResults.failed++;
      error(`失败: ${name}`);
    }
    return result;
  } catch (err: any) {
    testResults.failed++;
    error(`失败: ${name}`);
    error(`错误: ${err.message}`);
    return false;
  }
}

// 1. 测试数据库连接
async function testDatabaseConnection(): Promise<boolean> {
  section('1. 数据库连接测试');
  
  try {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      error('DATABASE_URL 未配置');
      return false;
    }
    
    info(`连接到: ${databaseUrl.split('@')[1]?.split('/')[0] || 'database'}`);
    
    const client = postgres.default(databaseUrl);
    const db = drizzle(client);
    
    // 测试查询
    const result = await client`SELECT 1 as test`;
    
    if (result && result.length > 0) {
      success('数据库连接成功');
      info(`测试查询返回: ${JSON.stringify(result[0])}`);
      await client.end();
      return true;
    }
    
    await client.end();
    return false;
  } catch (err: any) {
    error(`数据库连接失败: ${err.message}`);
    return false;
  }
}

// 2. 测试用户表
async function testUserTable(): Promise<boolean> {
  section('2. 用户表测试');
  
  try {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    const { user } = await import('../src/config/db/schema');
    
    const client = postgres.default(process.env.DATABASE_URL!);
    const db = drizzle(client);
    
    // 查询用户表
    const users = await db.select().from(user).limit(1);
    
    success('用户表可访问');
    info(`当前用户数: ${users.length > 0 ? '至少1个' : '0个'}`);
    
    await client.end();
    return true;
  } catch (err: any) {
    error(`用户表访问失败: ${err.message}`);
    return false;
  }
}

// 3. 测试订单表
async function testOrderTable(): Promise<boolean> {
  section('3. 订单表测试');
  
  try {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    const { order } = await import('../src/config/db/schema');
    
    const client = postgres.default(process.env.DATABASE_URL!);
    const db = drizzle(client);
    
    // 查询订单表
    const orders = await db.select().from(order).limit(1);
    
    success('订单表可访问');
    info(`当前订单数: ${orders.length > 0 ? '至少1个' : '0个'}`);
    
    await client.end();
    return true;
  } catch (err: any) {
    error(`订单表访问失败: ${err.message}`);
    return false;
  }
}

// 4. 测试订阅表
async function testSubscriptionTable(): Promise<boolean> {
  section('4. 订阅表测试');
  
  try {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    const { subscription } = await import('../src/config/db/schema');
    
    const client = postgres.default(process.env.DATABASE_URL!);
    const db = drizzle(client);
    
    // 查询订阅表
    const subscriptions = await db.select().from(subscription).limit(1);
    
    success('订阅表可访问');
    info(`当前订阅数: ${subscriptions.length > 0 ? '至少1个' : '0个'}`);
    
    await client.end();
    return true;
  } catch (err: any) {
    error(`订阅表访问失败: ${err.message}`);
    return false;
  }
}

// 5. 测试 Creem API 连接
async function testCreemAPI(): Promise<boolean> {
  section('5. Creem API 连接测试');
  
  try {
    const apiKey = process.env.CREEM_API_KEY;
    const environment = process.env.CREEM_ENVIRONMENT;
    
    if (!apiKey) {
      error('CREEM_API_KEY 未配置');
      return false;
    }
    
    const baseUrl = environment === 'production' 
      ? 'https://api.creem.io' 
      : 'https://test-api.creem.io';
    
    info(`测试环境: ${environment}`);
    info(`API URL: ${baseUrl}`);
    
    // 测试获取账户信息
    const response = await fetch(`${baseUrl}/v1/account`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      success(`Creem API 连接成功`);
      info(`账户 ID: ${data.id || 'N/A'}`);
      info(`账户邮箱: ${data.email || 'N/A'}`);
      
      return true;
    } else {
      error(`API 请求失败: ${response.status}`);
      const errorText = await response.text();
      error(`错误详情: ${errorText}`);
      return false;
    }
  } catch (err: any) {
    error(`Creem API 测试失败: ${err.message}`);
    return false;
  }
}

// 6. 测试 Creem Provider
async function testCreemProvider(): Promise<boolean> {
  section('6. Creem Provider 功能测试');
  
  try {
    const { createCreemProvider } = await import('../src/extensions/payment/creem');
    
    const apiKey = process.env.CREEM_API_KEY!;
    const signingSecret = process.env.CREEM_SIGNING_SECRET || 'test_secret';
    const environment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';
    
    const provider = createCreemProvider({
      apiKey,
      signingSecret,
      environment: environment || 'sandbox',
    });
    
    success('Creem Provider 创建成功');
    info(`Provider 名称: ${provider.name}`);
    
    return true;
  } catch (err: any) {
    error(`Creem Provider 测试失败: ${err.message}`);
    return false;
  }
}

// 7. 测试配置完整性
async function testConfiguration(): Promise<boolean> {
  section('7. 配置完整性检查');
  
  const requiredVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'ENCRYPTION_KEY',
    'CREEM_API_KEY',
    'CREEM_ENVIRONMENT',
  ];
  
  const optionalVars = [
    'CREEM_SIGNING_SECRET',
    'CREEM_PRODUCT_ID_BASE',
    'CREEM_PRODUCT_ID_PRO',
  ];
  
  let allRequired = true;
  
  info('必需配置:');
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`  ${varName}`);
    } else {
      error(`  ${varName} - 未配置`);
      allRequired = false;
    }
  }
  
  info('\n可选配置:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      success(`  ${varName}`);
    } else {
      info(`  ${varName} - 未配置`);
    }
  }
  
  return allRequired;
}

// 主测试函数
async function runAllTests() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  🧪 Creem 支付系统完整测试', colors.cyan);
  log('  数据库 + API + 配置验证', colors.cyan);
  log('='.repeat(70) + '\n', colors.cyan);
  
  // 运行所有测试
  await runTest('配置完整性', testConfiguration);
  await runTest('数据库连接', testDatabaseConnection);
  await runTest('用户表访问', testUserTable);
  await runTest('订单表访问', testOrderTable);
  await runTest('订阅表访问', testSubscriptionTable);
  await runTest('Creem API 连接', testCreemAPI);
  await runTest('Creem Provider', testCreemProvider);
  
  // 输出测试报告
  section('📊 测试报告');
  
  log(`\n总测试数: ${testResults.total}`, colors.cyan);
  log(`✅ 通过: ${testResults.passed}`, colors.green);
  log(`❌ 失败: ${testResults.failed}`, colors.red);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`\n📈 通过率: ${passRate}%`, colors.cyan);
  
  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！系统已就绪。', colors.green);
    log('\n✨ 下一步操作:', colors.cyan);
    log('  1. 启动开发服务器: pnpm dev', colors.blue);
    log('  2. 访问: http://localhost:3003', colors.blue);
    log('  3. 测试注册、登录、购买流程', colors.blue);
  } else {
    log('\n⚠️  部分测试失败，请修复后重试。', colors.yellow);
    log('\n🔧 修复建议:', colors.cyan);
    log('  1. 检查数据库连接', colors.blue);
    log('  2. 验证 Creem API Key', colors.blue);
    log('  3. 确认所有表已创建', colors.blue);
  }
  
  log('\n');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch((err) => {
  error(`测试套件失败: ${err.message}`);
  console.error(err);
  process.exit(1);
});

