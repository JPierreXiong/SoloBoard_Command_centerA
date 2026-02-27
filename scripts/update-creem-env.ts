/**
 * 更新 .env.local 文件中的 Creem 配置
 * 运行方式: npx tsx scripts/update-creem-env.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = path.join(process.cwd(), '.env.local');
const CREEM_API_KEY = 'creem_2HGGaY2qzPVRkCP0kESZXU';
const CREEM_SIGNING_SECRET = 'whsec_567Ldwvldo5m33S87geqWy';

async function updateCreemConfig() {
  try {
    console.log('🚀 开始更新 Creem 支付配置...\n');

    // 读取现有的 .env.local 文件
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    }

    // Creem 配置项
    const creemConfigs = {
      CREEM_ENABLED: 'true',
      CREEM_ENVIRONMENT: 'production', // 使用生产环境
      CREEM_API_KEY: CREEM_API_KEY,
      CREEM_SIGNING_SECRET: CREEM_SIGNING_SECRET,
    };

    // 更新或添加配置项
    let updated = false;
    for (const [key, value] of Object.entries(creemConfigs)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        // 更新现有配置
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`✅ 更新 ${key}`);
        updated = true;
      } else {
        // 添加新配置
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += `# Creem Payment Configuration\n`;
        envContent += `${key}=${value}\n`;
        console.log(`✅ 添加 ${key}`);
        updated = true;
      }
    }

    // 确保有 Creem 配置区域
    if (!envContent.includes('# Creem Payment Configuration')) {
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `# ============================================\n`;
      envContent += `# Creem Payment Configuration\n`;
      envContent += `# ============================================\n`;
      for (const [key, value] of Object.entries(creemConfigs)) {
        envContent += `${key}=${value}\n`;
      }
      updated = true;
    }

    if (updated) {
      // 写入文件
      fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
      console.log('\n🎉 Creem 配置已更新到 .env.local');
      console.log('\n📌 配置项：');
      for (const [key, value] of Object.entries(creemConfigs)) {
        if (key.includes('KEY') || key.includes('SECRET')) {
          console.log(`   ${key}: ${value.substring(0, 20)}...`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }
      console.log('\n⚠️  注意：请重启开发服务器以使配置生效');
      console.log('   运行: pnpm dev');
    } else {
      console.log('\n✅ Creem 配置已存在，无需更新');
    }

    console.log('\n📌 下一步：');
    console.log('   1. 重启开发服务器: pnpm dev');
    console.log('   2. 在 Creem Dashboard 配置 Webhook URL:');
    console.log('      URL: https://www.digitalheirloom.app/api/payment/notify/creem');
    console.log('      Secret: whsec_567Ldwvldo5m33S87geqWy');
    console.log('   3. 测试支付流程');
  } catch (error: any) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
}

updateCreemConfig();
