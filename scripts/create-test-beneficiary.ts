/**
 * 创建测试受益人并生成 Release Token
 * 用于 Phase 6 测试
 * 
 * 使用方法：
 * npx tsx scripts/create-test-beneficiary.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { beneficiaries, digitalVaults } from '@/config/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { 
  findBeneficiariesByVaultId, 
  generateReleaseToken,
  BeneficiaryStatus 
} from '@/shared/models/beneficiary';
import { getUuid } from '@/shared/lib/hash';
import { checkBeneficiaryLimit } from '@/shared/lib/digital-heirloom-plan-limits';

async function createTestBeneficiary() {
  console.log('🔧 创建测试受益人并生成 Release Token...\n');

  const vaultId = process.env.TEST_VAULT_ID || 'e2734f7f-1657-4670-a6e1-46c6a895e5a6';
  
  console.log(`📋 使用 Vault ID: ${vaultId}\n`);

  try {
    // 1. 检查 Vault 是否存在
    const [vault] = await db()
      .select()
      .from(digitalVaults)
      .where(eq(digitalVaults.id, vaultId))
      .limit(1);

    if (!vault) {
      console.error(`❌ Vault ${vaultId} 不存在！`);
      console.log('💡 请先运行: npx tsx scripts/get-test-data.ts 获取有效的 Vault ID\n');
      process.exit(1);
    }

    console.log(`✅ 找到 Vault:`);
    console.log(`   计划等级: ${vault.planLevel}`);
    console.log(`   状态: ${vault.status}\n`);

    // 2. 检查受益人限制
    console.log('📊 检查受益人限制...');
    const limitCheck = await checkBeneficiaryLimit(vaultId);
    
    if (!limitCheck.allowed) {
      console.log(`   ⚠️  ${limitCheck.reason}`);
      console.log(`   📊 当前数量: ${limitCheck.currentCount} / ${limitCheck.maxCount}\n`);
      
      // 如果已达到限制，使用现有受益人
      const existingBeneficiaries = await findBeneficiariesByVaultId(vaultId);
      if (existingBeneficiaries.length > 0) {
        const beneficiary = existingBeneficiaries[0];
        console.log(`✅ 使用现有受益人:`);
        console.log(`   受益人 ID: ${beneficiary.id}`);
        console.log(`   姓名: ${beneficiary.name}`);
        console.log(`   邮箱: ${beneficiary.email}`);
        console.log(`   状态: ${beneficiary.status}`);
        console.log(`   Release Token: ${beneficiary.releaseToken || '未设置'}\n`);

        // 如果已有 Token 且未过期，直接使用
        if (beneficiary.releaseToken && beneficiary.releaseTokenExpiresAt) {
          const expiresAt = new Date(beneficiary.releaseTokenExpiresAt);
          const now = new Date();
          if (now < expiresAt) {
            console.log('✅ 现有 Release Token 仍然有效！\n');
            console.log('📋 请复制以下命令到 PowerShell 设置环境变量:\n');
            console.log(`$env:TEST_RELEASE_TOKEN="${beneficiary.releaseToken}"\n`);
            console.log('📋 验证环境变量:\n');
            console.log('echo "Token: $env:TEST_RELEASE_TOKEN"\n');
            console.log('📋 运行 Phase 6 测试:\n');
            console.log('npx tsx scripts/test-phase-4-7.ts\n');
            return;
          }
        }

        // 为现有受益人生成新的 Token
        console.log('🔄 为现有受益人生成新的 Release Token...');
        const updated = await generateReleaseToken(beneficiary.id);
        
        if (updated && updated.releaseToken) {
          console.log('✅ Release Token 生成成功！\n');
          console.log('📋 请复制以下命令到 PowerShell 设置环境变量:\n');
          console.log(`$env:TEST_RELEASE_TOKEN="${updated.releaseToken}"\n`);
          console.log('📋 验证环境变量:\n');
          console.log('echo "Token: $env:TEST_RELEASE_TOKEN"\n');
          console.log('📋 运行 Phase 6 测试:\n');
          console.log('npx tsx scripts/test-phase-4-7.ts\n');
          return;
        }
      }
    }

    // 3. 如果未达到限制，创建新受益人
    console.log('📝 创建新的测试受益人...');
    
    const newBeneficiary = {
      id: getUuid(),
      vaultId,
      name: 'Test Beneficiary',
      email: `test-beneficiary-${Date.now()}@example.com`,
      relationship: 'friend',
      status: BeneficiaryStatus.PENDING,
      decryptionLimit: 1,
      decryptionCount: 0,
    };

    const [created] = await db()
      .insert(beneficiaries)
      .values(newBeneficiary)
      .returning();

    console.log('✅ 受益人创建成功！');
    console.log(`   受益人 ID: ${created.id}`);
    console.log(`   姓名: ${created.name}`);
    console.log(`   邮箱: ${created.email}\n`);

    // 4. 生成 Release Token
    console.log('🔄 生成 Release Token...');
    const updated = await generateReleaseToken(created.id);
    
    if (updated && updated.releaseToken) {
      console.log('✅ Release Token 生成成功！');
      console.log(`   Token: ${updated.releaseToken}`);
      console.log(`   过期时间: ${updated.releaseTokenExpiresAt}\n`);
      
      console.log('📋 请复制以下命令到 PowerShell 设置环境变量:\n');
      console.log(`$env:TEST_RELEASE_TOKEN="${updated.releaseToken}"\n`);
      console.log('📋 验证环境变量:\n');
      console.log('echo "Token: $env:TEST_RELEASE_TOKEN"\n');
      console.log('📋 运行 Phase 6 测试:\n');
      console.log('npx tsx scripts/test-phase-4-7.ts\n');
    } else {
      console.error('❌ Release Token 生成失败！');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ 创建测试受益人失败:', error.message);
    console.error('   堆栈:', error.stack);
    process.exit(1);
  }
}

// 运行
createTestBeneficiary()
  .then(() => {
    console.log('✅ 测试受益人准备完成！');
  })
  .catch(console.error);
