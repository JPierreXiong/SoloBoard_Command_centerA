/**
 * 更新 Resend 发件人邮箱到数据库
 * 运行方式: npx tsx scripts/update-resend-sender-email.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '../src/core/db';
import { config } from '../src/config/db/schema';

async function updateResendSenderEmail() {
  try {
    console.log('🚀 更新 Resend 发件人邮箱...\n');

    const newSenderEmail = 'support@digitalheirloom.app';

    const database = db();
    
    console.log('📝 更新配置：');
    console.log(`   resend_sender_email: ${newSenderEmail}`);
    console.log('');

    // 更新配置
    await database.transaction(async (tx: any) => {
      await tx
        .insert(config)
        .values({ name: 'resend_sender_email', value: newSenderEmail })
        .onConflictDoUpdate({
          target: config.name,
          set: { value: newSenderEmail },
        });
      console.log(`✅ resend_sender_email 更新成功`);
    });

    console.log('\n🎉 Resend 发件人邮箱更新完成！');
    console.log(`   新发件人邮箱: ${newSenderEmail}`);
    console.log('\n📌 下一步：');
    console.log('   1. 确保 support@digitalheirloom.app 已在 Resend Dashboard 中验证');
    console.log('   2. 测试邮件发送: npx tsx scripts/test-email-service.ts');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失败:', error);
    if (error instanceof Error) {
      console.error('   错误详情:', error.message);
      if (error.stack) {
        console.error('   堆栈:', error.stack);
      }
    }
    process.exit(1);
  }
}

updateResendSenderEmail();
