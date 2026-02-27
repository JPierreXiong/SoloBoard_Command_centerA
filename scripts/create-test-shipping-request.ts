/**
 * 创建测试物流请求脚本（TypeScript 版本）
 * 用途：在数据库中创建一条"待审核"的物流记录，用于测试管理员页面
 * 运行方式：tsx scripts/create-test-shipping-request.ts
 * 
 * 注意：此脚本需要先执行数据库迁移（scripts/migrate-shipping-logs.sql）
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/core/db/index.js';
import { shippingLogs, digitalVaults, beneficiaries, user } from '../src/config/db/schema.js';
import { eq } from 'drizzle-orm';
import { getUuid } from '../src/shared/lib/hash.js';

async function createTestShippingRequest() {
  try {
    console.log('🚀 开始创建测试物流请求...\n');

    const database = db();

    // 1. 查找一个已存在的用户（Pro 版用户）
    const [testUser] = await database
      .select()
      .from(user)
      .where(eq(user.planType, 'pro'))
      .limit(1);

    if (!testUser) {
      console.log('⚠️ 未找到 Pro 版用户，尝试查找任意用户...');
      const [anyUser] = await database.select().from(user).limit(1);
      if (!anyUser) {
        console.error('❌ 数据库中没有任何用户，请先注册一个用户');
        process.exit(1);
      }
      console.log(`✅ 找到用户: ${anyUser.email} (计划: ${anyUser.planType || 'free'})`);
      console.log('⚠️ 注意：该用户不是 Pro 版，物流请求可能无法正常触发\n');
    } else {
      console.log(`✅ 找到 Pro 版用户: ${testUser.email}\n`);
    }

    const userId = testUser?.id || (await database.select().from(user).limit(1))[0].id;

    // 2. 查找或创建数字保险箱
    let [vault] = await database
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.userId, userId))
      .limit(1);

    if (!vault) {
      console.log('⚠️ 用户没有数字保险箱，创建一个测试保险箱...');
      const vaultId = getUuid();
      await database.insert(digitalVaults).values({
        id: vaultId,
        userId: userId,
        encryptedData: 'test_encrypted_data',
        encryptionSalt: 'test_salt',
        encryptionIv: 'test_iv',
        recoveryBackupToken: 'test_recovery_token',
        recoveryBackupSalt: 'test_recovery_salt',
        recoveryBackupIv: 'test_recovery_iv',
        heartbeatFrequency: 90,
        gracePeriod: 7,
        deadManSwitchEnabled: true,
        status: 'released', // 模拟已释放状态
        lastSeenAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100天前
      });
      [vault] = await database
        .select()
        .from(digitalVaults)
        .where(eq(digitalVaults.id, vaultId))
        .limit(1);
      console.log(`✅ 创建测试保险箱: ${vaultId}\n`);
    }

    // 3. 查找或创建受益人
    let [beneficiary] = await database
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.vaultId, vault.id))
      .limit(1);

    if (!beneficiary) {
      console.log('⚠️ 保险箱没有受益人，创建一个测试受益人...');
      const beneficiaryId = getUuid();
      await database.insert(beneficiaries).values({
        id: beneficiaryId,
        vaultId: vault.id,
        name: 'Test Beneficiary',
        email: 'beneficiary@example.com',
        relationship: 'friend',
        language: 'zh',
        phone: '+86 13800138000',
        receiverName: 'Test Receiver',
        addressLine1: '123 Test Street',
        city: 'Beijing',
        zipCode: '100000',
        countryCode: 'CN',
        status: 'released', // 模拟已释放状态
      });
      [beneficiary] = await database
        .select()
        .from(beneficiaries)
        .where(eq(beneficiaries.id, beneficiaryId))
        .limit(1);
      console.log(`✅ 创建测试受益人: ${beneficiaryId}\n`);
    }

    // 4. 创建物流请求
    const shippingLogId = getUuid();
    const testShippingLog = {
      id: shippingLogId,
      vaultId: vault.id,
      beneficiaryId: beneficiary.id,
      receiverName: beneficiary.receiverName || beneficiary.name,
      receiverPhone: beneficiary.phone || '+86 13800138000',
      addressLine1: beneficiary.addressLine1 || '123 Test Street',
      city: beneficiary.city || 'Beijing',
      zipCode: beneficiary.zipCode || '100000',
      countryCode: beneficiary.countryCode || 'CN',
      shippingFeeStatus: 'not_required',
      estimatedAmount: 1500, // 15.00 USD in cents
      status: 'pending_review',
      requestedAt: new Date(),
    };

    await database.insert(shippingLogs).values(testShippingLog);

    console.log('✅ 测试物流请求创建成功！\n');
    console.log('📋 请求详情：');
    console.log(`   ID: ${shippingLogId}`);
    console.log(`   保险箱 ID: ${vault.id}`);
    console.log(`   受益人: ${beneficiary.name} (${beneficiary.email})`);
    console.log(`   收货地址: ${testShippingLog.addressLine1}, ${testShippingLog.city}`);
    console.log(`   状态: ${testShippingLog.status}`);
    console.log(`   运费状态: ${testShippingLog.shippingFeeStatus}`);
    console.log(`   预估运费: $${(testShippingLog.estimatedAmount! / 100).toFixed(2)}\n`);

    console.log('🎯 下一步操作：');
    console.log('   1. 访问 http://localhost:3000/admin/shipping-requests');
    console.log('   2. 找到刚创建的物流请求');
    console.log('   3. 点击"核算运费"按钮');
    console.log('   4. 输入金额并发送支付链接');
    console.log('   5. 测试完整流程\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试物流请求失败:', error);
    process.exit(1);
  }
}

createTestShippingRequest();

