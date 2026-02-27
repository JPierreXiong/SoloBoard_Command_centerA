/**
 * 查找测试用户和保险箱
 * 运行方式: npx tsx scripts/find-test-user-and-vault.ts
 * 
 * 功能：
 * 1. 列出数据库中的所有用户（前10个）
 * 2. 列出每个用户的保险箱
 * 3. 提供设置 TEST_USER_ID 的命令
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { digitalVaults } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

async function findTestUserAndVault() {
  try {
    console.log('🔍 查找测试用户和保险箱...\n');

    // 获取前10个用户
    const users = await db()
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })
      .from(user)
      .limit(10)
      .orderBy(user.createdAt);

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户');
      console.log('\n💡 提示:');
      console.log('   1. 在应用中注册一个用户');
      console.log('   2. 创建数字保险箱');
      console.log('   3. 然后运行此脚本查找用户 ID');
      process.exit(1);
    }

    console.log(`📋 找到 ${users.length} 个用户:\n`);

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      console.log(`${i + 1}. 用户 ID: ${u.id}`);
      console.log(`   邮箱: ${u.email || 'N/A'}`);
      console.log(`   姓名: ${u.name || 'N/A'}`);
      console.log(`   创建时间: ${u.createdAt || 'N/A'}`);

      // 查找该用户的保险箱
      const vaults = await db()
        .select({
          id: digitalVaults.id,
          status: digitalVaults.status,
          deadManSwitchEnabled: digitalVaults.deadManSwitchEnabled,
          lastSeenAt: digitalVaults.lastSeenAt,
        })
        .from(digitalVaults)
        .where(eq(digitalVaults.userId, u.id))
        .limit(5);

      if (vaults.length > 0) {
        console.log(`   📦 保险箱数量: ${vaults.length}`);
        vaults.forEach((vault, idx) => {
          console.log(`      ${idx + 1}. Vault ID: ${vault.id}`);
          console.log(`         状态: ${vault.status}`);
          console.log(`         Dead Man's Switch: ${vault.deadManSwitchEnabled ? '启用' : '禁用'}`);
          console.log(`         最后活跃: ${vault.lastSeenAt || 'N/A'}`);
        });
        console.log(`\n   ✅ 可以使用此用户进行测试:`);
        console.log(`   $env:TEST_USER_ID="${u.id}"`);
      } else {
        console.log(`   ⚠️  该用户没有保险箱`);
      }
      console.log('');
    }

    // 推荐第一个有保险箱的用户
    for (const u of users) {
      const vaults = await db()
        .select()
        .from(digitalVaults)
        .where(eq(digitalVaults.userId, u.id))
        .limit(1);

      if (vaults.length > 0) {
        console.log('🎯 推荐测试用户:');
        console.log(`   用户 ID: ${u.id}`);
        console.log(`   邮箱: ${u.email || 'N/A'}`);
        console.log(`   保险箱 ID: ${vaults[0].id}`);
        console.log(`\n📝 设置环境变量:`);
        console.log(`   $env:TEST_USER_ID="${u.id}"`);
        console.log(`\n🚀 然后运行:`);
        console.log(`   npx tsx scripts/simulate-heartbeat-workflow.ts`);
        break;
      }
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ 查找失败:', error);
    if (error.message) {
      console.error('   错误详情:', error.message);
    }
    process.exit(1);
  }
}

findTestUserAndVault();
