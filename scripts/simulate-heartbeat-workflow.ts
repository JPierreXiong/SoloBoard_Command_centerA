/**
 * 实战模拟：心跳检测工作流
 * 运行方式: npx tsx scripts/simulate-heartbeat-workflow.ts
 * 
 * 功能：
 * 1. 模拟活跃检测：将测试账户的 lastSeenAt 改为 40 天前
 * 2. 运行 Cron Job，验证状态变为 PENDING_VERIFICATION
 * 3. 模拟触发继承：将状态改为 PENDING_VERIFICATION 且 updatedAt 为 8 天前
 * 4. 再次运行 Cron Job，验证状态变为 TRIGGERED
 * 
 * 注意: 需要设置环境变量
 * - DATABASE_URL
 * - RESEND_API_KEY
 * - TEST_USER_ID (可选，如果不提供会创建测试用户)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { digitalVaults, beneficiaries, emailNotifications } from '@/config/db/schema';
import { eq, desc } from 'drizzle-orm';
import { VaultStatus } from '@/shared/models/digital-vault';

async function simulateWorkflow() {
  try {
    console.log('🎭 实战模拟：心跳检测工作流\n');

    // 获取测试用户 ID（从环境变量或创建测试数据）
    const testUserId = process.env.TEST_USER_ID;
    if (!testUserId) {
      console.log('⚠️  TEST_USER_ID 未设置，请先创建测试用户和保险箱');
      console.log('   或在 .env.local 中设置 TEST_USER_ID=your-user-id\n');
      process.exit(1);
    }

    // 查找测试用户的保险箱
    const [vault] = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.userId, testUserId))
      .limit(1);

    if (!vault) {
      console.log('❌ 未找到测试用户的保险箱');
      console.log(`   用户 ID: ${testUserId}`);
      console.log('   请先创建保险箱\n');
      process.exit(1);
    }

    console.log(`📦 找到测试保险箱: ${vault.id}`);
    console.log(`   当前状态: ${vault.status}`);
    console.log(`   最后活跃: ${vault.lastSeenAt}\n`);

    // ============================================
    // 阶段 1: 模拟活跃检测
    // ============================================
    console.log('1️⃣ 阶段 1: 模拟活跃检测（40 天前）\n');

    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    await db()
      .update(digitalVaults)
      .set({
        lastSeenAt: fortyDaysAgo,
        status: VaultStatus.ACTIVE,
        warningEmailCount: 0,
        warningEmailSentAt: null,
        reminderEmailSentAt: null,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })
      .where(eq(digitalVaults.id, vault.id));

    console.log(`   ✅ 已将 lastSeenAt 设置为: ${fortyDaysAgo.toISOString()}`);
    console.log(`   ✅ 状态已重置为: ACTIVE\n`);

    console.log('   📧 现在运行 Cron Job 来触发预警邮件...');
    console.log('   命令: npx tsx scripts/test-cron-job.ts\n');

    // 等待用户确认
    console.log('   ⏸️  请先运行 Cron Job，然后按任意键继续...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(null));
    });

    // 验证状态
    const [updatedVault1] = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.id, vault.id));

    console.log(`\n   📊 验证结果:`);
    console.log(`      状态: ${updatedVault1.status}`);
    console.log(`      预警邮件计数: ${updatedVault1.warningEmailCount || 0}`);
    console.log(`      预警邮件发送时间: ${updatedVault1.warningEmailSentAt || '未发送'}`);

    if (updatedVault1.status === VaultStatus.PENDING_VERIFICATION) {
      console.log(`   ✅ 状态已正确变为 PENDING_VERIFICATION\n`);
    } else {
      console.log(`   ⚠️  状态未变为 PENDING_VERIFICATION，当前状态: ${updatedVault1.status}\n`);
    }

    // ============================================
    // 阶段 2: 模拟触发继承
    // ============================================
    console.log('2️⃣ 阶段 2: 模拟触发继承（8 天前进入宽限期）\n');

    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    await db()
      .update(digitalVaults)
      .set({
        status: VaultStatus.PENDING_VERIFICATION,
        updatedAt: eightDaysAgo,
        warningEmailSentAt: eightDaysAgo,
        warningEmailCount: 3, // 已发送3次
      })
      .where(eq(digitalVaults.id, vault.id));

    console.log(`   ✅ 已将状态设置为: PENDING_VERIFICATION`);
    console.log(`   ✅ 已将 updatedAt 设置为: ${eightDaysAgo.toISOString()}`);
    console.log(`   ✅ 预警邮件计数: 3\n`);

    // 检查是否有受益人
    const beneficiariesList = await db()
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.vaultId, vault.id));

    console.log(`   📋 受益人数量: ${beneficiariesList.length}`);
    if (beneficiariesList.length > 0) {
      beneficiariesList.forEach((b, i) => {
        console.log(`      ${i + 1}. ${b.name} (${b.email})`);
        console.log(`         地址完整: ${b.receiverName && b.addressLine1 && b.city ? '✅' : '❌'}`);
      });
    } else {
      console.log(`   ⚠️  没有受益人，无法测试继承流程\n`);
    }

    console.log('\n   📧 现在运行 Cron Job 来触发 Dead Man\'s Switch...');
    console.log('   命令: npx tsx scripts/test-cron-job.ts\n');

    // 等待用户确认
    console.log('   ⏸️  请先运行 Cron Job，然后按任意键继续...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(null));
    });

    // 验证状态
    const [updatedVault2] = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.id, vault.id));

    console.log(`\n   📊 验证结果:`);
    console.log(`      状态: ${updatedVault2.status}`);
    console.log(`      Dead Man's Switch 激活时间: ${updatedVault2.deadManSwitchActivatedAt || '未激活'}`);

    if (updatedVault2.status === VaultStatus.TRIGGERED) {
      console.log(`   ✅ 状态已正确变为 TRIGGERED\n`);
    } else {
      console.log(`   ⚠️  状态未变为 TRIGGERED，当前状态: ${updatedVault2.status}\n`);
    }

    // 检查邮件通知记录
    const emailNotifications = await db()
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.vaultId, vault.id))
      .orderBy(desc(emailNotifications.createdAt))
      .limit(10);

    console.log(`   📧 邮件通知记录: ${emailNotifications.length} 条`);
    emailNotifications.forEach((email, i) => {
      console.log(`      ${i + 1}. ${email.emailType} - ${email.status} (${email.recipientEmail})`);
    });

    console.log('\n✅ 实战模拟完成！');
    console.log('\n📝 验证清单:');
    console.log('   [ ] 状态从 ACTIVE 变为 PENDING_VERIFICATION');
    console.log('   [ ] 预警邮件已发送');
    console.log('   [ ] email_notifications 表有记录');
    console.log('   [ ] 状态从 PENDING_VERIFICATION 变为 TRIGGERED');
    console.log('   [ ] Dead Man\'s Switch 已激活');
    console.log('   [ ] 受益人通知邮件已发送');
    if (beneficiariesList.length > 0 && beneficiariesList[0].receiverName) {
      console.log('   [ ] ShipAny 物流订单已创建（如果地址完整）');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ 模拟失败:', error);
    process.exit(1);
  }
}

simulateWorkflow();
