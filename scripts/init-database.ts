/**
 * 数据库初始化脚本
 * 自动创建所有必需的表结构
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/config/db/schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_au5XJdonk1Es@ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    await client`SELECT 1`;
    console.log('✅ 数据库连接成功\n');

    // 创建基础配置
    console.log('📝 初始化基础配置...');
    
    // 插入默认配置（如果不存在）
    const defaultConfigs = [
      { name: 'email_auth_enabled', value: 'true' },
      { name: 'google_one_tap_enabled', value: 'false' },
      { name: 'app_name', value: 'SoloBoard Command Center' },
      { name: 'app_description', value: 'Website monitoring and alerting platform' },
    ];

    for (const config of defaultConfigs) {
      try {
        await db.insert(schema.config)
          .values(config)
          .onConflictDoNothing();
      } catch (e) {
        // 忽略冲突错误
      }
    }

    console.log('✅ 基础配置初始化完成\n');

    console.log('🎉 数据库初始化完成！\n');
    console.log('💡 下一步:');
    console.log('   1. 运行 pnpm dev 启动开发服务器');
    console.log('   2. 访问 http://localhost:3003/zh/sign-up 注册账户');
    console.log('   3. 访问 http://localhost:3003/zh/sign-in 登录');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ 初始化失败:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n💡 提示: 数据库表不存在，需要先运行迁移:');
      console.log('   pnpm db:push');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行初始化
initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
