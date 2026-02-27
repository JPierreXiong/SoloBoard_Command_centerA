/**
 * 快速数据库初始化脚本
 * 用于创建必要的表结构
 */

import { db } from '@/core/db';
import { sql } from 'drizzle-orm';

async function initDatabase() {
  console.log('🚀 开始初始化数据库...');

  try {
    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    await db().execute(sql`SELECT 1`);
    console.log('✅ 数据库连接成功！');

    // 检查表是否存在
    console.log('🔍 检查现有表...');
    const tables = await db().execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 现有表:', tables.rows.map((r: any) => r.table_name));

    // 检查是否需要创建 config 表
    const hasConfigTable = tables.rows.some((r: any) => r.table_name === 'config');
    
    if (!hasConfigTable) {
      console.log('📝 创建 config 表...');
      await db().execute(sql`
        CREATE TABLE IF NOT EXISTS "config" (
          "name" VARCHAR(255) PRIMARY KEY,
          "value" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ config 表创建成功！');
    } else {
      console.log('✅ config 表已存在');
    }

    // 检查其他关键表
    const requiredTables = ['user', 'order', 'subscription', 'session'];
    const missingTables = requiredTables.filter(
      table => !tables.rows.some((r: any) => r.table_name === table)
    );

    if (missingTables.length > 0) {
      console.log('⚠️ 缺少以下表:', missingTables.join(', '));
      console.log('💡 请运行: pnpm db:push');
    } else {
      console.log('✅ 所有必要的表都已存在！');
    }

    console.log('\n🎉 数据库初始化完成！');

  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行初始化
initDatabase();

