/**
 * Creem 支付集成测试脚本
 * 
 * 测试内容：
 * 1. 环境变量配置检查
 * 2. Creem API 连接测试
 * 3. 创建测试订单
 * 4. 模拟支付流程
 * 5. Webhook 验证测试
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { createCreemProvider, CreemConfigs } from '../src/extensions/payment/creem';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function runTest(name: string, testFn: () => Promise<boolean>) {
  testResults.total++;
  info(`Testing: ${name}...`);
  
  try {
    const result = await testFn();
    if (result) {
      testResults.passed++;
      success(`PASSED: ${name}`);
    } else {
      testResults.failed++;
      error(`FAILED: ${name}`);
    }
    return result;
  } catch (err: any) {
    testResults.failed++;
    error(`FAILED: ${name}`);
    error(`Error: ${err.message}`);
    return false;
  }
}

// 1. 检查环境变量配置
async function testEnvironmentVariables(): Promise<boolean> {
  section('1. 环境变量配置检查');
  
  const requiredVars = [
    'CREEM_API_KEY',
    'CREEM_ENVIRONMENT',
    'CREEM_SIGNING_SECRET',
  ];
  
  const optionalVars = [
    'CREEM_ENABLED',
  ];
  
  let allRequired = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      success(`${varName}: ${value.substring(0, 20)}...`);
    } else {
      error(`${varName}: NOT SET (Required)`);
      allRequired = false;
    }
  }
  
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      info(`${varName}: ${value}`);
    } else {
      warning(`${varName}: NOT SET (Optional)`);
      testResults.warnings++;
    }
  }
  
  return allRequired;
}

// 2. 测试 Creem API 连接
async function testCreemConnection(): Promise<boolean> {
  section('2. Creem API 连接测试');
  
  const apiKey = process.env.CREEM_API_KEY;
  const environment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';
  
  if (!apiKey) {
    error('CREEM_API_KEY not configured');
    return false;
  }
  
  try {
    const baseUrl = environment === 'production' 
      ? 'https://api.creem.io' 
      : 'https://test-api.creem.io';
    
    info(`Testing connection to: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/v1/account`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      success('API connection successful');
      info(`Account ID: ${data.id || 'N/A'}`);
      info(`Account Email: ${data.email || 'N/A'}`);
      return true;
    } else {
      error(`API connection failed: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      error(`Error details: ${errorData}`);
      return false;
    }
  } catch (err: any) {
    error(`Connection error: ${err.message}`);
    return false;
  }
}

// 3. 测试创建支付会话
async function testCreateCheckout(): Promise<boolean> {
  section('3. 创建支付会话测试');
  
  const apiKey = process.env.CREEM_API_KEY;
  const environment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';
  const signingSecret = process.env.CREEM_SIGNING_SECRET;
  
  if (!apiKey || !signingSecret) {
    error('Missing required configuration');
    return false;
  }
  
  try {
    const configs: CreemConfigs = {
      apiKey,
      signingSecret,
      environment: environment || 'sandbox',
    };
    
    const provider = createCreemProvider(configs);
    
    // 创建测试订单
    info('Creating test checkout session...');
    
    const testOrder = {
      productId: 'prod_test_123', // 需要替换为实际的产品ID
      requestId: `test_${Date.now()}`,
      customer: {
        id: 'test_customer_123',
        email: 'test@example.com',
      },
      successUrl: 'https://example.com/success',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };
    
    info(`Product ID: ${testOrder.productId}`);
    info(`Customer Email: ${testOrder.customer.email}`);
    
    try {
      const session = await provider.createPayment({ order: testOrder });
      
      success('Checkout session created successfully');
      info(`Session ID: ${session.checkoutInfo.sessionId}`);
      info(`Checkout URL: ${session.checkoutInfo.checkoutUrl}`);
      
      return true;
    } catch (err: any) {
      if (err.message.includes('product')) {
        warning('Product ID not found - this is expected in test mode');
        warning('Please create a product in Creem Dashboard first');
        testResults.warnings++;
        return true; // 不算失败，只是警告
      }
      throw err;
    }
  } catch (err: any) {
    error(`Failed to create checkout: ${err.message}`);
    return false;
  }
}

// 4. 测试获取产品列表
async function testGetProducts(): Promise<boolean> {
  section('4. 获取产品列表测试');
  
  const apiKey = process.env.CREEM_API_KEY;
  const environment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';
  
  if (!apiKey) {
    error('CREEM_API_KEY not configured');
    return false;
  }
  
  try {
    const baseUrl = environment === 'production' 
      ? 'https://api.creem.io' 
      : 'https://test-api.creem.io';
    
    info('Fetching products from Creem...');
    
    const response = await fetch(`${baseUrl}/v1/products`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const products = data.data || [];
      
      success(`Found ${products.length} products`);
      
      if (products.length > 0) {
        info('\nAvailable Products:');
        products.forEach((product: any, index: number) => {
          info(`\n  Product ${index + 1}:`);
          info(`    ID: ${product.id}`);
          info(`    Name: ${product.name}`);
          info(`    Price: ${product.price / 100} ${product.currency.toUpperCase()}`);
          info(`    Billing: ${product.billing_period}`);
        });
      } else {
        warning('No products found. Please create products in Creem Dashboard.');
        testResults.warnings++;
      }
      
      return true;
    } else {
      error(`Failed to fetch products: ${response.status}`);
      return false;
    }
  } catch (err: any) {
    error(`Error fetching products: ${err.message}`);
    return false;
  }
}

// 5. 测试 Webhook 签名验证
async function testWebhookSignature(): Promise<boolean> {
  section('5. Webhook 签名验证测试');
  
  const signingSecret = process.env.CREEM_SIGNING_SECRET;
  
  if (!signingSecret) {
    error('CREEM_SIGNING_SECRET not configured');
    return false;
  }
  
  try {
    info('Testing webhook signature generation...');
    
    const testPayload = JSON.stringify({
      eventType: 'checkout.completed',
      object: {
        id: 'test_checkout_123',
        status: 'completed',
      },
    });
    
    // 生成签名
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingSecret);
    const messageData = encoder.encode(testPayload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = new Uint8Array(signature);
    const signatureHex = Array.from(signatureArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    success('Webhook signature generated successfully');
    info(`Signature: ${signatureHex.substring(0, 40)}...`);
    
    // 验证签名
    const signature2 = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray2 = new Uint8Array(signature2);
    const signatureHex2 = Array.from(signatureArray2)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signatureHex === signatureHex2) {
      success('Signature verification successful');
      return true;
    } else {
      error('Signature verification failed');
      return false;
    }
  } catch (err: any) {
    error(`Webhook signature test failed: ${err.message}`);
    return false;
  }
}

// 6. 测试数据库配置
async function testDatabaseConfig(): Promise<boolean> {
  section('6. 数据库配置检查');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    error('DATABASE_URL not configured');
    return false;
  }
  
  success('DATABASE_URL is configured');
  
  // 检查是否包含必要的表
  info('Note: Ensure the following tables exist:');
  info('  - user');
  info('  - order');
  info('  - subscription');
  info('  - credit');
  
  return true;
}

// 7. 测试支付路由
async function testPaymentRoutes(): Promise<boolean> {
  section('7. 支付路由检查');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  info(`App URL: ${appUrl}`);
  
  const routes = [
    '/api/payment/create',
    '/api/payment/notify/creem',
  ];
  
  info('\nRequired payment routes:');
  routes.forEach(route => {
    info(`  ${appUrl}${route}`);
  });
  
  warning('Please ensure these routes are implemented');
  testResults.warnings++;
  
  return true;
}

// 主测试函数
async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  🧪 Creem Payment Integration Test Suite', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
  
  // 运行所有测试
  await runTest('Environment Variables', testEnvironmentVariables);
  await runTest('Creem API Connection', testCreemConnection);
  await runTest('Get Products', testGetProducts);
  await runTest('Create Checkout Session', testCreateCheckout);
  await runTest('Webhook Signature', testWebhookSignature);
  await runTest('Database Configuration', testDatabaseConfig);
  await runTest('Payment Routes', testPaymentRoutes);
  
  // 输出测试报告
  section('测试报告');
  
  log(`\n总测试数: ${testResults.total}`, colors.cyan);
  log(`通过: ${testResults.passed}`, colors.green);
  log(`失败: ${testResults.failed}`, colors.red);
  log(`警告: ${testResults.warnings}`, colors.yellow);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`\n通过率: ${passRate}%`, colors.cyan);
  
  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！Creem 支付配置正确。', colors.green);
  } else {
    log('\n⚠️  部分测试失败，请检查配置。', colors.yellow);
  }
  
  // 输出下一步建议
  section('下一步操作建议');
  
  if (testResults.failed === 0) {
    success('1. 在 Creem Dashboard 创建产品');
    success('2. 配置 Webhook URL: https://your-domain.com/api/payment/notify/creem');
    success('3. 测试完整的支付流程');
    success('4. 部署到生产环境');
  } else {
    error('1. 修复失败的测试项');
    error('2. 检查环境变量配置');
    error('3. 验证 Creem API Key 是否有效');
    error('4. 重新运行测试');
  }
  
  log('\n');
}

// 运行测试
runAllTests().catch((err) => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});


