/**
 * 配置 Creem 支付设置到数据库
 * 运行方式: npx tsx scripts/configure-creem-db.ts
 * 
 * 注意: 需要设置 DATABASE_URL 环境变量
 * 可以通过 .env.local 文件或环境变量设置
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local, .env.development, and .env files
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '../src/core/db';
import { config } from '../src/config/db/schema';

async function configureCreem() {
  try {
    console.log('🚀 开始配置 Creem 支付...\n');

    const creemConfigs = {
      creem_enabled: 'true',
      creem_environment: 'production', // 使用生产环境
      creem_api_key: 'creem_2HGGaY2qzPVRkCP0kESZXU', // Digital Heirloom API Key
      creem_signing_secret: 'whsec_567Ldwvldo5m33S87geqWy', // Digital Heirloom Webhook Secret
      creem_product_ids: JSON.stringify({
        'digital-heirloom-base-annual': 'prod_4oN2BFtSPSpAnYcvUN0uoi', // Base (Standard) Product: $49/year
        'digital-heirloom-pro-annual': 'prod_4epepOcgUjSjPoWmAnBaFt', // Pro (Family/Premium) Product: $149/year
      }, null, 2),
      default_payment_provider: 'creem',
    };

    const database = db();
    
    console.log('📝 配置项：');
    for (const [name, value] of Object.entries(creemConfigs)) {
      if (name === 'creem_signing_secret' || name === 'creem_api_key') {
        console.log(`   ${name}: ${value.substring(0, 20)}...`);
      } else if (name === 'creem_product_ids') {
        console.log(`   ${name}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ${name}: ${value}`);
      }
    }
    console.log('');

    // 使用事务插入/更新配置
    await database.transaction(async (tx: any) => {
      for (const [name, value] of Object.entries(creemConfigs)) {
        await tx
          .insert(config)
          .values({ name, value })
          .onConflictDoUpdate({
            target: config.name,
            set: { value },
          });
        console.log(`✅ ${name} 配置成功`);
      }
    });

    console.log('\n🎉 Creem 配置完成！');
    console.log('\n📌 下一步：');
    console.log('   1. 访问 http://localhost:3000/admin/settings/payment 确认配置');
    console.log('   2. 确保 creem_enabled 已启用');
    console.log('   3. 测试支付流程');
    console.log('   4. 在 Creem Dashboard 配置 Webhook:');
    console.log('      URL: https://www.digitalheirloom.app/api/payment/notify/creem');
    console.log('      Secret: whsec_567Ldwvldo5m33S87geqWy');
    console.log('   5. 在 Vercel Dashboard 配置环境变量（见 VERCEL_CONFIGURATION_GUIDE.md）');
    
    // Close database connection if needed
    process.exit(0);
  } catch (error) {
    console.error('❌ 配置失败:', error);
    if (error instanceof Error) {
      console.error('   错误详情:', error.message);
      if (error.stack) {
        console.error('   堆栈:', error.stack);
      }
    }
    process.exit(1);
  }
}

configureCreem();
