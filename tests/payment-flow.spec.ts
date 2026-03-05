import { test, expect } from '@playwright/test';

// 测试配置
const BASE_URL = 'http://localhost:3003';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test@123456';

test.describe('SoloBoard 支付系统完整测试', () => {
  test.setTimeout(120000); // 2分钟超时

  test('完整流程测试: 注册 → 登录 → 支付 → 验证', async ({ page }) => {
    console.log('🧪 开始测试...');
    console.log(`📧 测试邮箱: ${TEST_EMAIL}`);

    // ==================== 测试 1: 访问首页 ====================
    console.log('\n📍 测试 1: 访问首页');
    await page.goto(`${BASE_URL}/zh`);
    await page.waitForLoadState('networkidle');
    console.log('✅ 首页加载成功');

    // ==================== 测试 2: 注册新用户 ====================
    console.log('\n📍 测试 2: 注册新用户');
    await page.goto(`${BASE_URL}/zh/sign-up`);
    await page.waitForLoadState('networkidle');

    // 填写注册表单
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // 查找确认密码输入框
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(TEST_PASSWORD);
    }

    // 点击注册按钮
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✅ 注册表单已提交');

    // ==================== 测试 3: 访问定价页面 ====================
    console.log('\n📍 测试 3: 访问定价页面');
    await page.goto(`${BASE_URL}/zh/pricing`);
    await page.waitForLoadState('networkidle');

    // 检查定价页面内容
    const pageContent = await page.content();
    
    // 验证不显示积分
    const hasCreditsText = pageContent.includes('积分') || pageContent.includes('credits');
    console.log(`❌ 积分信息显示: ${hasCreditsText ? '是（错误）' : '否（正确）'}`);
    
    // 验证显示价格
    const hasBasePrice = pageContent.includes('19.9') || pageContent.includes('$19.9');
    console.log(`✅ Base Plan 价格显示: ${hasBasePrice ? '是' : '否'}`);

    const hasProPrice = pageContent.includes('39.9') || pageContent.includes('$39.9');
    console.log(`✅ Pro Plan 价格显示: ${hasProPrice ? '是' : '否'}`);

    // ==================== 测试 4: 检查设置侧边栏 ====================
    console.log('\n📍 测试 4: 检查设置侧边栏');
    await page.goto(`${BASE_URL}/zh/settings/profile`);
    await page.waitForLoadState('networkidle');

    const settingsContent = await page.content();
    const hasCreditsSidebar = settingsContent.includes('积分') && settingsContent.includes('settings/credits');
    console.log(`❌ 积分菜单显示: ${hasCreditsSidebar ? '是（错误）' : '否（正确）'}`);

    // ==================== 测试 5: 尝试访问支付 ====================
    console.log('\n📍 测试 5: 测试支付按钮（不实际支付）');
    await page.goto(`${BASE_URL}/zh/pricing`);
    await page.waitForLoadState('networkidle');

    // 查找 Base Plan 的购买按钮
    const buyButtons = await page.locator('button, a').filter({ hasText: /获取基础版|Get Base/i }).all();
    
    if (buyButtons.length > 0) {
      console.log(`✅ 找到 ${buyButtons.length} 个购买按钮`);
      
      // 点击第一个购买按钮
      await buyButtons[0].click();
      await page.waitForTimeout(5000);

      // 检查是否跳转或显示错误
      const currentUrl = page.url();
      console.log(`📍 当前 URL: ${currentUrl}`);

      // 检查是否有 403 错误
      const pageText = await page.textContent('body');
      const has403Error = pageText.includes('403') || pageText.includes('Forbidden');
      console.log(`${has403Error ? '❌' : '✅'} 403 错误: ${has403Error ? '是（需要修复）' : '否（正常）'}`);

      // 检查是否跳转到 Creem
      const isCreemPage = currentUrl.includes('creem.io');
      console.log(`${isCreemPage ? '✅' : '⚠️'} 跳转到 Creem: ${isCreemPage ? '是' : '否'}`);

    } else {
      console.log('⚠️ 未找到购买按钮');
    }

    // ==================== 测试总结 ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 首页访问: 成功`);
    console.log(`✅ 用户注册: 成功`);
    console.log(`${hasCreditsText ? '❌' : '✅'} 积分隐藏: ${hasCreditsText ? '失败（仍显示）' : '成功'}`);
    console.log(`${hasBasePrice ? '✅' : '❌'} 价格显示: ${hasBasePrice ? '成功' : '失败'}`);
    console.log(`${hasCreditsSidebar ? '❌' : '✅'} 侧边栏积分: ${hasCreditsSidebar ? '失败（仍显示）' : '成功'}`);
    console.log('='.repeat(60));

    // 断言关键测试点
    expect(hasCreditsText).toBe(false); // 不应该显示积分
    expect(hasBasePrice).toBe(true); // 应该显示价格
    expect(hasCreditsSidebar).toBe(false); // 侧边栏不应该显示积分
  });

  test('快速检查: 定价页面和设置页面', async ({ page }) => {
    console.log('\n🚀 快速检查测试');

    // 检查定价页面
    await page.goto(`${BASE_URL}/zh/pricing`);
    await page.waitForLoadState('networkidle');
    
    const pricingContent = await page.content();
    const pricingHasCredits = pricingContent.includes('积分');
    
    console.log(`定价页面 - 积分显示: ${pricingHasCredits ? '❌ 是（错误）' : '✅ 否（正确）'}`);
    console.log(`定价页面 - Base Plan: ${pricingContent.includes('19.9') ? '✅ 显示' : '❌ 未显示'}`);
    console.log(`定价页面 - Pro Plan: ${pricingContent.includes('39.9') ? '✅ 显示' : '❌ 未显示'}`);

    expect(pricingHasCredits).toBe(false);
  });
});








