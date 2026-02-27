/**
 * 验证 Creem 配置脚本
 * 运行方式: npx tsx scripts/verify-creem-config.ts
 * 
 * 验证内容：
 * 1. API Key 和 Signing Secret 是否正确配置
 * 2. Product IDs 映射是否正确
 * 3. 产品链接格式是否正确
 */

import { getAllConfigs } from '../src/shared/models/config';

// 预期的配置值
const EXPECTED_CONFIG = {
  apiKey: 'creem_2HGGaY2qzPVRkCP0kESZXU',
  signingSecret: 'whsec_567Ldwvldo5m33S87geqWy',
  products: {
    base: {
      productId: 'digital-heirloom-base-annual',
      creemProductId: 'prod_4oN2BFtSPSpAnYcvUN0uoi',
      link: 'https://www.creem.io/payment/prod_4oN2BFtSPSpAnYcvUN0uoi',
    },
    pro: {
      productId: 'digital-heirloom-pro-annual',
      creemProductId: 'prod_4epepOcgUjSjPoWmAnBaFt',
      link: 'https://www.creem.io/payment/prod_4epepOcgUjSjPoWmAnBaFt',
    },
  },
};

async function verifyCreemConfig() {
  console.log('🔍 开始验证 Creem 配置...\n');

  try {
    const configs = await getAllConfigs();

    let allPassed = true;

    // 1. 验证 API Key
    console.log('1️⃣  验证 API Key:');
    if (configs.creem_api_key === EXPECTED_CONFIG.apiKey) {
      console.log('  ✅ API Key 正确配置');
      console.log(`     值: ${configs.creem_api_key.substring(0, 20)}...`);
    } else if (configs.creem_api_key) {
      console.log('  ⚠️  API Key 已配置，但与预期值不同');
      console.log(`     当前值: ${configs.creem_api_key.substring(0, 20)}...`);
      console.log(`     预期值: ${EXPECTED_CONFIG.apiKey.substring(0, 20)}...`);
    } else {
      console.log('  ❌ API Key 未配置');
      allPassed = false;
    }
    console.log('');

    // 2. 验证 Signing Secret
    console.log('2️⃣  验证 Signing Secret:');
    if (configs.creem_signing_secret === EXPECTED_CONFIG.signingSecret) {
      console.log('  ✅ Signing Secret 正确配置');
      console.log(`     值: ${configs.creem_signing_secret.substring(0, 20)}...`);
    } else if (configs.creem_signing_secret) {
      console.log('  ⚠️  Signing Secret 已配置，但与预期值不同');
      console.log(`     当前值: ${configs.creem_signing_secret.substring(0, 20)}...`);
      console.log(`     预期值: ${EXPECTED_CONFIG.signingSecret.substring(0, 20)}...`);
    } else {
      console.log('  ❌ Signing Secret 未配置');
      allPassed = false;
    }
    console.log('');

    // 3. 验证 Product IDs 映射
    console.log('3️⃣  验证 Product IDs 映射:');
    if (configs.creem_product_ids) {
      try {
        const productIds = JSON.parse(configs.creem_product_ids);
        
        // 验证 Base 产品
        const baseProductId = productIds[EXPECTED_CONFIG.products.base.productId];
        if (baseProductId === EXPECTED_CONFIG.products.base.creemProductId) {
          console.log('  ✅ Base 产品映射正确');
          console.log(`     ${EXPECTED_CONFIG.products.base.productId} -> ${baseProductId}`);
        } else if (baseProductId) {
          console.log('  ⚠️  Base 产品映射存在，但值不同');
          console.log(`     当前值: ${baseProductId}`);
          console.log(`     预期值: ${EXPECTED_CONFIG.products.base.creemProductId}`);
          allPassed = false;
        } else {
          console.log(`  ❌ Base 产品映射缺失: ${EXPECTED_CONFIG.products.base.productId}`);
          allPassed = false;
        }

        // 验证 Pro 产品
        const proProductId = productIds[EXPECTED_CONFIG.products.pro.productId];
        if (proProductId === EXPECTED_CONFIG.products.pro.creemProductId) {
          console.log('  ✅ Pro 产品映射正确');
          console.log(`     ${EXPECTED_CONFIG.products.pro.productId} -> ${proProductId}`);
        } else if (proProductId) {
          console.log('  ⚠️  Pro 产品映射存在，但值不同');
          console.log(`     当前值: ${proProductId}`);
          console.log(`     预期值: ${EXPECTED_CONFIG.products.pro.creemProductId}`);
          allPassed = false;
        } else {
          console.log(`  ❌ Pro 产品映射缺失: ${EXPECTED_CONFIG.products.pro.productId}`);
          allPassed = false;
        }

        // 显示所有映射
        console.log('\n     所有已配置的映射:');
        for (const [key, value] of Object.entries(productIds)) {
          console.log(`       - ${key} -> ${value}`);
        }
      } catch (e) {
        console.log('  ❌ Product IDs 映射 JSON 格式错误');
        console.log(`     错误: ${e}`);
        allPassed = false;
      }
    } else {
      console.log('  ❌ Product IDs 映射未配置');
      console.log('     需要配置 creem_product_ids，格式:');
      console.log('     {');
      console.log(`       "${EXPECTED_CONFIG.products.base.productId}": "${EXPECTED_CONFIG.products.base.creemProductId}",`);
      console.log(`       "${EXPECTED_CONFIG.products.pro.productId}": "${EXPECTED_CONFIG.products.pro.creemProductId}"`);
      console.log('     }');
      allPassed = false;
    }
    console.log('');

    // 4. 验证产品链接格式
    console.log('4️⃣  验证产品链接格式:');
    const baseLink = EXPECTED_CONFIG.products.base.link;
    const proLink = EXPECTED_CONFIG.products.pro.link;
    
    const linkPattern = /^https:\/\/www\.creem\.io\/payment\/prod_[a-zA-Z0-9]+$/;
    
    if (linkPattern.test(baseLink)) {
      console.log('  ✅ Base 产品链接格式正确');
      console.log(`     链接: ${baseLink}`);
    } else {
      console.log('  ❌ Base 产品链接格式错误');
      console.log(`     链接: ${baseLink}`);
      allPassed = false;
    }

    if (linkPattern.test(proLink)) {
      console.log('  ✅ Pro 产品链接格式正确');
      console.log(`     链接: ${proLink}`);
    } else {
      console.log('  ❌ Pro 产品链接格式错误');
      console.log(`     链接: ${proLink}`);
      allPassed = false;
    }
    console.log('');

    // 5. 验证其他配置
    console.log('5️⃣  验证其他配置:');
    
    if (configs.creem_enabled === 'true') {
      console.log('  ✅ Creem 已启用');
    } else {
      console.log('  ❌ Creem 未启用');
      console.log('     需要设置 creem_enabled = true');
      allPassed = false;
    }

    if (configs.creem_environment === 'production') {
      console.log('  ✅ Environment 设置为 production');
    } else {
      console.log(`  ⚠️  Environment: ${configs.creem_environment || '未设置'} (建议使用 production)`);
    }

    if (configs.default_payment_provider === 'creem') {
      console.log('  ✅ 默认支付提供商设置为 creem');
    } else {
      console.log(`  ⚠️  默认支付提供商: ${configs.default_payment_provider || '未设置'} (建议设置为 creem)`);
    }
    console.log('');

    // 总结
    console.log('📊 验证总结:');
    if (allPassed) {
      console.log('  ✅ 所有关键配置验证通过！');
      console.log('\n💡 下一步:');
      console.log('  1. 测试支付流程');
      console.log('  2. 验证 Webhook 配置');
      console.log('  3. 确认产品链接可以正常访问');
    } else {
      console.log('  ❌ 发现配置问题，请根据上述提示修复');
      console.log('\n💡 修复步骤:');
      console.log('  1. 运行配置脚本: node configure-creem.js');
      console.log('  2. 配置 Product IDs 映射');
      console.log('  3. 访问 /admin/settings/payment 确认配置');
    }

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

verifyCreemConfig();
