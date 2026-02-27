/**
 * 数据库连接测试脚本
 * 用途：验证数据库连接是否正常
 * 运行：node test-db-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

console.log('🔍 开始测试数据库连接...\n');

// 检查环境变量
const DATABASE_URL = process.env.DATABASE_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

console.log('📋 环境变量检查:');
console.log(`   DATABASE_URL: ${DATABASE_URL ? '✓ 已设置' : '✗ 未设置'}`);
console.log(`   AUTH_SECRET: ${AUTH_SECRET ? '✓ 已设置' : '✗ 未设置'}`);
console.log(`   ENCRYPTION_KEY: ${ENCRYPTION_KEY ? '✓ 已设置' : '✗ 未设置'}`);
console.log('');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 未设置！');
  console.log('\n💡 解决方案:');
  console.log('1. 创建 .env.local 文件');
  console.log('2. 添加: DATABASE_URL="postgresql://..."');
  console.log('3. 或从 Vercel 同步: vercel env pull .env.local');
  process.exit(1);
}

// 测试数据库连接
async function testConnection() {
  let sql;
  
  try {
    console.log('🔌 正在连接数据库...');
    console.log(`   URL: ${DATABASE_URL.split('@')[1] || 'hidden'}`);
    
    sql = postgres(DATABASE_URL, {
      prepare: false,
      max: 1,
      connect_timeout: 10,
    });

    // 测试 1: 简单查询
    console.log('\n📡 测试 1: 执行简单查询...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('   ✓ 查询成功');
    console.log(`   当前时间: ${result[0].current_time}`);
    console.log(`   PostgreSQL 版本: ${result[0].pg_version.split(' ')[0]}`);

    // 测试 2: 检查表是否存在
    console.log('\n📡 测试 2: 检查数据库表...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`   ✓ 找到 ${tables.length} 个表:`);
    
    const requiredTables = [
      'user',
      'session',
      'account',
      'monitored_sites',
      'site_metrics_daily'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    
    requiredTables.forEach(tableName => {
      const exists = existingTables.includes(tableName);
      console.log(`     ${exists ? '✓' : '✗'} ${tableName}`);
    });

    // 测试 3: 检查用户表
    console.log('\n📡 测试 3: 检查用户表...');
    const userCount = await sql`SELECT COUNT(*) as count FROM "user"`;
    console.log(`   ✓ 用户表存在`);
    console.log(`   用户数量: ${userCount[0].count}`);

    // 测试 4: 检查 monitored_sites 表
    console.log('\n📡 测试 4: 检查 monitored_sites 表...');
    try {
      const siteCount = await sql`SELECT COUNT(*) as count FROM monitored_sites`;
      console.log(`   ✓ monitored_sites 表存在`);
      console.log(`   站点数量: ${siteCount[0].count}`);
    } catch (error) {
      console.log(`   ✗ monitored_sites 表不存在或有错误`);
      console.log(`   错误: ${error.message}`);
    }

    // 测试 5: 检查 site_metrics_daily 表
    console.log('\n📡 测试 5: 检查 site_metrics_daily 表...');
    try {
      const metricsCount = await sql`SELECT COUNT(*) as count FROM site_metrics_daily`;
      console.log(`   ✓ site_metrics_daily 表存在`);
      console.log(`   记录数量: ${metricsCount[0].count}`);
    } catch (error) {
      console.log(`   ✗ site_metrics_daily 表不存在或有错误`);
      console.log(`   错误: ${error.message}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ 数据库连接测试通过！');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ 数据库连接失败！');
    console.error(`   错误类型: ${error.code || 'UNKNOWN'}`);
    console.error(`   错误信息: ${error.message}`);
    
    console.log('\n💡 常见问题排查:');
    console.log('1. 检查 DATABASE_URL 格式是否正确');
    console.log('   格式: postgresql://user:password@host:port/database?sslmode=require');
    console.log('2. 检查数据库服务器是否在线');
    console.log('3. 检查防火墙是否允许连接');
    console.log('4. 检查用户名和密码是否正确');
    console.log('5. 如果使用 Neon，确保已启用 SSL (sslmode=require)');
    
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testConnection().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});







