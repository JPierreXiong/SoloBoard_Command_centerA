/**
 * QStash 管理脚本
 * 
 * 列出所有调度: npx tsx scripts/manage-qstash.ts list
 * 删除调度: npx tsx scripts/manage-qstash.ts delete <scheduleId>
 * 暂停调度: npx tsx scripts/manage-qstash.ts pause <scheduleId>
 * 恢复调度: npx tsx scripts/manage-qstash.ts resume <scheduleId>
 */

import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

async function listSchedules() {
  console.log('📋 Listing all QStash schedules...\n');
  
  try {
    const schedules = await qstash.schedules.list();
    
    if (schedules.length === 0) {
      console.log('No schedules found.');
      return;
    }
    
    schedules.forEach((schedule, index) => {
      console.log(`\n${index + 1}. Schedule`);
      console.log(`   ID: ${schedule.scheduleId}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}`);
      console.log(`   Status: ${schedule.isPaused ? '⏸️  Paused' : '▶️  Active'}`);
      console.log(`   Retries: ${schedule.retries || 0}`);
      console.log(`   Created: ${new Date(schedule.createdAt).toLocaleString()}`);
    });
    
    console.log(`\n📊 Total: ${schedules.length} schedule(s)`);
  } catch (error: any) {
    console.error('❌ Failed to list schedules:', error.message);
  }
}

async function deleteSchedule(scheduleId: string) {
  console.log(`🗑️  Deleting schedule: ${scheduleId}`);
  
  try {
    await qstash.schedules.delete(scheduleId);
    console.log('✅ Schedule deleted successfully');
  } catch (error: any) {
    console.error('❌ Failed to delete schedule:', error.message);
  }
}

async function pauseSchedule(scheduleId: string) {
  console.log(`⏸️  Pausing schedule: ${scheduleId}`);
  
  try {
    await qstash.schedules.pause(scheduleId);
    console.log('✅ Schedule paused successfully');
  } catch (error: any) {
    console.error('❌ Failed to pause schedule:', error.message);
  }
}

async function resumeSchedule(scheduleId: string) {
  console.log(`▶️  Resuming schedule: ${scheduleId}`);
  
  try {
    await qstash.schedules.resume(scheduleId);
    console.log('✅ Schedule resumed successfully');
  } catch (error: any) {
    console.error('❌ Failed to resume schedule:', error.message);
  }
}

async function getSchedule(scheduleId: string) {
  console.log(`🔍 Getting schedule details: ${scheduleId}\n`);
  
  try {
    const schedule = await qstash.schedules.get(scheduleId);
    
    console.log(`ID: ${schedule.scheduleId}`);
    console.log(`Destination: ${schedule.destination}`);
    console.log(`Cron: ${schedule.cron}`);
    console.log(`Status: ${schedule.isPaused ? '⏸️  Paused' : '▶️  Active'}`);
    console.log(`Retries: ${schedule.retries || 0}`);
    console.log(`Created: ${new Date(schedule.createdAt).toLocaleString()}`);
  } catch (error: any) {
    console.error('❌ Failed to get schedule:', error.message);
  }
}

// 检查环境变量
if (!process.env.QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN is not set');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

// 命令行参数处理
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  switch (command) {
    case 'list':
      await listSchedules();
      break;
    case 'get':
      if (!arg) {
        console.error('❌ Please provide schedule ID');
        process.exit(1);
      }
      await getSchedule(arg);
      break;
    case 'delete':
      if (!arg) {
        console.error('❌ Please provide schedule ID');
        process.exit(1);
      }
      await deleteSchedule(arg);
      break;
    case 'pause':
      if (!arg) {
        console.error('❌ Please provide schedule ID');
        process.exit(1);
      }
      await pauseSchedule(arg);
      break;
    case 'resume':
      if (!arg) {
        console.error('❌ Please provide schedule ID');
        process.exit(1);
      }
      await resumeSchedule(arg);
      break;
    default:
      console.log('QStash Schedule Manager\n');
      console.log('Usage:');
      console.log('  npx tsx scripts/manage-qstash.ts list');
      console.log('  npx tsx scripts/manage-qstash.ts get <scheduleId>');
      console.log('  npx tsx scripts/manage-qstash.ts delete <scheduleId>');
      console.log('  npx tsx scripts/manage-qstash.ts pause <scheduleId>');
      console.log('  npx tsx scripts/manage-qstash.ts resume <scheduleId>');
  }
}

main();

