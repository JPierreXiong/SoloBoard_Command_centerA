/**
 * 测试数据库连接
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '@/core/db';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

  try {
    // 测试基本查询
    const result = await db().execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection successful!');
    console.log('Current time:', result[0]);

    // 检查表是否存在
    const tables = await db().execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('monitored_sites', 'site_metrics_daily', 'site_metrics_history', 'sync_logs')
    `);
    
    console.log('\n📊 SoloBoard tables status:');
    const tableNames = ['monitored_sites', 'site_metrics_daily', 'site_metrics_history', 'sync_logs'];
    const existingTables = tables.map((t: any) => t.table_name);
    
    tableNames.forEach(name => {
      if (existingTables.includes(name)) {
        console.log(`  ✅ ${name}`);
      } else {
        console.log(`  ❌ ${name} (missing)`);
      }
    });

    if (existingTables.length < tableNames.length) {
      console.log('\n⚠️  Some tables are missing. Run: pnpm init:soloboard');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

