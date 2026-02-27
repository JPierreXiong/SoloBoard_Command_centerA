/**
 * 成本监控和报警脚本
 * 
 * 功能：
 * 1. 监控邮件发送量（Resend）
 * 2. 监控存储使用量
 * 3. 监控 ShipAny 物流订单
 * 4. 超过阈值时发送报警
 * 
 * 运行方式：
 * - 作为 Cron Job 每小时运行一次
 * - 或手动运行: npx tsx scripts/monitor-cost-alerts.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { emailNotifications, digitalVaults, shippingLogs, systemAlerts } from '@/config/db/schema';
import { sql, gte } from 'drizzle-orm';
import { getEmailService } from '@/shared/services/email';
import { getUuid } from '@/shared/lib/hash';

// 报警阈值配置
const ALERT_THRESHOLDS = {
  email: {
    daily: 500, // 每日 500 封
    weekly: 3000, // 每周 3000 封
    monthly: 10000, // 每月 10000 封
    warning: 0.8, // 警告阈值（80%）
    critical: 0.9, // 严重阈值（90%）
  },
  storage: {
    percentage: 90, // 存储使用率 90%
  },
  shipping: {
    daily: 10, // 每日 10 单
  },
};

// 管理员通知邮箱（从环境变量获取）
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'admin@example.com';

interface Alert {
  level: 'info' | 'warning' | 'critical';
  type: 'email' | 'storage' | 'shipping';
  message: string;
  data: any;
}

async function monitorCosts() {
  console.log('🔍 开始成本监控检查...\n');

  const alerts: Alert[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

  try {
    // 1. 检查邮件发送量
    console.log('📧 检查邮件发送量...');
    
    const emailStats = await db()
      .select({
        sentToday: sql<number>`count(*) filter (where ${emailNotifications.status} = 'sent' and ${emailNotifications.sentAt} >= ${today})`,
        sentThisWeek: sql<number>`count(*) filter (where ${emailNotifications.status} = 'sent' and ${emailNotifications.sentAt} >= ${weekAgo})`,
        sentThisMonth: sql<number>`count(*) filter (where ${emailNotifications.status} = 'sent' and ${emailNotifications.sentAt} >= ${monthAgo})`,
        failedToday: sql<number>`count(*) filter (where ${emailNotifications.status} = 'failed' and ${emailNotifications.sentAt} >= ${today})`,
      })
      .from(emailNotifications);

    const stats = emailStats[0] || {
      sentToday: 0,
      sentThisWeek: 0,
      sentThisMonth: 0,
      failedToday: 0,
    };

    console.log(`   今日发送: ${stats.sentToday}`);
    console.log(`   本周发送: ${stats.sentThisWeek}`);
    console.log(`   本月发送: ${stats.sentThisMonth}`);
    console.log(`   今日失败: ${stats.failedToday}\n`);

    // 检查阈值
    if (stats.sentToday > ALERT_THRESHOLDS.email.daily) {
      alerts.push({
        level: 'critical',
        type: 'email',
        message: `今日邮件发送量超过阈值：${stats.sentToday} > ${ALERT_THRESHOLDS.email.daily}`,
        data: stats,
      });
    } else if (stats.sentToday > ALERT_THRESHOLDS.email.daily * ALERT_THRESHOLDS.email.warning) {
      alerts.push({
        level: 'warning',
        type: 'email',
        message: `今日邮件发送量接近阈值：${stats.sentToday} / ${ALERT_THRESHOLDS.email.daily}`,
        data: stats,
      });
    }

    if (stats.sentThisMonth > ALERT_THRESHOLDS.email.monthly * ALERT_THRESHOLDS.email.critical) {
      alerts.push({
        level: 'critical',
        type: 'email',
        message: `本月邮件发送量超过严重阈值：${stats.sentThisMonth} > ${ALERT_THRESHOLDS.email.monthly * ALERT_THRESHOLDS.email.critical}`,
        data: stats,
      });
    }

    // 2. 检查存储使用量
    console.log('💾 检查存储使用量...');
    
    const storageStats = await db()
      .select({
        totalSize: sql<number>`sum(length(${digitalVaults.encryptedData}))`,
        vaultCount: sql<number>`count(*)`,
      })
      .from(digitalVaults);

    const storage = storageStats[0] || { totalSize: 0, vaultCount: 0 };
    const totalSizeMB = Number(storage.totalSize || 0) / (1024 * 1024);
    
    console.log(`   总存储: ${totalSizeMB.toFixed(2)} MB`);
    console.log(`   金库数量: ${storage.vaultCount}\n`);

    // 注意：这里需要根据实际存储限制来计算百分比
    // 假设总限制为 10GB
    const STORAGE_LIMIT_MB = 10 * 1024; // 10GB
    const storagePercentage = (totalSizeMB / STORAGE_LIMIT_MB) * 100;

    if (storagePercentage > ALERT_THRESHOLDS.storage.percentage) {
      alerts.push({
        level: 'critical',
        type: 'storage',
        message: `存储使用率超过阈值：${storagePercentage.toFixed(2)}% > ${ALERT_THRESHOLDS.storage.percentage}%`,
        data: {
          totalSizeMB,
          storagePercentage,
          vaultCount: storage.vaultCount,
        },
      });
    }

    // 3. 检查 ShipAny 物流订单
    console.log('📦 检查物流订单...');
    
    const shippingStats = await db()
      .select({
        ordersToday: sql<number>`count(*) filter (where ${shippingLogs.createdAt} >= ${today})`,
        ordersThisWeek: sql<number>`count(*) filter (where ${shippingLogs.createdAt} >= ${weekAgo})`,
      })
      .from(shippingLogs);

    const shipping = shippingStats[0] || { ordersToday: 0, ordersThisWeek: 0 };
    
    console.log(`   今日订单: ${shipping.ordersToday}`);
    console.log(`   本周订单: ${shipping.ordersThisWeek}\n`);

    if (shipping.ordersToday > ALERT_THRESHOLDS.shipping.daily) {
      alerts.push({
        level: 'warning',
        type: 'shipping',
        message: `今日物流订单超过阈值：${shipping.ordersToday} > ${ALERT_THRESHOLDS.shipping.daily}`,
        data: shipping,
      });
    }

    // 4. 输出结果
    console.log('📊 监控结果：\n');
    
    if (alerts.length === 0) {
      console.log('✅ 所有指标正常，无需报警\n');
    } else {
      console.log(`⚠️  发现 ${alerts.length} 个报警：\n`);
      
      alerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.level.toUpperCase()}] ${alert.type}: ${alert.message}`);
      });
      
      console.log('\n');

      // 5. 记录报警到数据库
      if (alerts.length > 0) {
        console.log('💾 记录报警到数据库...');
        const now = new Date();
        for (const alert of alerts) {
          try {
            await db().insert(systemAlerts).values({
              id: getUuid(),
              level: alert.level,
              type: 'cost',
              category: alert.type, // email, storage, shipping
              message: alert.message,
              alertData: alert.data,
              createdAt: now,
            });
          } catch (error: any) {
            console.error(`❌ 记录报警失败 (${alert.type}):`, error.message);
          }
        }
        console.log(`✅ 已记录 ${alerts.length} 个报警到数据库`);
      }

      // 6. 发送报警邮件（如果有严重报警）
      const criticalAlerts = alerts.filter(a => a.level === 'critical');
      if (criticalAlerts.length > 0) {
        console.log('📧 发送严重报警邮件...');
        await sendAlertEmail(criticalAlerts);
      }
    }

    console.log('✅ 成本监控检查完成\n');

  } catch (error: any) {
    console.error('❌ 成本监控检查失败:', error.message);
    console.error('   堆栈:', error.stack);
    process.exit(1);
  }
}

async function sendAlertEmail(alerts: Alert[]) {
  const alertMessages = alerts.map(alert => 
    `[${alert.level.toUpperCase()}] ${alert.type}\n${alert.message}\n数据: ${JSON.stringify(alert.data, null, 2)}`
  ).join('\n\n');

  const fullMessage = `[Digital Heirloom] 成本监控报警 - ${alerts.length} 个严重问题\n\n${alertMessages}`;

  // 1. 发送邮件
  try {
    const emailService = await getEmailService();
    
    const subject = `[Digital Heirloom] 成本监控报警 - ${alerts.length} 个严重问题`;
    const html = `
      <h2>成本监控报警</h2>
      <p>检测到以下严重问题：</p>
      <ul>
        ${alerts.map(alert => `
          <li>
            <strong>[${alert.level.toUpperCase()}] ${alert.type}</strong><br>
            ${alert.message}<br>
            <pre>${JSON.stringify(alert.data, null, 2)}</pre>
          </li>
        `).join('')}
      </ul>
      <p>请及时处理。</p>
    `;

    await emailService.sendEmail({
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    console.log(`✅ 报警邮件已发送到 ${ADMIN_EMAIL}`);
  } catch (error: any) {
    console.error('❌ 发送报警邮件失败:', error.message);
  }

  // 2. 发送到 Slack（如果配置）
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  if (SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullMessage,
          attachments: [{
            color: '#ff0000',
            text: '详情请登录 Admin Dashboard 查看',
            footer: 'Digital Heirloom Admin',
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
      console.log('✅ 报警已发送到 Slack');
    } catch (error: any) {
      console.error('❌ 发送 Slack 报警失败:', error.message);
    }
  }

  // 3. 发送到 Telegram（如果配置）
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🚨 *CRITICAL ALERT*\n\n${fullMessage}`,
          parse_mode: 'Markdown',
        }),
      });
      console.log('✅ 报警已发送到 Telegram');
    } catch (error: any) {
      console.error('❌ 发送 Telegram 报警失败:', error.message);
    }
  }

  console.log('\n');
}

// 运行监控
monitorCosts().catch(console.error);
