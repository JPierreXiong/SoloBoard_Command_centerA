/**
 * SoloBoard - Cron Job: 数据同步 + 邮件告警
 * 
 * 定时任务：每 15 分钟同步一次所有站点数据
 * 功能：
 * 1. 同步站点数据
 * 2. 检测异常（宕机、无销售、流量骤降）
 * 3. 发送邮件告警
 * 
 * Vercel Cron 配置在 vercel.json 中
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllSites } from '@/shared/services/soloboard/sync-service';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily, user } from '@/config/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { detectAnomaly, calculateHistoricalAverage } from '@/shared/services/soloboard/anomaly-detection';
import { sendAlert } from '@/shared/services/soloboard/email-alert-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分钟超时

/**
 * Cron Job 处理函数
 * 
 * 安全验证（三重保护）：
 * 1. URL 参数中的 secret（Upstash QStash 使用）
 * 2. Authorization header 中的 Bearer Token
 * 3. Vercel Cron 的特殊 header
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    
    // 方式 1: URL 参数验证（Upstash QStash）
    const { searchParams } = new URL(request.url);
    const urlSecret = searchParams.get('secret');
    
    // 方式 2: Authorization Header 验证
    const authHeader = request.headers.get('authorization');
    
    // 方式 3: Vercel Cron Header 验证
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    
    // 任意一种验证通过即可
    const isAuthorized = 
      urlSecret === cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      isVercelCron;
    
    if (!isAuthorized) {
      console.warn('⚠️ [Cron] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🚀 [Cron] Starting site data sync and alert check...');
    
    // 1. 执行同步
    const syncResult = await syncAllSites();
    console.log('✅ [Cron] Sync completed:', syncResult);
    
    // 2. 检查所有站点的异常并发送告警
    const alertsResult = await checkAndSendAlerts();
    console.log('✅ [Cron] Alerts check completed:', alertsResult);
    
    return NextResponse.json({
      success: true,
      message: 'Site data sync and alerts completed',
      sync: syncResult,
      alerts: alertsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cron] Sync failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
/**
 * 检查所有站点的异常并发送告警
 */
async function checkAndSendAlerts() {
  try {
    // 获取所有活跃站点
    const sites = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.status, 'active'));
    
    const alertsSent = {
      downtime: 0,
      noSales: 0,
      trafficDrop: 0,
      total: 0,
    };
    
    // 获取7天前的日期
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 检查每个站点
    for (const site of sites) {
      try {
        // 获取用户信息
        const [siteUser] = await db()
          .select()
          .from(user)
          .where(eq(user.id, site.userId))
          .limit(1);
        
        if (!siteUser || !siteUser.email) {
          console.log(`⚠️ [Alert] No user email for site ${site.name}`);
          continue;
        }
        
        // 获取历史数据
        const historyData = await db()
          .select()
          .from(siteMetricsDaily)
          .where(
            and(
              eq(siteMetricsDaily.siteId, site.id),
              gte(siteMetricsDaily.date, sevenDaysAgo)
            )
          )
          .orderBy(desc(siteMetricsDaily.date));
        
        // 计算历史平均值
        const historical = calculateHistoricalAverage(
          historyData.map(d => ({
            revenue: d.revenue || 0,
            visitors: d.visitors || 0,
          }))
        );
        
        // 获取今日数据（从 lastSnapshot 或最新的 metrics）
        const todayData = site.lastSnapshot as any || {};
        const todayRevenue = todayData.revenue?.today || 0;
        const todayVisitors = todayData.visitors?.today || 0;
        const uptimeStatus = site.lastSyncStatus === 'success' ? 'up' : 'down';
        
        // 检测异常
        const anomaly = detectAnomaly(
          {
            revenue: todayRevenue,
            visitors: todayVisitors,
            uptimeStatus: uptimeStatus as 'up' | 'down',
          },
          historical
        );
        
        // 发送告警
        if (anomaly.alert) {
          const alertConfig = {
            userId: site.userId,
            userEmail: siteUser.email,
            userName: siteUser.name || undefined,
            siteName: site.name,
            siteUrl: site.url || `https://${site.domain}`,
            alertType: anomaly.alert.type,
            details: {
              lastChecked: site.lastSyncAt?.toISOString(),
              errorMessage: site.lastSyncError || undefined,
              avgRevenue7d: historical.avgRevenue7d,
              todayVisitors: todayVisitors,
              avgVisitors7d: historical.avgVisitors7d,
              dropPercentage: anomaly.alert.type === 'low_traffic' 
                ? Math.round(((historical.avgVisitors7d - todayVisitors) / historical.avgVisitors7d) * 100)
                : undefined,
            },
          };
          
          const result = await sendAlert(alertConfig);
          
          if (result.success) {
            alertsSent.total++;
            if (anomaly.alert.type === 'site_down') alertsSent.downtime++;
            if (anomaly.alert.type === 'no_sales') alertsSent.noSales++;
            if (anomaly.alert.type === 'low_traffic') alertsSent.trafficDrop++;
            
            console.log(`✅ [Alert] Sent ${anomaly.alert.type} alert for ${site.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ [Alert] Failed to check site ${site.name}:`, error);
      }
    }
    
    return {
      sitesChecked: sites.length,
      alertsSent,
    };
  } catch (error) {
    console.error('❌ [Alert] Failed to check alerts:', error);
    return {
      sitesChecked: 0,
      alertsSent: { downtime: 0, noSales: 0, trafficDrop: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

