/**
 * 支付系统配置诊断脚本
 * 运行方式: npx tsx scripts/diagnose-payment-config.ts
 * 
 * 注意: 此脚本会从数据库和环境变量读取配置
 * 确保已设置 DATABASE_URL 环境变量（如果使用数据库配置）
 */

import { getAllConfigs } from '../src/shared/models/config';

async function diagnosePaymentConfig() {
  console.log('🔍 开始诊断支付系统配置...\n');

  try {
    const configs = await getAllConfigs();

    // 1. 检查支付提供商启用状态
    console.log('📋 支付提供商启用状态:');
    const enabledProviders: string[] = [];
    
    if (configs.stripe_enabled === 'true') {
      enabledProviders.push('Stripe');
      console.log('  ✅ Stripe: 已启用');
    } else {
      console.log('  ❌ Stripe: 未启用');
    }

    if (configs.creem_enabled === 'true') {
      enabledProviders.push('Creem');
      console.log('  ✅ Creem: 已启用');
    } else {
      console.log('  ❌ Creem: 未启用');
    }

    if (configs.paypal_enabled === 'true') {
      enabledProviders.push('PayPal');
      console.log('  ✅ PayPal: 已启用');
    } else {
      console.log('  ❌ PayPal: 未启用');
    }

    console.log('');

    // 2. 检查默认支付提供商
    console.log('🎯 默认支付提供商:');
    const defaultProvider = configs.default_payment_provider;
    if (defaultProvider) {
      console.log(`  ✅ 已设置: ${defaultProvider}`);
    } else {
      console.log('  ⚠️  未设置默认支付提供商');
      if (enabledProviders.length === 1) {
        console.log(`  💡 建议: 自动使用唯一启用的提供商 "${enabledProviders[0].toLowerCase()}"`);
      } else if (enabledProviders.length > 1) {
        console.log(`  ⚠️  警告: 有多个提供商启用，建议设置默认提供商`);
      }
    }
    console.log('');

    // 3. 检查 Creem 配置
    if (configs.creem_enabled === 'true') {
      console.log('🔵 Creem 配置详情:');
      
      // API Key
      if (configs.creem_api_key) {
        const maskedKey = configs.creem_api_key.substring(0, 20) + '...';
        console.log(`  ✅ API Key: ${maskedKey}`);
      } else {
        console.log('  ❌ API Key: 未配置');
      }

      // Environment
      if (configs.creem_environment) {
        const env = configs.creem_environment === 'production' ? '生产环境' : '沙箱环境';
        console.log(`  ${configs.creem_environment === 'production' ? '✅' : '⚠️'} Environment: ${env}`);
      } else {
        console.log('  ⚠️  Environment: 未配置（默认: sandbox）');
      }

      // Signing Secret
      if (configs.creem_signing_secret) {
        const maskedSecret = configs.creem_signing_secret.substring(0, 20) + '...';
        console.log(`  ✅ Signing Secret: ${maskedSecret}`);
      } else {
        console.log('  ⚠️  Signing Secret: 未配置（Webhook 验证可能失败）');
      }

      // Product IDs Mapping
      if (configs.creem_product_ids) {
        try {
          const productIds = JSON.parse(configs.creem_product_ids);
          const productCount = Object.keys(productIds).length;
          console.log(`  ✅ Product IDs Mapping: 已配置 ${productCount} 个产品映射`);
          console.log('     映射的产品:');
          for (const [key, value] of Object.entries(productIds)) {
            console.log(`       - ${key} -> ${value}`);
          }
        } catch (e) {
          console.log('  ❌ Product IDs Mapping: JSON 格式错误');
          console.log(`     错误: ${e}`);
        }
      } else {
        console.log('  ❌ Product IDs Mapping: 未配置');
        console.log('     ⚠️  这是导致支付失败的主要原因！');
        console.log('     💡 解决方案:');
        console.log('        1. 访问 Creem Dashboard: https://www.creem.io/dashboard/products');
        console.log('        2. 为每个 pricing item 创建对应的产品');
        console.log('        3. 在 admin settings 中配置 creem_product_ids，格式:');
        console.log('           {');
        console.log('             "product_id_1": "creem_prod_xxx",');
        console.log('             "product_id_2": "creem_prod_yyy"');
        console.log('           }');
      }
      console.log('');
    }

    // 4. 检查 Stripe 配置
    if (configs.stripe_enabled === 'true') {
      console.log('💳 Stripe 配置详情:');
      
      if (configs.stripe_secret_key && configs.stripe_publishable_key) {
        console.log('  ✅ API Keys: 已配置');
      } else {
        console.log('  ❌ API Keys: 未完整配置');
        if (!configs.stripe_secret_key) console.log('     - Secret Key 缺失');
        if (!configs.stripe_publishable_key) console.log('     - Publishable Key 缺失');
      }

      if (configs.stripe_signing_secret) {
        console.log('  ✅ Signing Secret: 已配置');
      } else {
        console.log('  ⚠️  Signing Secret: 未配置（Webhook 验证可能失败）');
      }
      console.log('');
    }

    // 5. 检查 PayPal 配置
    if (configs.paypal_enabled === 'true') {
      console.log('🟠 PayPal 配置详情:');
      
      if (configs.paypal_client_id && configs.paypal_client_secret) {
        console.log('  ✅ Credentials: 已配置');
      } else {
        console.log('  ❌ Credentials: 未完整配置');
        if (!configs.paypal_client_id) console.log('     - Client ID 缺失');
        if (!configs.paypal_client_secret) console.log('     - Client Secret 缺失');
      }

      if (configs.paypal_environment) {
        const env = configs.paypal_environment === 'production' ? '生产环境' : '沙箱环境';
        console.log(`  ${configs.paypal_environment === 'production' ? '✅' : '⚠️'} Environment: ${env}`);
      } else {
        console.log('  ⚠️  Environment: 未配置（默认: sandbox）');
      }
      console.log('');
    }

    // 6. 总结
    console.log('📊 诊断总结:');
    
    const issues: string[] = [];
    const warnings: string[] = [];

    if (enabledProviders.length === 0) {
      issues.push('没有启用任何支付提供商');
    }

    if (!defaultProvider && enabledProviders.length > 1) {
      warnings.push('多个提供商启用但未设置默认提供商');
    }

    if (configs.creem_enabled === 'true') {
      if (!configs.creem_api_key) {
        issues.push('Creem API Key 未配置');
      }
      if (!configs.creem_product_ids) {
        issues.push('Creem Product IDs Mapping 未配置（这是支付失败的主要原因）');
      }
      if (!configs.creem_signing_secret) {
        warnings.push('Creem Signing Secret 未配置（Webhook 可能失败）');
      }
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('  ✅ 配置看起来正常！');
    } else {
      if (issues.length > 0) {
        console.log('  ❌ 发现的问题:');
        issues.forEach(issue => console.log(`     - ${issue}`));
      }
      if (warnings.length > 0) {
        console.log('  ⚠️  警告:');
        warnings.forEach(warning => console.log(`     - ${warning}`));
      }
    }

    console.log('\n💡 下一步:');
    if (configs.creem_enabled === 'true' && !configs.creem_product_ids) {
      console.log('  1. 配置 creem_product_ids 映射');
      console.log('  2. 访问 /admin/settings/payment 进行配置');
      console.log('  3. 测试支付流程');
    } else {
      console.log('  1. 测试支付流程');
      console.log('  2. 检查 Webhook 配置');
    }

  } catch (error) {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
  }
}

diagnosePaymentConfig();
