/**
 * SoloBoard - 异常报警服务
 * 
 * 功能：
 * 1. 检测站点异常（宕机、响应慢、收入下降、流量激增）
 * 2. 触发报警规则
 * 3. 发送多渠道通知（邮件、Telegram、Webhook）
 * 4. 管理报警冷却期
 */

import { db } from '@/config/db';
import { alertRules, alertHistory, monitoredSites, siteMetricsHistory } from '@/config/db/schema';
import { eq, and, desc, lt, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * 报警类型
 */
export type AlertType = 'downtime' | 'slow_response' | 'revenue_drop' | 'traffic_spike';

/**
 * 报警严重程度
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * 通知渠道
 */
export type NotificationChannel = 'email' | 'telegram' | 'webhook';

/**
 * 报警规则配置
 */
export interface AlertRuleConfig {
  alertType: AlertType;
  threshold: {
    responseTime?: number; // 响应时间阈值（毫秒）
    downtime?: number; // 宕机时长阈值（秒）
    revenueDropPercent?: number; // 收入下降百分比
    trafficSpikePercent?: number; // 流量激增百分比
  };
  channels: NotificationChannel[];
  cooldown?: number; // 冷却期（秒），默认 300
  enabled?: boolean;
}

/**
 * 检查所有站点的异常情况
 */
export async function checkAllSitesForAlerts() {
  try {
    // 获取所有启用的报警规则
    const rules = await db()
      .select()
      .from(alertRules)
      .where(eq(alertRules.enabled, true));

    console.log(`[Alert Service] Checking ${rules.length} alert rules`);

    for (const rule of rules) {
      await checkSiteAlert(rule);
    }

    console.log('[Alert Service] Alert check completed');
  } catch (error) {
    console.error('[Alert Service] Error checking alerts:', error);
    throw error;
  }
}

/**
 * 检查单个站点的报警规则
 */
async function checkSiteAlert(rule: any) {
  try {
    // 检查冷却期
    if (rule.lastTriggeredAt) {
      const cooldownMs = (rule.cooldown || 300) * 1000;
      const timeSinceLastTrigger = Date.now() - new Date(rule.lastTriggeredAt).getTime();
      
      if (timeSinceLastTrigger < cooldownMs) {
        console.log(`[Alert Service] Rule ${rule.id} in cooldown period`);
        return;
      }
    }

    // 获取站点信息
    const site = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, rule.siteId))
      .limit(1);

    if (!site.length || site[0].status !== 'active') {
      return;
    }

    const siteData = site[0];

    // 根据报警类型检查异常
    let shouldAlert = false;
    let alertMessage = '';
    let severity: AlertSeverity = 'info';
    let triggerData: Record<string, any> = {};

    switch (rule.alertType) {
      case 'downtime':
        const downtimeResult = await checkDowntime(siteData, rule.threshold);
        shouldAlert = downtimeResult.shouldAlert;
        alertMessage = downtimeResult.message;
        severity = downtimeResult.severity;
        triggerData = downtimeResult.data;
        break;

      case 'slow_response':
        const responseResult = await checkSlowResponse(siteData, rule.threshold);
        shouldAlert = responseResult.shouldAlert;
        alertMessage = responseResult.message;
        severity = responseResult.severity;
        triggerData = responseResult.data;
        break;

      case 'revenue_drop':
        const revenueResult = await checkRevenueDrop(siteData, rule.threshold);
        shouldAlert = revenueResult.shouldAlert;
        alertMessage = revenueResult.message;
        severity = revenueResult.severity;
        triggerData = revenueResult.data;
        break;

      case 'traffic_spike':
        const trafficResult = await checkTrafficSpike(siteData, rule.threshold);
        shouldAlert = trafficResult.shouldAlert;
        alertMessage = trafficResult.message;
        severity = trafficResult.severity;
        triggerData = trafficResult.data;
        break;
    }

    // 触发报警
    if (shouldAlert) {
      await triggerAlert(rule, siteData, alertMessage, severity, triggerData);
    }
  } catch (error) {
    console.error(`[Alert Service] Error checking rule ${rule.id}:`, error);
  }
}

/**
 * 检查宕机异常
 */
async function checkDowntime(site: any, threshold: any) {
  const result = {
    shouldAlert: false,
    message: '',
    severity: 'info' as AlertSeverity,
    data: {},
  };

  if (site.healthStatus === 'offline') {
    const downtimeSeconds = site.lastErrorAt 
      ? Math.floor((Date.now() - new Date(site.lastErrorAt).getTime()) / 1000)
      : 0;

    if (downtimeSeconds >= (threshold.downtime || 60)) {
      result.shouldAlert = true;
      result.message = `站点 ${site.name} 已宕机 ${Math.floor(downtimeSeconds / 60)} 分钟`;
      result.severity = downtimeSeconds > 600 ? 'critical' : 'warning';
      result.data = { downtimeSeconds, lastErrorMessage: site.lastErrorMessage };
    }
  }

  return result;
}

/**
 * 检查响应时间异常
 */
async function checkSlowResponse(site: any, threshold: any) {
  const result = {
    shouldAlert: false,
    message: '',
    severity: 'info' as AlertSeverity,
    data: {},
  };

  // 获取最近的响应时间数据
  const recentMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(eq(siteMetricsHistory.siteId, site.id))
    .orderBy(desc(siteMetricsHistory.recordedAt))
    .limit(5);

  if (recentMetrics.length > 0) {
    const avgResponseTime = recentMetrics.reduce((sum: number, m: any) => {
      return sum + ((m.metrics as any).responseTime || 0);
    }, 0) / recentMetrics.length;

    const thresholdMs = threshold.responseTime || 3000;

    if (avgResponseTime > thresholdMs) {
      result.shouldAlert = true;
      result.message = `站点 ${site.name} 响应时间过慢：${Math.round(avgResponseTime)}ms（阈值：${thresholdMs}ms）`;
      result.severity = avgResponseTime > thresholdMs * 2 ? 'critical' : 'warning';
      result.data = { avgResponseTime, threshold: thresholdMs };
    }
  }

  return result;
}

/**
 * 检查收入下降异常
 */
async function checkRevenueDrop(site: any, threshold: any) {
  const result = {
    shouldAlert: false,
    message: '',
    severity: 'info' as AlertSeverity,
    data: {},
  };

  // 获取今日和昨日的收入数据
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  const todayMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, site.id),
        gte(siteMetricsHistory.recordedAt, todayStart)
      )
    );

  const yesterdayMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, site.id),
        gte(siteMetricsHistory.recordedAt, yesterdayStart),
        lt(siteMetricsHistory.recordedAt, todayStart)
      )
    );

  if (yesterdayMetrics.length > 0) {
    const todayRevenue = todayMetrics.reduce((sum: number, m: any) => sum + ((m.metrics as any).revenue || 0), 0);
    const yesterdayRevenue = yesterdayMetrics.reduce((sum: number, m: any) => sum + ((m.metrics as any).revenue || 0), 0);

    if (yesterdayRevenue > 0) {
      const dropPercent = ((yesterdayRevenue - todayRevenue) / yesterdayRevenue) * 100;
      const thresholdPercent = threshold.revenueDropPercent || 30;

      if (dropPercent > thresholdPercent) {
        result.shouldAlert = true;
        result.message = `站点 ${site.name} 收入下降 ${dropPercent.toFixed(1)}%（今日：$${(todayRevenue / 100).toFixed(2)}，昨日：$${(yesterdayRevenue / 100).toFixed(2)}）`;
        result.severity = dropPercent > 50 ? 'critical' : 'warning';
        result.data = { todayRevenue, yesterdayRevenue, dropPercent };
      }
    }
  }

  return result;
}

/**
 * 检查流量激增异常
 */
async function checkTrafficSpike(site: any, threshold: any) {
  const result = {
    shouldAlert: false,
    message: '',
    severity: 'info' as AlertSeverity,
    data: {},
  };

  // 获取最近 2 小时和前 2 小时的流量数据
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  const recentMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, site.id),
        gte(siteMetricsHistory.recordedAt, twoHoursAgo)
      )
    );

  const previousMetrics = await db()
    .select()
    .from(siteMetricsHistory)
    .where(
      and(
        eq(siteMetricsHistory.siteId, site.id),
        gte(siteMetricsHistory.recordedAt, fourHoursAgo),
        lt(siteMetricsHistory.recordedAt, twoHoursAgo)
      )
    );

  if (previousMetrics.length > 0) {
    const recentTraffic = recentMetrics.reduce((sum: number, m: any) => sum + ((m.metrics as any).pageViews || 0), 0);
    const previousTraffic = previousMetrics.reduce((sum: number, m: any) => sum + ((m.metrics as any).pageViews || 0), 0);

    if (previousTraffic > 0) {
      const spikePercent = ((recentTraffic - previousTraffic) / previousTraffic) * 100;
      const thresholdPercent = threshold.trafficSpikePercent || 200;

      if (spikePercent > thresholdPercent) {
        result.shouldAlert = true;
        result.message = `站点 ${site.name} 流量激增 ${spikePercent.toFixed(1)}%（当前：${recentTraffic}，之前：${previousTraffic}）`;
        result.severity = 'info'; // 流量激增通常是好事
        result.data = { recentTraffic, previousTraffic, spikePercent };
      }
    }
  }

  return result;
}

/**
 * 触发报警并发送通知
 */
async function triggerAlert(
  rule: any,
  site: any,
  message: string,
  severity: AlertSeverity,
  triggerData: Record<string, any>
) {
  try {
    // 创建报警历史记录
    const alertId = nanoid();
    const notificationStatus: Record<string, 'sent' | 'failed'> = {};

    // 发送通知到各个渠道
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'email':
            await sendEmailNotification(site, message, severity);
            notificationStatus.email = 'sent';
            break;
          case 'telegram':
            await sendTelegramNotification(site, message, severity);
            notificationStatus.telegram = 'sent';
            break;
          case 'webhook':
            await sendWebhookNotification(site, message, severity, triggerData);
            notificationStatus.webhook = 'sent';
            break;
        }
      } catch (error) {
        console.error(`[Alert Service] Failed to send ${channel} notification:`, error);
        notificationStatus[channel] = 'failed';
      }
    }

    // 保存报警历史
    await db().insert(alertHistory).values({
      id: alertId,
      ruleId: rule.id,
      siteId: site.id,
      alertType: rule.alertType,
      message,
      severity,
      triggerData,
      notificationStatus,
      resolved: false,
      createdAt: new Date(),
    });

    // 更新规则的最后触发时间
    await db()
      .update(alertRules)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(alertRules.id, rule.id));

    console.log(`[Alert Service] Alert triggered: ${message}`);
  } catch (error) {
    console.error('[Alert Service] Error triggering alert:', error);
    throw error;
  }
}

/**
 * 发送邮件通知
 */
async function sendEmailNotification(site: any, message: string, severity: AlertSeverity) {
  // TODO: 集成 Resend 或其他邮件服务
  console.log(`[Alert Service] Email notification: ${message}`);
  
  // 示例实现（需要配置 Resend）
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'alerts@soloboard.com',
  //   to: site.userEmail,
  //   subject: `[${severity.toUpperCase()}] ${site.name} 异常报警`,
  //   html: `<p>${message}</p>`,
  // });
}

/**
 * 发送 Telegram 通知
 */
async function sendTelegramNotification(site: any, message: string, severity: AlertSeverity) {
  // TODO: 集成 Telegram Bot API
  console.log(`[Alert Service] Telegram notification: ${message}`);
  
  // 示例实现
  // const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  // const telegramChatId = site.telegramChatId;
  // await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     chat_id: telegramChatId,
  //     text: `🚨 [${severity.toUpperCase()}] ${message}`,
  //   }),
  // });
}

/**
 * 发送 Webhook 通知
 */
async function sendWebhookNotification(
  site: any,
  message: string,
  severity: AlertSeverity,
  triggerData: Record<string, any>
) {
  // TODO: 发送到用户配置的 Webhook URL
  console.log(`[Alert Service] Webhook notification: ${message}`);
  
  // 示例实现
  // const webhookUrl = site.webhookUrl;
  // if (webhookUrl) {
  //   await fetch(webhookUrl, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       site: site.name,
  //       message,
  //       severity,
  //       timestamp: new Date().toISOString(),
  //       data: triggerData,
  //     }),
  //   });
  // }
}

/**
 * 创建报警规则
 */
export async function createAlertRule(
  userId: string,
  siteId: string,
  config: AlertRuleConfig
) {
  const ruleId = nanoid();

  await db().insert(alertRules).values({
    id: ruleId,
    userId,
    siteId,
    alertType: config.alertType,
    threshold: config.threshold,
    channels: config.channels,
    cooldown: config.cooldown || 300,
    enabled: config.enabled !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return ruleId;
}

/**
 * 获取用户的报警规则
 */
export async function getUserAlertRules(userId: string) {
  return await db()
    .select()
    .from(alertRules)
    .where(eq(alertRules.userId, userId))
    .orderBy(desc(alertRules.createdAt));
}

/**
 * 获取站点的报警历史
 */
export async function getSiteAlertHistory(siteId: string, limit = 50) {
  return await db()
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.siteId, siteId))
    .orderBy(desc(alertHistory.createdAt))
    .limit(limit);
}

/**
 * 标记报警为已解决
 */
export async function resolveAlert(alertId: string) {
  await db()
    .update(alertHistory)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertHistory.id, alertId));
}







