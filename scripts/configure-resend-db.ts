/**
 * 配置 Resend 邮件服务设置到数据库
 * 运行方式: npx tsx scripts/configure-resend-db.ts
 * 
 * 注意: 需要设置 DATABASE_URL 和 RESEND_API_KEY 环境变量
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

async function configureResend() {
  try {
    console.log('🚀 开始配置 Resend 邮件服务...\n');

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendSenderEmail = process.env.RESEND_SENDER_EMAIL || process.env.RESEND_DEFAULT_FROM || 'support@digitalheirloom.app';

    if (!resendApiKey) {
      console.error('❌ 错误: RESEND_API_KEY 环境变量未设置');
      console.log('\n📌 请设置以下环境变量:');
      console.log('   RESEND_API_KEY=re_your-resend-api-key');
      console.log('   RESEND_SENDER_EMAIL=your-verified-email@domain.com (可选)');
      console.log('\n💡 提示:');
      console.log('   1. 在 .env.local 文件中添加 RESEND_API_KEY');
      console.log('   2. 或在运行命令时设置: $env:RESEND_API_KEY="re_xxx" npx tsx scripts/configure-resend-db.ts');
      process.exit(1);
    }

    const resendConfigs = {
      resend_api_key: resendApiKey,
      resend_sender_email: resendSenderEmail,
    };

    const database = db();
    
    console.log('📝 配置项：');
    console.log(`   resend_api_key: ${resendApiKey.substring(0, 20)}...`);
    console.log(`   resend_sender_email: ${resendSenderEmail}`);
    console.log('');

    // 使用事务插入/更新配置
    await database.transaction(async (tx: any) => {
      for (const [name, value] of Object.entries(resendConfigs)) {
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

    console.log('\n🎉 Resend 配置完成！');
    console.log('\n📌 下一步：');
    console.log('   1. 测试邮件发送: npx tsx scripts/test-email-service.ts');
    console.log('   2. 确保发件人邮箱已在 Resend Dashboard 中验证');
    console.log('   3. 检查邮件发送日志: email_notifications 表');
    
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

configureResend();
