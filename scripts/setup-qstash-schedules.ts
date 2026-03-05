/**
 * QStash 调度设置脚本
 * 
 * 运行: npx tsx scripts/setup-qstash-schedules.ts
 */

import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app';

async function setupSchedules() {
  console.log('🔧 Setting up QStash schedules...');
  console.log(`📍 App URL: ${APP_URL}\n`);

  try {
    // 1. 创建站点同步调度（每 6 小时）
    console.log('Creating sync-sites schedule...');
    const syncSchedule = await qstash.schedules.create({
      destination: `${APP_URL}/api/cron/sync-sites`,
      cron: '0 */6 * * *', // 每 6 小时
      retries: 3,
    });

    console.log('✅ Sync schedule created:', syncSchedule.scheduleId);

    // 2. 创建每日指标存储调度（每天凌晨）
    console.log('Creating store-metrics schedule...');
    const metricsSchedule = await qstash.schedules.create({
      destination: `${APP_URL}/api/cron/store-metrics`,
      cron: '0 0 * * *', // 每天 00:00
      retries: 3,
    });

    console.log('✅ Metrics schedule created:', metricsSchedule.scheduleId);

    console.log('\n🎉 All schedules created successfully!');
    console.log('\n📋 Schedule IDs (save these for future reference):');
    console.log(`- Sync Sites: ${syncSchedule.scheduleId}`);
    console.log(`- Store Metrics: ${metricsSchedule.scheduleId}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Save the schedule IDs above');
    console.log('2. Verify schedules in QStash Dashboard: https://console.upstash.com/qstash');
    console.log('3. Monitor first execution in logs');
  } catch (error: any) {
    console.error('❌ Failed to create schedules:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('token')) {
      console.error('\n💡 Tip: Make sure QSTASH_TOKEN is set in your environment');
    }
    
    throw error;
  }
}

// 检查环境变量
if (!process.env.QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN is not set');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('⚠️  NEXT_PUBLIC_APP_URL is not set, using default');
  console.warn('Please set it to your production URL');
}

setupSchedules();





