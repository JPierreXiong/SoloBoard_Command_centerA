/**
 * SoloBoard 数据库表初始化脚本（修复版）
 * 核心修复：ID 类型从 UUID 改为 TEXT，兼容 NanoID
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function initSoloBoardTables() {
  console.log('🚀 Initializing SoloBoard tables (with TEXT IDs)...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  console.log('✅ DATABASE_URL found');

  const sql = postgres(databaseUrl);

  try {
    // 1. 删除旧表
    console.log('🗑️  Dropping old tables...');
    await sql`DROP TABLE IF EXISTS sync_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS site_metrics_history CASCADE`;
    await sql`DROP TABLE IF EXISTS site_metrics_daily CASCADE`;
    await sql`DROP TABLE IF EXISTS monitored_sites CASCADE`;
    console.log('✅ Old tables dropped');

    // 2. 创建监控站点表（ID 改为 TEXT）
    await sql`
      CREATE TABLE monitored_sites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        url TEXT NOT NULL,
        logo_url TEXT,
        platform TEXT DEFAULT 'custom',
        api_config JSONB DEFAULT '{}',
        status TEXT DEFAULT 'active',
        last_sync_at TIMESTAMP WITH TIME ZONE,
        last_sync_status TEXT,
        last_sync_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created monitored_sites table (with TEXT id)');

    // 3. 创建每日指标表
    await sql`
      CREATE TABLE site_metrics_daily (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        date DATE NOT NULL,
        revenue DECIMAL(10, 2) DEFAULT 0,
        visitors INTEGER DEFAULT 0,
        orders INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5, 2) DEFAULT 0,
        avg_order_value DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_site FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE,
        UNIQUE(site_id, date)
      )
    `;
    console.log('✅ Created site_metrics_daily table');

    // 4. 创建历史指标表
    await sql`
      CREATE TABLE site_metrics_history (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_site_history FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created site_metrics_history table');

    // 5. 创建同步日志表
    await sql`
      CREATE TABLE sync_logs (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        sync_type TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        duration_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_site_logs FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created sync_logs table');

    // 6. 创建索引
    await sql`CREATE INDEX idx_monitored_sites_user_id ON monitored_sites(user_id)`;
    await sql`CREATE INDEX idx_monitored_sites_status ON monitored_sites(status)`;
    await sql`CREATE INDEX idx_site_metrics_daily_site_date ON site_metrics_daily(site_id, date)`;
    await sql`CREATE INDEX idx_site_metrics_history_site_time ON site_metrics_history(site_id, recorded_at)`;
    await sql`CREATE INDEX idx_sync_logs_site_created ON sync_logs(site_id, created_at)`;
    console.log('✅ Created indexes');

    // 7. 确保 user 表有订阅字段
    try {
      await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free'`;
      await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_id TEXT`;
      await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE`;
      console.log('✅ Added subscription fields to user table');
    } catch (e) {
      console.log('⚠️  User table fields already exist or failed to add (this is OK)');
    }

    console.log('\n🎉 SoloBoard tables initialized successfully with TEXT IDs!');
    console.log('📝 Key changes:');
    console.log('   - ID fields changed from UUID to TEXT (compatible with NanoID)');
    console.log('   - Added domain field to monitored_sites');
    console.log('   - Added subscription fields to user table');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error initializing SoloBoard tables:', error);
    await sql.end();
    throw error;
  }
}

// 运行初始化
initSoloBoardTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
