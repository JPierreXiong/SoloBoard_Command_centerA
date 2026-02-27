/**
 * 支付流程 API 测试
 * 通过 API 端点检查支付流程和权限
 */

async function testPaymentFlowViaAPI(baseUrl: string, userEmail: string) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('           SoloBoard 支付流程 API 测试');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`测试时间: ${new Date().toISOString()}`);
  console.log(`测试邮箱: ${userEmail}`);
  console.log(`API 地址: ${baseUrl}`);
  console.log('');

  const report = {
    user: null as any,
    subscription: null as any,
    sites: [] as any[],
    permissions: {
      planName: 'Free',
      siteLimit: 1,
      currentSites: 0,
      canAddMore: false,
      validUntil: null as string | null,
    },
    issues: [] as string[],
    recommendations: [] as string[],
  };

  try {
    // 1. 测试用户信息 API
    console.log('🔍 Step 1: 检查用户信息...');
    try {
      const userRes = await fetch(`${baseUrl}/api/user/me`, {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        report.user = userData;
        console.log(`✅ 用户已登录: ${userData.name || userData.email}`);
      } else {
        console.log('❌ 用户未登录或 session 失效');
        report.issues.push('用户未登录');
        report.recommendations.push('请先登录账号');
      }
    } catch (error: any) {
      console.log(`❌ 无法访问用户 API: ${error.message}`);
      report.issues.push(`API 错误: ${error.message}`);
    }

    // 2. 测试订阅信息
    console.log('\n🔍 Step 2: 检查订阅信息...');
    try {
      const subRes = await fetch(`${baseUrl}/api/subscription/current`, {
        credentials: 'include',
      });
      
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.subscription) {
          report.subscription = subData.subscription;
          report.permissions.planName = subData.subscription.planName || 'Unknown';
          report.permissions.validUntil = subData.subscription.currentPeriodEnd;
          
          console.log(`✅ 当前订阅: ${subData.subscription.planName}`);
          console.log(`   状态: ${subData.subscription.status}`);
          console.log(`   有效期: ${subData.subscription.currentPeriodEnd}`);
        } else {
          console.log('⚠️ 没有活跃订阅');
          report.issues.push('没有活跃订阅');
        }
      } else {
        console.log(`⚠️ 无法获取订阅信息 (${subRes.status})`);
      }
    } catch (error: any) {
      console.log(`⚠️ 订阅 API 错误: ${error.message}`);
    }

    // 3. 测试站点列表和权限
    console.log('\n🔍 Step 3: 检查站点权限...');
    try {
      const sitesRes = await fetch(`${baseUrl}/api/soloboard/sites`, {
        credentials: 'include',
      });
      
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        report.sites = sitesData.sites || [];
        
        if (sitesData.subscription) {
          report.permissions.planName = sitesData.subscription.plan;
          report.permissions.siteLimit = sitesData.subscription.limit;
          report.permissions.currentSites = sitesData.subscription.limit - sitesData.subscription.remaining;
          report.permissions.canAddMore = sitesData.subscription.canAddMore;
          
          console.log(`✅ 套餐: ${sitesData.subscription.plan}`);
          console.log(`   站点限制: ${sitesData.subscription.limit}`);
          console.log(`   当前站点: ${report.permissions.currentSites}`);
          console.log(`   剩余配额: ${sitesData.subscription.remaining}`);
          console.log(`   可添加: ${sitesData.subscription.canAddMore ? '是' : '否'}`);
        }
        
        console.log(`   已添加站点数: ${report.sites.length}`);
        if (report.sites.length > 0) {
          console.log('   站点列表:');
          report.sites.forEach((site, i) => {
            console.log(`     ${i + 1}. ${site.name} (${site.domain})`);
          });
        }
      } else if (sitesRes.status === 401) {
        console.log('❌ 未授权 (401) - 用户未登录');
        report.issues.push('API 返回 401 - 用户未登录或 session 失效');
        report.recommendations.push('请确保已登录并且 session 有效');
      } else {
        console.log(`❌ 获取站点失败 (${sitesRes.status})`);
        const errorData = await sitesRes.json().catch(() => ({}));
        report.issues.push(`站点 API 错误: ${errorData.error || sitesRes.statusText}`);
      }
    } catch (error: any) {
      console.log(`❌ 站点 API 错误: ${error.message}`);
      report.issues.push(`站点 API 错误: ${error.message}`);
    }

    // 4. 生成总结
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    测试总结');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n📊 权限状态:');
    console.log(`  当前套餐: ${report.permissions.planName}`);
    console.log(`  站点限制: ${report.permissions.siteLimit}`);
    console.log(`  当前站点: ${report.permissions.currentSites}`);
    console.log(`  可添加站点: ${report.permissions.canAddMore ? '是 ✅' : '否 ❌'}`);
    if (report.permissions.validUntil) {
      const validDate = new Date(report.permissions.validUntil);
      const daysLeft = Math.ceil((validDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      console.log(`  有效期至: ${validDate.toISOString().split('T')[0]} (剩余 ${daysLeft} 天)`);
    } else {
      console.log(`  有效期至: 无订阅`);
    }

    if (report.issues.length > 0) {
      console.log('\n⚠️ 发现的问题:');
      report.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    // 5. 诊断建议
    console.log('\n🔧 诊断建议:');
    
    if (!report.user) {
      console.log('  1. 请先登录账号');
      console.log('  2. 访问: ' + baseUrl + '/sign-in');
    } else if (!report.subscription) {
      console.log('  1. 您已登录但没有订阅记录');
      console.log('  2. 如果已支付，请检查:');
      console.log('     - Webhook 是否配置正确');
      console.log('     - 支付回调是否成功');
      console.log('     - 数据库中是否有订单记录');
      console.log('  3. 访问 Billing 页面: ' + baseUrl + '/settings/billing');
    } else {
      console.log('  ✅ 支付流程正常，订阅已激活');
      console.log('  ✅ 可以正常使用所有功能');
    }

    console.log('\n═══════════════════════════════════════════════════════');

  } catch (error: any) {
    console.error('\n❌ 测试过程中出错:', error.message);
  }
}

// 主函数
const baseUrl = process.argv[2] || 'https://soloboard-command-center-b.vercel.app';
const userEmail = process.argv[3] || 'test@example.com';

testPaymentFlowViaAPI(baseUrl, userEmail).catch(console.error);

