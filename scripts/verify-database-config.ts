/**
 * 验证数据库配置脚本
 * 检查 DATABASE_URL 是否正确配置，并测试数据库连接
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';

async function verifyDatabaseConfig() {
  console.log('🔍 验证数据库配置...\n');

  // 1. 检查环境变量
  const databaseUrl = process.env.DATABASE_URL;
  const databaseProvider = process.env.DATABASE_PROVIDER || 'postgresql';

  console.log('📋 环境变量检查:');
  console.log(`   DATABASE_URL: ${databaseUrl ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`   DATABASE_PROVIDER: ${databaseProvider}\n`);

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未设置！');
    console.log('\n💡 请确保 .env.local 文件中包含:');
    console.log('   DATABASE_URL=postgres://postgres.user:password@host:port/database');
    console.log('\n💡 对于 Supabase，可以使用以下任一格式:');
    console.log('   - 连接池版本（推荐用于生产）:');
    console.log('     DATABASE_URL=postgres://postgres.user:password@pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true');
    console.log('   - 直接连接版本（推荐用于测试/迁移）:');
    console.log('     DATABASE_URL=postgres://postgres.user:password@pooler.supabase.com:5432/postgres?sslmode=require');
    process.exit(1);
  }

  // 2. 解析数据库 URL
  try {
    const url = new URL(databaseUrl);
    console.log('📋 数据库连接信息:');
    console.log(`   协议: ${url.protocol.replace(':', '')}`);
    console.log(`   主机: ${url.hostname}`);
    console.log(`   端口: ${url.port || '默认'}`);
    console.log(`   数据库: ${url.pathname.replace('/', '')}`);
    console.log(`   SSL 模式: ${url.searchParams.get('sslmode') || '未指定'}\n`);
  } catch (error) {
    console.warn('⚠️  无法解析 DATABASE_URL，但将继续测试连接...\n');
  }

  // 3. 验证 envConfigs 是否读取到环境变量
  const { envConfigs } = await import('@/config');
  console.log('📋 envConfigs 检查:');
  console.log(`   database_url: ${envConfigs.database_url ? '✅ 已设置' : '❌ 未设置'}`);
  if (!envConfigs.database_url) {
    console.error('\n❌ envConfigs.database_url 为空！');
    console.log('💡 这可能是模块加载顺序问题。');
    console.log('💡 请确保 .env.local 文件存在且包含 DATABASE_URL\n');
    process.exit(1);
  }

  // 4. 测试数据库连接
  console.log('\n🔌 测试数据库连接...');
  try {
    const database = db();
    
    // 尝试执行一个简单查询
    const result = await database.execute('SELECT 1 as test');
    
    console.log('   ✅ 数据库连接成功！');
    console.log(`   📊 测试查询结果: ${JSON.stringify(result)}\n`);
    
    // 5. 测试查询 digital_vaults 表（如果存在）
    try {
      const { digitalVaults } = await import('@/config/db/schema');
      const vaults = await database.select().from(digitalVaults).limit(1);
      console.log('   ✅ 可以访问 digital_vaults 表');
      console.log(`   📊 表中有 ${vaults.length > 0 ? '数据' : '无数据'}\n`);
    } catch (error: any) {
      console.log('   ⚠️  无法访问 digital_vaults 表（可能表不存在）');
      console.log(`   📝 错误: ${error.message}\n`);
    }

    console.log('✅ 数据库配置验证完成！');
    console.log('\n📋 下一步:');
    console.log('   1. 运行获取测试数据: npx tsx scripts/get-test-data.ts');
    console.log('   2. 运行测试脚本: npx tsx scripts/test-phase-4-7.ts\n');

  } catch (error: any) {
    console.error('   ❌ 数据库连接失败！');
    console.error(`   📝 错误: ${error.message}`);
    console.error(`   📝 堆栈: ${error.stack}\n`);
    
    console.log('💡 故障排除建议:');
    console.log('   1. 检查 DATABASE_URL 是否正确');
    console.log('   2. 检查网络连接');
    console.log('   3. 检查数据库是否允许来自当前 IP 的连接');
    console.log('   4. 对于 Supabase，确保使用正确的连接字符串格式\n');
    
    process.exit(1);
  }
}

// 运行验证
verifyDatabaseConfig().catch((error) => {
  console.error('❌ 验证过程中发生错误:', error);
  process.exit(1);
});
