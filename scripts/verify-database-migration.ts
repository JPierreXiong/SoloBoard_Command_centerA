/**
 * 验证数据库迁移结果
 * 运行方式: npx tsx scripts/verify-database-migration.ts
 * 
 * 功能：
 * 1. 检查 email_notifications 表是否存在
 * 2. 检查表结构是否正确
 * 3. 检查索引是否创建
 * 4. 检查 verificationToken 的唯一约束
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { emailNotifications, digitalVaults } from '@/config/db/schema';
import { sql } from 'drizzle-orm';

async function verifyMigration() {
  try {
    console.log('🔍 验证数据库迁移结果...\n');

    // 1. 检查 email_notifications 表是否存在
    console.log('1️⃣ 检查 email_notifications 表...');
    try {
      const result = await db()
        .select()
        .from(emailNotifications)
        .limit(1);
      console.log('   ✅ email_notifications 表存在\n');
    } catch (error: any) {
      console.log('   ❌ email_notifications 表不存在或无法访问');
      console.log(`   错误: ${error.message}\n`);
      process.exit(1);
    }

    // 2. 检查表结构
    console.log('2️⃣ 检查表结构...');
    const columnsResult = await db().execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_notifications'
      ORDER BY ordinal_position
    `);

    const expectedColumns = [
      'id',
      'vault_id',
      'recipient_email',
      'recipient_type',
      'email_type',
      'subject',
      'sent_at',
      'opened_at',
      'clicked_at',
      'status',
      'error_message',
      'resend_message_id',
      'created_at',
    ];

    // 处理不同的返回格式
    const rows = Array.isArray(columnsResult) ? columnsResult : (columnsResult.rows || []);
    const actualColumns = rows.map((row: any) => row.column_name);
    const missingColumns = expectedColumns.filter((col) => !actualColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ 所有必需字段都存在');
      console.log(`   字段数量: ${actualColumns.length}\n`);
    } else {
      console.log('   ⚠️  缺少以下字段:');
      missingColumns.forEach((col) => console.log(`      - ${col}`));
      console.log('');
    }

    // 3. 检查索引
    console.log('3️⃣ 检查索引...');
    const indexesResult = await db().execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'email_notifications'
    `);

    const expectedIndexes = [
      'idx_email_vault',
      'idx_email_type',
      'idx_email_status',
      'idx_email_recipient',
    ];

    // 处理不同的返回格式
    const indexRows = Array.isArray(indexesResult) ? indexesResult : (indexesResult.rows || []);
    const actualIndexes = indexRows.map((row: any) => row.indexname);
    const missingIndexes = expectedIndexes.filter((idx) => !actualIndexes.includes(idx));

    if (missingIndexes.length === 0) {
      console.log('   ✅ 所有必需索引都存在');
      console.log(`   索引数量: ${actualIndexes.length}\n`);
    } else {
      console.log('   ⚠️  缺少以下索引:');
      missingIndexes.forEach((idx) => console.log(`      - ${idx}`));
      console.log('');
    }

    // 4. 检查 verificationToken 的唯一约束
    console.log('4️⃣ 检查 verificationToken 的唯一约束...');
    const uniqueConstraintsResult = await db().execute(sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'digital_vaults'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%verification_token%'
    `);

    // 处理不同的返回格式
    const constraintRows = Array.isArray(uniqueConstraintsResult) 
      ? uniqueConstraintsResult 
      : (uniqueConstraintsResult.rows || []);

    if (constraintRows.length > 0) {
      console.log('   ✅ verificationToken 唯一约束已创建');
      constraintRows.forEach((row: any) => {
        console.log(`      约束名: ${row.constraint_name}`);
      });
      console.log('');
    } else {
      console.log('   ⚠️  verificationToken 唯一约束未找到');
      console.log('   注意: 如果表中有重复的 verificationToken，迁移可能会失败\n');
    }

    // 5. 检查外键约束
    console.log('5️⃣ 检查外键约束...');
    const foreignKeysResult = await db().execute(sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'email_notifications'
    `);

    // 处理不同的返回格式
    const fkRows = Array.isArray(foreignKeysResult) 
      ? foreignKeysResult 
      : (foreignKeysResult.rows || []);

    if (fkRows.length > 0) {
      console.log('   ✅ 外键约束已创建');
      fkRows.forEach((row: any) => {
        console.log(`      ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
      console.log('');
    } else {
      console.log('   ⚠️  外键约束未找到\n');
    }

    console.log('✅ 数据库迁移验证完成！\n');
    console.log('📋 验证总结:');
    console.log(`   - email_notifications 表: ${actualColumns.length > 0 ? '✅' : '❌'}`);
    console.log(`   - 表结构: ${missingColumns.length === 0 ? '✅' : '⚠️'}`);
    console.log(`   - 索引: ${missingIndexes.length === 0 ? '✅' : '⚠️'}`);
    console.log(`   - verificationToken 唯一约束: ${constraintRows.length > 0 ? '✅' : '⚠️'}`);
    console.log(`   - 外键约束: ${fkRows.length > 0 ? '✅' : '⚠️'}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

verifyMigration();
