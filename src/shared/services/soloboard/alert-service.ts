/**
 * Alert Service - 提醒规则引擎
 * 
 * 用途：检查网站状态并触发提醒
 * 优化：加入重试机制，避免误报
 * 不改变 ShipAny 结构，仅扩展功能
 */

import { db } from '@/core/db';
import { monitoredSites, siteMetricsHistory } from '@/config/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sendAlertEmail } from './email-alert-service';

export enum AlertType {
  OFFLINE = 'offline',
  REVENUE_DROP = 'revenue_drop',
  TRAFFIC_SPIKE = 'traffic_spike',
  NO_SALES = 'no_sales',
}

export enum AlertFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface AlertRule {
  id: string;
  userId: string;
  siteId: string;
  type: AlertType;
  threshold: number;
  frequency: AlertFrequency;
  channels: string[]; // ['email', 'telegram']
  enabled: boolean;
  lastTriggeredAt?: Date;
}

interface AlertContext {
  siteName: string;
  domain: string;
  currentValue: number;
  previousValue: number;
  threshold: number;
  changePercentage: number;
}

// 🎯 优化：离线检测重试机制
const OFFLINE_RETRY_COUNT = 2;
const OFFLINE_RETRY_DELAY = 30000; // 30秒

/**
 * 检查单个站点的所有提醒规则
 */
export async function checkSiteAlerts(siteId: string): Promise<void> {
  try {
    const database = db();
    
    // 获取站点信息
    const [site] = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      console.error(`Site not found: ${siteId}`);
      return;
    }
    
    // 获取该站点的所有启用的提醒规则
    const rules = await getActiveAlertRules(siteId);
    
    if (rules.length === 0) {
      return;
    }
    
    // 检查每个规则
    for (const rule of rules) {
      const shouldAlert = await evaluateAlertRule(rule, site);
      
      if (shouldAlert && canTriggerAlert(rule)) {
        await triggerAlert(rule, site);
      }
    }
  } catch (error) {
    console.error(`Failed to check alerts for site ${siteId}:`, error);
  }
}

/**
 * 评估提醒规则是否应该触发
 */
async function evaluateAlertRule(
  rule: AlertRule,
  site: any
): Promise<boolean> {
  switch (rule.type) {
    case AlertType.OFFLINE:
      return await checkOfflineAlert(site);
    
    case AlertType.REVENUE_DROP:
      return await checkRevenueDropAlert(site, rule.threshold);
    
    case AlertType.TRAFFIC_SPIKE:
      return await checkTrafficSpikeAlert(site, rule.threshold);
    
    case AlertType.NO_SALES:
      return await checkNoSalesAlert(site);
    
    default:
      return false;
  }
}

/**
 * 🎯 优化：离线检测 - 连续两次失败才报警
 */
async function checkOfflineAlert(site: any): Promise<boolean> {
  // 如果当前状态不是离线，直接返回
  if (site.lastSyncStatus === 'success') {
    return false;
  }
  
  // 重试机制：连续检测两次
  let failureCount = 0;
  
  for (let i = 0; i < OFFLINE_RETRY_COUNT; i++) {
    try {
      const url = site.url || `https://${site.domain}`;
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
      
      if (response.ok) {
        // 网站正常，重置失败计数
        return false;
      } else {
        failureCount++;
      }
    } catch (error) {
      failureCount++;
    }
    
    // 如果不是最后一次重试，等待一段时间
    if (i < OFFLINE_RETRY_COUNT - 1) {
      await new Promise(resolve => setTimeout(resolve, OFFLINE_RETRY_DELAY));
    }
  }
  
  // 连续失败才返回 true
  return failureCount >= OFFLINE_RETRY_COUNT;
}

/**
 * 检查收入下降提醒
 */
async function checkRevenueDropAlert(
  site: any,
  threshold: number
): Promise<boolean> {
  try {
    const database = db();
    
    // 获取最近7天的平均收入
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const history = await database
      .select()
      .from(siteMetricsHistory)
      .where(
        and(
          eq(siteMetricsHistory.siteId, site.id),
          gte(siteMetricsHistory.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(siteMetricsHistory.createdAt))
      .limit(7);
    
    if (history.length === 0) {
      return false;
    }
    
    // 计算平均收入
    const avgRevenue = history.reduce((sum, record) => {
      return sum + (record.revenue || 0);
    }, 0) / history.length;
    
    // 获取今日收入（从 lastSnapshot 或最新记录）
    const todayRevenue = history[0]?.revenue || 0;
    
    // 检查是否下降超过阈值
    const dropPercentage = ((avgRevenue - todayRevenue) / avgRevenue) * 100;
    
    return dropPercentage >= threshold;
  } catch (error) {
    console.error('Failed to check revenue drop:', error);
    return false;
  }
}

/**
 * 检查流量激增提醒
 */
async function checkTrafficSpikeAlert(
  site: any,
  threshold: number
): Promise<boolean> {
  try {
    const database = db();
    
    // 获取最近7天的平均访客数
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const history = await database
      .select()
      .from(siteMetricsHistory)
      .where(
        and(
          eq(siteMetricsHistory.siteId, site.id),
          gte(siteMetricsHistory.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(siteMetricsHistory.createdAt))
      .limit(7);
    
    if (history.length === 0) {
      return false;
    }
    
    // 计算平均访客数
    const avgVisitors = history.reduce((sum, record) => {
      return sum + (record.visitors || 0);
    }, 0) / history.length;
    
    // 获取今日访客数
    const todayVisitors = history[0]?.visitors || 0;
    
    // 检查是否增长超过阈值
    const increasePercentage = ((todayVisitors - avgVisitors) / avgVisitors) * 100;
    
    return increasePercentage >= threshold;
  } catch (error) {
    console.error('Failed to check traffic spike:', error);
    return false;
  }
}

/**
 * 检查无销售提醒
 */
async function checkNoSalesAlert(site: any): Promise<boolean> {
  try {
    const database = db();
    
    // 获取最近7天的收入记录
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const history = await database
      .select()
      .from(siteMetricsHistory)
      .where(
        and(
          eq(siteMetricsHistory.siteId, site.id),
          gte(siteMetricsHistory.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(siteMetricsHistory.createdAt))
      .limit(7);
    
    if (history.length === 0) {
      return false;
    }
    
    // 检查是否有历史销售
    const hasHistoricalSales = history.some(record => (record.revenue || 0) > 0);
    
    if (!hasHistoricalSales) {
      return false;
    }
    
    // 检查今日是否无销售
    const todayRevenue = history[0]?.revenue || 0;
    
    return todayRevenue === 0;
  } catch (error) {
    console.error('Failed to check no sales:', error);
    return false;
  }
}

/**
 * 检查是否可以触发提醒（根据频率限制）
 */
function canTriggerAlert(rule: AlertRule): boolean {
  if (!rule.lastTriggeredAt) {
    return true;
  }
  
  const now = new Date();
  const lastTriggered = new Date(rule.lastTriggeredAt);
  const timeDiff = now.getTime() - lastTriggered.getTime();
  
  switch (rule.frequency) {
    case AlertFrequency.IMMEDIATE:
      // 立即提醒，但至少间隔5分钟
      return timeDiff > 5 * 60 * 1000;
    
    case AlertFrequency.DAILY:
      // 每日提醒，至少间隔24小时
      return timeDiff > 24 * 60 * 60 * 1000;
    
    case AlertFrequency.WEEKLY:
      // 每周提醒，至少间隔7天
      return timeDiff > 7 * 24 * 60 * 60 * 1000;
    
    default:
      return false;
  }
}

/**
 * 触发提醒
 */
async function triggerAlert(rule: AlertRule, site: any): Promise<void> {
  try {
    // 发送邮件提醒
    if (rule.channels.includes('email')) {
      await sendAlertEmail(rule, site);
    }
    
    // TODO: 发送 Telegram 提醒
    if (rule.channels.includes('telegram')) {
      // await sendTelegramAlert(rule, site);
    }
    
    // 更新最后触发时间
    await updateLastTriggered(rule.id);
    
    console.log(`Alert triggered: ${rule.type} for site ${site.name}`);
  } catch (error) {
    console.error('Failed to trigger alert:', error);
  }
}

/**
 * 更新最后触发时间
 */
async function updateLastTriggered(ruleId: string): Promise<void> {
  // TODO: 实现更新逻辑
  // await db().update(alertRules)
  //   .set({ lastTriggeredAt: new Date() })
  //   .where(eq(alertRules.id, ruleId));
}

/**
 * 获取站点的活跃提醒规则
 */
async function getActiveAlertRules(siteId: string): Promise<AlertRule[]> {
  // TODO: 从数据库获取规则
  // 目前返回空数组，等待 alert_rules 表创建后实现
  return [];
}

/**
 * 批量检查所有站点的提醒
 */
export async function checkAllSiteAlerts(): Promise<void> {
  try {
    const database = db();
    
    // 获取所有活跃站点
    const sites = await database
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.status, 'active'));
    
    // 并行检查所有站点
    await Promise.all(
      sites.map(site => checkSiteAlerts(site.id))
    );
    
    console.log(`Checked alerts for ${sites.length} sites`);
  } catch (error) {
    console.error('Failed to check all site alerts:', error);
  }
}
