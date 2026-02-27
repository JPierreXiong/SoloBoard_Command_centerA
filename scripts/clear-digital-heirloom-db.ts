/**
 * 清空 Digital Heirloom 数据库表
 * 警告：此操作不可逆，请谨慎使用！
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 必须在导入任何模块之前加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

// 设置默认值
if (!process.env.DATABASE_PROVIDER) {
  process.env.DATABASE_PROVIDER = 'postgresql';
}

// 调试：检查环境变量
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
console.log('DATABASE_PROVIDER:', process.env.DATABASE_PROVIDER);

import { db } from '@/core/db';
import { 
  digitalVaults, 
  beneficiaries, 
  heartbeatLogs, 
  deadManSwitchEvents,
  shippingLogs,
  emailNotifications,
  adminAuditLogs,
  systemAlerts
} from '@/config/db/schema';
import { sql } from 'drizzle-orm';

async function clearDigitalHeirloomTables() {
  console.log('🗑️  开始清空 Digital Heirloom 数据库表...\n');

  try {
    const database = db();

    // 按依赖顺序删除（先删除有外键依赖的表）
    const tables = [
      { name: 'system_alerts', table: systemAlerts },
      { name: 'admin_audit_logs', table: adminAuditLogs },
      { name: 'email_notifications', table: emailNotifications },
      { name: 'shipping_logs', table: shippingLogs },
      { name: 'dead_man_switch_events', table: deadManSwitchEvents },
      { name: 'heartbeat_logs', table: heartbeatLogs },
      { name: 'beneficiaries', table: beneficiaries },
      { name: 'digital_vaults', table: digitalVaults },
    ];

    for (const { name, table } of tables) {
      try {
        const result = await database.delete(table);
        console.log(`✅ 已清空表: ${name}`);
      } catch (error: any) {
        console.log(`⚠️  跳过表 ${name}: ${error.message}`);
      }
    }

    console.log('\n✨ Digital Heirloom 数据库表清空完成！');
    
    // 显示统计信息
    console.log('\n📊 当前表记录数：');
    for (const { name, table } of tables) {
      try {
        const count = await database.select({ count: sql`count(*)` }).from(table);
        console.log(`   ${name}: ${count[0]?.count || 0} 条记录`);
      } catch (error) {
        console.log(`   ${name}: 表不存在或无法访问`);
      }
    }

  } catch (error) {
    console.error('❌ 清空数据库时出错:', error);
    throw error;
  }
}

// 执行清空操作
clearDigitalHeirloomTables()
  .then(() => {
    console.log('\n✅ 操作完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  });

