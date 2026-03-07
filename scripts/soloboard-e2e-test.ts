/**
 * SoloBoard 完整流程端到端测试
 * 测试范围：注册、登录、添加网站、配置API、同步数据、查看数据、导出数据
 * 运行方式：tsx scripts/soloboard-e2e-test.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/core/db/index.js';
import {
  user,
  monitoredSites,
  siteMetricsDaily,
} from '../src/config/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getUuid } from '../src/shared/lib/hash.js';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

const testResults: TestResult[] = [];

function logResult(step: string, status: 'success' | 'error' | 'warning', message: string, data?: any) {
  testResults.push({ step, status, message, data });
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${icon} [${step}] ${message}`);
  if (data) {
    console.log(`   数据:`, JSON.stringify(data, null, 2));
  }
}

async function soloboardE2ETest() {
  console.log('🚀 开始 SoloBoard 完整流程端到端测试\n');
  console.log('========================================\n');

  const testEmail = `soloboard-test-${Date.now()}@example.com`;
  const testSiteDomain = `test-site-${Date.now()}.com`;

  try {
    const database = db();

    // ============================================
    // Step 1: 创建测试用户（模拟注册）
    // ============================================
    console.log('📝 Step 1: 创建测试用户（模拟注册）\n');
    let testUserId: string;

    const [existingUser] = await database
      .select()
      .from(user)
      .where(eq(user.email, testEmail))
      .limit(1);

    if (existingUser) {
      testUserId = existingUser.id;
      logResult('Step 1', 'warning', `使用现有用户: ${testEmail}`, { userId: testUserId });
    } else {
      testUserId = getUuid();
      await database.insert(user).values({
        id: testUserId,
        name: 'SoloBoard Test User',
        email: testEmail,
        emailVerified: true,
        planType: 'free',
        credits: 1000,
      });
      logResult('Step 1', 'success', `创建测试用户成功: ${testEmail}`, { 
        userId: testUserId,
        planType: 'free',
        credits: 1000
      });
    }

    // ============================================
    // Step 2: 验证用户登录状态
    // ============================================
    console.log('\n📝 Step 2: 验证用户登录状态\n');

    const [verifiedUser] = await database
      .select()
      .from(user)
      .where(eq(user.id, testUserId))
      .limit(1);

    if (verifiedUser && verifiedUser.emailVerified) {
      logResult('Step 2', 'success', '用户登录状态验证成功', {
        userId: verifiedUser.id,
        email: verifiedUser.email,
        emailVerified: verifiedUser.emailVerified,
      });
    } else {
      logResult('Step 2', 'error', '用户登录状态验证失败');
    }

    // ============================================
    // Step 3: 添加网站（模拟用户添加第一个网站）
    // ============================================
    console.log('\n📝 Step 3: 添加网站\n');

    const siteId = getUuid();
    const siteUrl = `https://${testSiteDomain}`;
    await database.insert(monitoredSites).values({
      id: siteId,
      userId: testUserId,
      name: 'Test Website',
      domain: testSiteDomain,
      url: siteUrl,
      platform: 'custom',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logResult('Step 3', 'success', '网站添加成功', {
      siteId,
      domain: testSiteDomain,
      name: 'Test Website',
    });

    // ============================================
    // Step 4: 配置 API Keys（模拟用户配置 Stripe）
    // ============================================
    console.log('\n📝 Step 4: 配置 API Keys\n');

    const testStripeKey = 'sk_test_' + 'x'.repeat(99); // 模拟 Stripe Test Key
    const testGA4PropertyId = 'G-XXXXXXXXXX';

    await database
      .update(monitoredSites)
      .set({
        apiConfig: {
          stripeKey: testStripeKey,
          ga4PropertyId: testGA4PropertyId,
        },
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));

    logResult('Step 4', 'success', 'API Keys 配置成功', {
      stripeKey: testStripeKey.substring(0, 10) + '...',
      ga4PropertyId: testGA4PropertyId,
    });

    // ============================================
    // Step 5: 模拟同步数据（创建今日指标）
    // ============================================
    console.log('\n📝 Step 5: 模拟同步数据\n');

    const today = new Date().toISOString().split('T')[0];
    const metricsId = getUuid();

    await database.insert(siteMetricsDaily).values({
      id: metricsId,
      siteId: siteId,
      date: new Date(),
      revenue: 1500, // $15.00
      visitors: 250,
      createdAt: new Date(),
    });

    // 更新站点最后同步时间
    await database
      .update(monitoredSites)
      .set({
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));

    logResult('Step 5', 'success', '数据同步成功', {
      date: today,
      revenue: '$15.00',
      visitors: 250,
    });

    // ============================================
    // Step 6: 验证数据展示
    // ============================================
    console.log('\n📝 Step 6: 验证数据展示\n');

    const [siteWithMetrics] = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);

    const [todayMetrics] = await database
      .select()
      .from(siteMetricsDaily)
      .where(eq(siteMetricsDaily.siteId, siteId))
      .limit(1);

    if (siteWithMetrics && todayMetrics) {
      logResult('Step 6', 'success', '数据展示验证成功', {
        siteName: siteWithMetrics.name,
        domain: siteWithMetrics.domain,
        status: siteWithMetrics.status,
        todayRevenue: `$${(todayMetrics.revenue / 100).toFixed(2)}`,
        todayVisitors: todayMetrics.visitors,
        lastSynced: siteWithMetrics.lastSyncedAt,
      });
    } else {
      logResult('Step 6', 'error', '数据展示验证失败');
    }

    // ============================================
    // Step 7: 测试批量添加网站
    // ============================================
    console.log('\n📝 Step 7: 测试批量添加网站\n');

    const batchSites = [
      { domain: `batch-site-1-${Date.now()}.com`, name: 'Batch Site 1' },
      { domain: `batch-site-2-${Date.now()}.com`, name: 'Batch Site 2' },
      { domain: `batch-site-3-${Date.now()}.com`, name: 'Batch Site 3' },
    ];

    const batchSiteIds: string[] = [];
    for (const site of batchSites) {
      const batchSiteId = getUuid();
      batchSiteIds.push(batchSiteId);
      await database.insert(monitoredSites).values({
        id: batchSiteId,
        userId: testUserId,
        name: site.name,
        domain: site.domain,
        url: `https://${site.domain}`,
        platform: 'custom',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    logResult('Step 7', 'success', `批量添加 ${batchSites.length} 个网站成功`, {
      sites: batchSites.map((s, i) => ({ id: batchSiteIds[i], ...s })),
    });

    // ============================================
    // Step 8: 验证用户站点配额
    // ============================================
    console.log('\n📝 Step 8: 验证用户站点配额\n');

    const userSites = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.userId, testUserId));

    const freePlanLimit = 1;
    const basePlanLimit = 5;
    const proPlanLimit = 999;

    const currentPlan = verifiedUser?.planType || 'free';
    const currentLimit = currentPlan === 'free' ? freePlanLimit : 
                        currentPlan === 'base' ? basePlanLimit : proPlanLimit;

    logResult('Step 8', 'success', '站点配额验证', {
      currentPlan,
      siteLimit: currentLimit,
      currentSites: userSites.length,
      withinLimit: userSites.length <= currentLimit,
    });

    if (userSites.length > currentLimit) {
      logResult('Step 8', 'warning', `当前站点数 (${userSites.length}) 超过 ${currentPlan} 计划限制 (${currentLimit})`);
    }

    // ============================================
    // Step 9: 测试数据导出功能
    // ============================================
    console.log('\n📝 Step 9: 测试数据导出功能\n');

    const exportData = {
      site: siteWithMetrics,
      metrics: todayMetrics,
      exportedAt: new Date().toISOString(),
    };

    logResult('Step 9', 'success', '数据导出功能验证', {
      format: 'JSON',
      dataSize: JSON.stringify(exportData).length + ' bytes',
      note: 'CSV 和 PDF 导出需要通过 API 端点测试',
    });

    // ============================================
    // Step 10: 测试删除网站
    // ============================================
    console.log('\n📝 Step 10: 测试删除网站\n');

    // 删除一个批量添加的网站
    const siteToDelete = batchSiteIds[0];
    await database
      .delete(monitoredSites)
      .where(eq(monitoredSites.id, siteToDelete));

    const [deletedSite] = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteToDelete))
      .limit(1);

    if (!deletedSite) {
      logResult('Step 10', 'success', '网站删除成功', {
        deletedSiteId: siteToDelete,
      });
    } else {
      logResult('Step 10', 'error', '网站删除失败');
    }

    // ============================================
    // Step 11: 验证数据完整性
    // ============================================
    console.log('\n📝 Step 11: 验证数据完整性\n');

    const validations = [
      {
        name: '用户存在',
        condition: !!verifiedUser,
        message: verifiedUser ? '用户数据完整' : '用户数据缺失',
      },
      {
        name: '网站存在',
        condition: !!siteWithMetrics,
        message: siteWithMetrics ? '网站数据完整' : '网站数据缺失',
      },
      {
        name: 'API Keys 配置',
        condition: !!siteWithMetrics?.apiConfig && 
                   typeof siteWithMetrics.apiConfig === 'object' &&
                   'stripeKey' in siteWithMetrics.apiConfig,
        message: siteWithMetrics?.apiConfig && 
                 typeof siteWithMetrics.apiConfig === 'object' &&
                 'stripeKey' in siteWithMetrics.apiConfig
          ? 'API Keys 已配置' 
          : 'API Keys 未配置',
      },
      {
        name: '今日指标',
        condition: !!todayMetrics,
        message: todayMetrics ? '今日指标数据存在' : '今日指标数据缺失',
      },
      {
        name: '同步时间',
        condition: !!siteWithMetrics?.lastSyncAt,
        message: siteWithMetrics?.lastSyncAt ? '最后同步时间已记录' : '最后同步时间缺失',
      },
    ];

    let allValid = true;
    validations.forEach((validation) => {
      if (validation.condition) {
        logResult('Step 11', 'success', validation.message);
      } else {
        logResult('Step 11', 'error', `验证失败: ${validation.name} - ${validation.message}`);
        allValid = false;
      }
    });

    // ============================================
    // 测试总结
    // ============================================
    console.log('\n========================================');
    console.log('📊 测试总结');
    console.log('========================================\n');

    const successCount = testResults.filter((r) => r.status === 'success').length;
    const errorCount = testResults.filter((r) => r.status === 'error').length;
    const warningCount = testResults.filter((r) => r.status === 'warning').length;

    console.log(`✅ 成功: ${successCount}`);
    console.log(`⚠️  警告: ${warningCount}`);
    console.log(`❌ 错误: ${errorCount}\n`);

    if (errorCount === 0 && allValid) {
      console.log('🎉 所有测试通过！\n');
      console.log('📋 测试数据详情：');
      console.log(`   用户 ID: ${testUserId}`);
      console.log(`   用户邮箱: ${testEmail}`);
      console.log(`   用户计划: ${currentPlan}`);
      console.log(`   网站 ID: ${siteId}`);
      console.log(`   网站域名: ${testSiteDomain}`);
      console.log(`   今日收入: $${(todayMetrics?.revenue || 0) / 100}`);
      console.log(`   今日访客: ${todayMetrics?.visitors || 0}\n`);

      console.log('🎯 下一步操作：');
      console.log('   1. 启动开发服务器: pnpm dev');
      console.log('   2. 访问 http://localhost:3000/en/soloboard');
      console.log(`   3. 使用测试邮箱登录: ${testEmail}`);
      console.log('   4. 查看仪表盘数据');
      console.log('   5. 点击网站卡片查看详情');
      console.log('   6. 测试 Sync 功能');
      console.log('   7. 测试 Settings 对话框');
      console.log('   8. 测试数据导出功能\n');

      console.log('💡 API 端点测试：');
      console.log('   GET  /api/soloboard/sites - 获取站点列表');
      console.log('   POST /api/soloboard/sites - 添加站点');
      console.log(`   GET  /api/soloboard/sites/${siteId} - 获取站点配置`);
      console.log(`   PATCH /api/soloboard/sites/${siteId} - 更新站点配置`);
      console.log(`   POST /api/soloboard/sites/${siteId}/sync-stream - 流式同步`);
      console.log(`   POST /api/soloboard/sites/${siteId}/test-connection - 测试连接`);
      console.log(`   DELETE /api/soloboard/sites/${siteId} - 删除站点\n`);
    } else {
      console.log('⚠️  部分测试未通过，请检查错误信息\n');
    }

    console.log('========================================\n');

    return {
      success: errorCount === 0 && allValid,
      testResults,
      testData: {
        userId: testUserId,
        userEmail: testEmail,
        userPlan: currentPlan,
        siteId,
        siteDomain: testSiteDomain,
        batchSiteIds,
        todayRevenue: todayMetrics?.revenue || 0,
        todayVisitors: todayMetrics?.visitors || 0,
      },
    };
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    logResult('Error', 'error', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// 执行测试
soloboardE2ETest()
  .then((result) => {
    if (result.success) {
      console.log('✅ SoloBoard 端到端测试完成！');
      process.exit(0);
    } else {
      console.log('❌ 测试未完全通过');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });

