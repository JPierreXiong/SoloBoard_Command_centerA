/**
 * 支付流程完整性测试
 * 测试从登录 → 支付 → 权限验证的完整流程
 */

import { db } from '@/core/db';
import { user, order, subscription, credit } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';

interface TestReport {
  timestamp: string;
  testUser: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  } | null;
  orders: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
    latest: any[];
  };
  subscriptions: {
    total: number;
    active: number;
    canceled: number;
    expired: number;
    current: any | null;
  };
  credits: {
    total: number;
    remaining: number;
    expired: number;
    transactions: any[];
  };
  permissions: {
    canAddSites: boolean;
    siteLimit: number;
    currentSites: number;
    planName: string;
    validUntil: Date | null;
  };
  issues: string[];
  recommendations: string[];
}

async function testPaymentFlow(testEmail: string): Promise<TestReport> {
  const report: TestReport = {
    timestamp: new Date().toISOString(),
    testUser: null,
    orders: {
      total: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      latest: [],
    },
    subscriptions: {
      total: 0,
      active: 0,
      canceled: 0,
      expired: 0,
      current: null,
    },
    credits: {
      total: 0,
      remaining: 0,
      expired: 0,
      transactions: [],
    },
    permissions: {
      canAddSites: false,
      siteLimit: 1,
      currentSites: 0,
      planName: 'Free',
      validUntil: null,
    },
    issues: [],
    recommendations: [],
  };

  try {
    // 1. 查找测试用户
    console.log('🔍 Step 1: 查找用户...');
    const [testUser] = await db()
      .select()
      .from(user)
      .where(eq(user.email, testEmail))
      .limit(1);

    if (!testUser) {
      report.issues.push(`❌ 用户不存在: ${testEmail}`);
      report.recommendations.push('请先注册账号或检查邮箱地址');
      return report;
    }

    report.testUser = {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      createdAt: testUser.createdAt,
    };
    console.log(`✅ 找到用户: ${testUser.name} (${testUser.email})`);

    // 2. 检查订单
    console.log('\n🔍 Step 2: 检查订单记录...');
    const orders = await db()
      .select()
      .from(order)
      .where(eq(order.userId, testUser.id))
      .orderBy(desc(order.createdAt));

    report.orders.total = orders.length;
    report.orders.paid = orders.filter(o => o.status === 'paid').length;
    report.orders.pending = orders.filter(o => o.status === 'pending' || o.status === 'created').length;
    report.orders.failed = orders.filter(o => o.status === 'failed' || o.status === 'completed').length;
    report.orders.latest = orders.slice(0, 5).map(o => ({
      orderNo: o.orderNo,
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      productName: o.productName,
      paymentProvider: o.paymentProvider,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
    }));

    console.log(`  总订单: ${report.orders.total}`);
    console.log(`  已支付: ${report.orders.paid}`);
    console.log(`  待支付: ${report.orders.pending}`);
    console.log(`  失败: ${report.orders.failed}`);

    if (report.orders.total === 0) {
      report.issues.push('⚠️ 没有找到任何订单记录');
      report.recommendations.push('请先完成一次支付流程');
    }

    if (report.orders.paid === 0 && report.orders.total > 0) {
      report.issues.push('⚠️ 有订单但没有支付成功的记录');
      report.recommendations.push('检查支付回调是否正常工作');
      report.recommendations.push('检查 Webhook 配置是否正确');
    }

    // 3. 检查订阅
    console.log('\n🔍 Step 3: 检查订阅记录...');
    const subscriptions = await db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, testUser.id))
      .orderBy(desc(subscription.createdAt));

    report.subscriptions.total = subscriptions.length;
    report.subscriptions.active = subscriptions.filter(s => s.status === 'active').length;
    report.subscriptions.canceled = subscriptions.filter(s => s.status === 'canceled').length;
    report.subscriptions.expired = subscriptions.filter(s => s.status === 'expired').length;

    const currentSub = subscriptions.find(s => 
      s.status === 'active' || s.status === 'trialing' || s.status === 'pending_cancel'
    );

    if (currentSub) {
      report.subscriptions.current = {
        subscriptionNo: currentSub.subscriptionNo,
        status: currentSub.status,
        planName: currentSub.planName,
        amount: currentSub.amount,
        currency: currentSub.currency,
        interval: currentSub.interval,
        currentPeriodStart: currentSub.currentPeriodStart,
        currentPeriodEnd: currentSub.currentPeriodEnd,
        paymentProvider: currentSub.paymentProvider,
        createdAt: currentSub.createdAt,
      };

      report.permissions.planName = currentSub.planName || 'Unknown';
      report.permissions.validUntil = currentSub.currentPeriodEnd;

      console.log(`✅ 当前订阅: ${currentSub.planName}`);
      console.log(`  状态: ${currentSub.status}`);
      console.log(`  有效期: ${currentSub.currentPeriodStart?.toISOString()} ~ ${currentSub.currentPeriodEnd?.toISOString()}`);
    } else {
      console.log('⚠️ 没有活跃的订阅');
      report.issues.push('没有活跃的订阅记录');
      
      if (report.orders.paid > 0) {
        report.issues.push('❌ 严重问题：有已支付订单但没有创建订阅记录');
        report.recommendations.push('检查 handleCheckoutSuccess 函数是否正常执行');
        report.recommendations.push('检查数据库事务是否正常提交');
      }
    }

    // 4. 检查积分
    console.log('\n🔍 Step 4: 检查积分记录...');
    const credits = await db()
      .select()
      .from(credit)
      .where(eq(credit.userId, testUser.id))
      .orderBy(desc(credit.createdAt));

    report.credits.total = credits.reduce((sum, c) => sum + c.credits, 0);
    report.credits.remaining = credits.reduce((sum, c) => sum + c.remainingCredits, 0);
    report.credits.expired = credits.filter(c => 
      c.expiresAt && new Date(c.expiresAt) < new Date()
    ).length;
    report.credits.transactions = credits.slice(0, 5).map(c => ({
      transactionNo: c.transactionNo,
      transactionType: c.transactionType,
      credits: c.credits,
      remainingCredits: c.remainingCredits,
      description: c.description,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    }));

    console.log(`  总积分: ${report.credits.total}`);
    console.log(`  剩余积分: ${report.credits.remaining}`);
    console.log(`  过期记录: ${report.credits.expired}`);

    // 5. 检查站点限制权限
    console.log('\n🔍 Step 5: 检查站点权限...');
    const planName = report.permissions.planName.toLowerCase();
    
    if (planName.includes('free')) {
      report.permissions.siteLimit = 1;
    } else if (planName.includes('base')) {
      report.permissions.siteLimit = 5;
    } else if (planName.includes('pro')) {
      report.permissions.siteLimit = 999;
    } else {
      report.permissions.siteLimit = 1;
    }

    // 查询当前站点数
    const { monitoredSites } = await import('@/config/db/schema');
    const sites = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.userId, testUser.id));

    report.permissions.currentSites = sites.length;
    report.permissions.canAddSites = sites.length < report.permissions.siteLimit;

    console.log(`  套餐: ${report.permissions.planName}`);
    console.log(`  站点限制: ${report.permissions.siteLimit}`);
    console.log(`  当前站点: ${report.permissions.currentSites}`);
    console.log(`  可添加: ${report.permissions.canAddSites ? '是' : '否'}`);

    // 6. 生成建议
    console.log('\n📋 生成报告...');
    
    if (report.orders.paid > 0 && !currentSub) {
      report.recommendations.push('🔧 需要修复：订单已支付但订阅未创建');
      report.recommendations.push('运行数据修复脚本或手动创建订阅记录');
    }

    if (currentSub && report.credits.remaining === 0 && currentSub.creditsAmount > 0) {
      report.recommendations.push('⚠️ 订阅包含积分但积分未发放');
      report.recommendations.push('检查积分发放逻辑');
    }

    if (report.permissions.validUntil && new Date(report.permissions.validUntil) < new Date()) {
      report.recommendations.push('⚠️ 订阅已过期，需要续费');
    }

    if (report.orders.pending > 0) {
      report.recommendations.push('ℹ️ 有待支付的订单，可以继续完成支付');
    }

  } catch (error: any) {
    console.error('❌ 测试过程中出错:', error);
    report.issues.push(`测试失败: ${error.message}`);
  }

  return report;
}

// 生成报告
function generateReport(report: TestReport): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('           SoloBoard 支付流程测试报告');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`测试时间: ${report.timestamp}`);
  lines.push('');

  // 用户信息
  lines.push('👤 用户信息');
  lines.push('───────────────────────────────────────────────────────');
  if (report.testUser) {
    lines.push(`  姓名: ${report.testUser.name}`);
    lines.push(`  邮箱: ${report.testUser.email}`);
    lines.push(`  ID: ${report.testUser.id}`);
    lines.push(`  注册时间: ${report.testUser.createdAt.toISOString()}`);
  } else {
    lines.push('  ❌ 用户不存在');
  }
  lines.push('');

  // 订单统计
  lines.push('📦 订单统计');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  总订单数: ${report.orders.total}`);
  lines.push(`  已支付: ${report.orders.paid} ✅`);
  lines.push(`  待支付: ${report.orders.pending} ⏳`);
  lines.push(`  失败: ${report.orders.failed} ❌`);
  
  if (report.orders.latest.length > 0) {
    lines.push('');
    lines.push('  最近订单:');
    report.orders.latest.forEach((o, i) => {
      lines.push(`    ${i + 1}. ${o.orderNo} - ${o.status} - ${o.currency} ${o.amount/100}`);
      lines.push(`       ${o.productName} (${o.paymentProvider})`);
      lines.push(`       创建: ${o.createdAt.toISOString()}`);
    });
  }
  lines.push('');

  // 订阅信息
  lines.push('💳 订阅信息');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  总订阅数: ${report.subscriptions.total}`);
  lines.push(`  活跃: ${report.subscriptions.active} ✅`);
  lines.push(`  已取消: ${report.subscriptions.canceled}`);
  lines.push(`  已过期: ${report.subscriptions.expired}`);
  
  if (report.subscriptions.current) {
    const sub = report.subscriptions.current;
    lines.push('');
    lines.push('  当前订阅:');
    lines.push(`    套餐: ${sub.planName}`);
    lines.push(`    状态: ${sub.status}`);
    lines.push(`    金额: ${sub.currency} ${sub.amount/100}/${sub.interval}`);
    lines.push(`    周期: ${sub.currentPeriodStart?.toISOString().split('T')[0]} ~ ${sub.currentPeriodEnd?.toISOString().split('T')[0]}`);
    lines.push(`    支付方式: ${sub.paymentProvider}`);
  } else {
    lines.push('  ⚠️ 没有活跃订阅');
  }
  lines.push('');

  // 积分信息
  lines.push('🎁 积分信息');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  总获得积分: ${report.credits.total}`);
  lines.push(`  剩余积分: ${report.credits.remaining}`);
  lines.push(`  过期记录: ${report.credits.expired}`);
  
  if (report.credits.transactions.length > 0) {
    lines.push('');
    lines.push('  最近交易:');
    report.credits.transactions.forEach((c, i) => {
      lines.push(`    ${i + 1}. ${c.transactionType} - ${c.credits} 积分`);
      lines.push(`       ${c.description}`);
      lines.push(`       过期: ${c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '永久'}`);
    });
  }
  lines.push('');

  // 权限信息
  lines.push('🔐 权限信息');
  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  当前套餐: ${report.permissions.planName}`);
  lines.push(`  站点限制: ${report.permissions.siteLimit}`);
  lines.push(`  当前站点: ${report.permissions.currentSites}`);
  lines.push(`  可添加站点: ${report.permissions.canAddSites ? '是 ✅' : '否 ❌'}`);
  lines.push(`  有效期至: ${report.permissions.validUntil ? new Date(report.permissions.validUntil).toISOString().split('T')[0] : '无订阅'}`);
  lines.push('');

  // 问题列表
  if (report.issues.length > 0) {
    lines.push('⚠️ 发现的问题');
    lines.push('───────────────────────────────────────────────────────');
    report.issues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  // 建议
  if (report.recommendations.length > 0) {
    lines.push('💡 建议');
    lines.push('───────────────────────────────────────────────────────');
    report.recommendations.forEach((rec, i) => {
      lines.push(`  ${i + 1}. ${rec}`);
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

// 主函数
async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ 请提供测试邮箱地址');
    console.log('用法: tsx scripts/test-payment-flow.ts your@email.com');
    process.exit(1);
  }

  console.log('🚀 开始测试支付流程...\n');
  
  const report = await testPaymentFlow(testEmail);
  const reportText = generateReport(report);
  
  console.log('\n' + reportText);
  
  // 保存报告到文件
  const fs = await import('fs');
  const reportPath = `payment-flow-report-${Date.now()}.txt`;
  fs.writeFileSync(reportPath, reportText);
  console.log(`\n📄 报告已保存到: ${reportPath}`);
}

main().catch(console.error);

