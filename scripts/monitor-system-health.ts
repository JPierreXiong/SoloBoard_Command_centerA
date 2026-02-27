/**
 * 系统健康监控脚本
 * 
 * 功能：
 * 1. 监控数据库资源使用情况
 * 2. 监控业务指标异常
 * 3. 发送报警通知（邮件、Slack、Telegram）
 * 4. 记录报警历史
 * 
 * 运行方式：
 * - 作为 Cron Job 每小时运行一次
 * - 或手动运行: npx tsx scripts/monitor-system-health.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.development') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { db } from '@/core/db';
import { digitalVaults, emailNotifications, systemAlerts } from '@/config/db/schema';
import { sql, eq, gte } from 'drizzle-orm';
import { getEmailService } from '@/shared/services/email';
import { getUuid } from '@/shared/lib/hash';

// 报警阈值配置
const ALERT_THRESHOLDS = {
  // 业务报警
  business: {
    triggeredSpike: 50, // 单日 TRIGGERED 状态用户异常激增阈值
    emailDailyLimit: 1000, // Resend 邮件发送量每日上限
    emailFailureRate: 0.05, // 邮件失败率阈值（5%）
  },
};

// 通知配置
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'admin@example.com';

interface Alert {
  level: 'info' | 'warning' | 'critical';
  type: 'business' | 'resource';
  category: string;
  message: string;
  data: any;
  timestamp: Date;
}

async function monitorSystemHealth() {
  console.log('🔍 开始系统健康监控检查...\n');

  const alerts: Alert[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // 1. 检查业务指标异常
    console.log('📊 检查业务指标...');

    // 检查单日 TRIGGERED 状态用户异常激增
    const triggeredTodayResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(digitalVaults)
      .where(
        and(
          eq(digitalVaults.status, 'triggered'),
          gte(digitalVaults.deadManSwitchActivatedAt, today)
        )
      );
    
    const triggeredToday = Number(triggeredTodayResult[0]?.count || 0);
    console.log(`   今日触发数量: ${triggeredToday}`);

    if (triggeredToday > ALERT_THRESHOLDS.business.triggeredSpike) {
      alerts.push({
        level: 'critical',
        type: 'business',
        category: 'triggered_spike',
        message: `单日 TRIGGERED 状态用户异常激增：${triggeredToday} > ${ALERT_THRESHOLDS.business.triggeredSpike}`,
        data: {
          triggeredToday,
          threshold: ALERT_THRESHOLDS.business.triggeredSpike,
        },
        timestamp: now,
      });
    }

    // 检查邮件发送量和失败率
    const emailStatsResult = await db()
      .select({
        sentToday: sql<number>`count(*) filter (where ${emailNotifications.status} = 'sent' and ${emailNotifications.sentAt} >= ${today})`,
        failedToday: sql<number>`count(*) filter (where ${emailNotifications.status} = 'failed' and ${emailNotifications.sentAt} >= ${today})`,
        totalToday: sql<number>`count(*) filter (where ${emailNotifications.sentAt} >= ${today})`,
      })
      .from(emailNotifications);

    const emailStats = emailStatsResult[0] || {
      sentToday: 0,
      failedToday: 0,
      totalToday: 0,
    };

    const sentToday = Number(emailStats.sentToday || 0);
    const failedToday = Number(emailStats.failedToday || 0);
    const totalToday = Number(emailStats.totalToday || 0);
    const failureRate = totalToday > 0 ? failedToday / totalToday : 0;

    console.log(`   今日邮件发送: ${sentToday}`);
    console.log(`   今日邮件失败: ${failedToday}`);
    console.log(`   失败率: ${(failureRate * 100).toFixed(2)}%\n`);

    if (sentToday > ALERT_THRESHOLDS.business.emailDailyLimit) {
      alerts.push({
        level: 'critical',
        type: 'business',
        category: 'email_limit',
        message: `Resend 邮件发送量超过每日上限：${sentToday} > ${ALERT_THRESHOLDS.business.emailDailyLimit}`,
        data: {
          sentToday,
          threshold: ALERT_THRESHOLDS.business.emailDailyLimit,
        },
        timestamp: now,
      });
    }

    if (failureRate > ALERT_THRESHOLDS.business.emailFailureRate) {
      alerts.push({
        level: 'warning',
        type: 'business',
        category: 'email_failure_rate',
        message: `邮件失败率超过阈值：${(failureRate * 100).toFixed(2)}% > ${(ALERT_THRESHOLDS.business.emailFailureRate * 100)}%`,
        data: {
          failureRate,
          failedToday,
          totalToday,
          threshold: ALERT_THRESHOLDS.business.emailFailureRate,
        },
        timestamp: now,
      });
    }

    // 2. 输出结果
    console.log('📊 监控结果：\n');
    
    if (alerts.length === 0) {
      console.log('✅ 所有指标正常，无需报警\n');
    } else {
      console.log(`⚠️  发现 ${alerts.length} 个报警：\n`);
      
      alerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.level.toUpperCase()}] ${alert.category}: ${alert.message}`);
      });
      
      console.log('\n');

      // 3. 记录报警到数据库
      if (alerts.length > 0) {
        console.log('💾 记录报警到数据库...');
        for (const alert of alerts) {
          try {
            await db().insert(systemAlerts).values({
              id: getUuid(),
              level: alert.level,
              type: alert.type,
              category: alert.category,
              message: alert.message,
              alertData: alert.data,
              createdAt: alert.timestamp,
            });
          } catch (error: any) {
            console.error(`❌ 记录报警失败 (${alert.category}):`, error.message);
          }
        }
        console.log(`✅ 已记录 ${alerts.length} 个报警到数据库`);
      }

      // 4. 发送报警通知
      const criticalAlerts = alerts.filter(a => a.level === 'critical');
      const warningAlerts = alerts.filter(a => a.level === 'warning');

      if (criticalAlerts.length > 0) {
        console.log('📧 发送严重报警通知...');
        await sendAlertNotifications(criticalAlerts, 'critical');
      }

      if (warningAlerts.length > 0) {
        console.log('📧 发送警告通知...');
        await sendAlertNotifications(warningAlerts, 'warning');
      }
    }

    console.log('✅ 系统健康监控检查完成\n');

  } catch (error: any) {
    console.error('❌ 系统健康监控检查失败:', error.message);
    console.error('   堆栈:', error.stack);
    
    // 发送错误报警
    await sendAlertNotifications([{
      level: 'critical',
      type: 'resource',
      category: 'monitor_error',
      message: `系统健康监控脚本执行失败: ${error.message}`,
      data: { error: error.message, stack: error.stack },
      timestamp: new Date(),
    }], 'critical');
    
    process.exit(1);
  }
}

async function sendAlertNotifications(alerts: Alert[], severity: 'critical' | 'warning') {
  const alertMessages = alerts.map(alert => 
    `[${alert.level.toUpperCase()}] ${alert.category}\n${alert.message}\n数据: ${JSON.stringify(alert.data, null, 2)}`
  ).join('\n\n');

  const fullMessage = `[Digital Heirloom] 系统健康监控报警 - ${alerts.length} 个${severity === 'critical' ? '严重' : '警告'}问题\n\n${alertMessages}`;

  // 1. 发送邮件
  try {
    const emailService = await getEmailService();
    const subject = `[Digital Heirloom] ${severity === 'critical' ? '严重' : '警告'}报警 - ${alerts.length} 个问题`;
    const html = `
      <h2>系统健康监控报警</h2>
      <p>检测到以下${severity === 'critical' ? '严重' : '警告'}问题：</p>
      <ul>
        ${alerts.map(alert => `
          <li>
            <strong>[${alert.level.toUpperCase()}] ${alert.category}</strong><br>
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
  if (SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullMessage,
          attachments: [{
            color: severity === 'critical' ? '#ff0000' : '#ffa500',
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
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🚨 *${severity.toUpperCase()} ALERT*\n\n${fullMessage}`,
          parse_mode: 'Markdown',
        }),
      });
      console.log('✅ 报警已发送到 Telegram');
    } catch (error: any) {
      console.error('❌ 发送 Telegram 报警失败:', error.message);
    }
  }
}

// 运行监控
monitorSystemHealth().catch(console.error);
