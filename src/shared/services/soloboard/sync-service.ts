/**
 * 数据同步服务
 * 
 * 功能:
 * - 同步单个站点的所有数据源
 * - 聚合多个平台的数据
 * - 保存到数据库
 * - 错误处理和重试
 */

import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { fetchShopifyMetrics, ShopifyConfig } from './fetchers/shopify-fetcher';
import { fetchUptimeMetrics, UptimeConfig } from './fetchers/uptime-fetcher';
import { fetchTrackingMetrics, TrackingConfig } from './fetchers/tracking-fetcher';

export interface SyncResult {
  siteId: string;
  success: boolean;
  metrics?: {
    revenue: number;
    visitors: number;
    uptime: 'up' | 'down';
    responseTime: number;
  };
  error?: string;
  syncedAt: Date;
}

/**
 * 同步单个站点的数据
 */
export async function syncSiteData(siteId: string): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // 1. 获取站点配置
    const siteResult = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);

    if (!siteResult[0]) {
      throw new Error('Site not found');
    }

    const site = siteResult[0];
    const apiConfig = (site.apiConfig as any) || {};
    const platforms = apiConfig.platforms || {};

    // 2. 并行获取所有平台数据
    const results = await Promise.allSettled([
      // Uptime 监控（必须）
      fetchUptimeMetrics({
        url: site.url || `https://${site.domain}`,
      }),
      
      // Shopify（如果启用）
      platforms.shopify?.enabled
        ? fetchShopifyMetrics(platforms.shopify as ShopifyConfig)
        : Promise.resolve(null),
      
      // Tracking（如果启用）
      platforms.tracking?.enabled
        ? fetchTrackingMetrics(platforms.tracking as TrackingConfig)
        : Promise.resolve(null),
    ]);

    // 3. 处理结果
    const uptimeResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const shopifyResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const trackingResult = results[2].status === 'fulfilled' ? results[2].value : null;

    // 4. 聚合数据
    let totalRevenue = 0;
    let totalVisitors = 0;
    const uptimeStatus = uptimeResult?.status || 'down';
    const responseTime = uptimeResult?.responseTime || 0;

    if (shopifyResult) {
      totalRevenue += shopifyResult.revenue;
      totalVisitors += shopifyResult.visitors;
    }

    if (trackingResult) {
      totalVisitors += trackingResult.visitors;
    }

    // 5. 保存到数据库
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db().insert(siteMetricsDaily).values({
      siteId: siteId,
      date: today,
      revenue: totalRevenue,
      visitors: totalVisitors,
      uptime: uptimeStatus === 'up' ? 100 : 0,
      responseTime: responseTime,
      rawData: {
        uptime: uptimeResult,
        shopify: shopifyResult,
        tracking: trackingResult,
      },
      createdAt: new Date(),
    });

    // 6. 更新站点同步状态
    await db()
      .update(monitoredSites)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));

    const duration = Date.now() - startTime;
    console.log(`✅ Synced site ${siteId} in ${duration}ms`);

    return {
      siteId,
      success: true,
      metrics: {
        revenue: totalRevenue,
        visitors: totalVisitors,
        uptime: uptimeStatus,
        responseTime,
      },
      syncedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`❌ Failed to sync site ${siteId}:`, error);

    // 更新站点错误状态
    try {
      await db()
        .update(monitoredSites)
        .set({
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error.message,
          updatedAt: new Date(),
        })
        .where(eq(monitoredSites.id, siteId));
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
    }

    return {
      siteId,
      success: false,
      error: error.message,
      syncedAt: new Date(),
    };
  }
}

/**
 * 批量同步多个站点
 */
export async function syncMultipleSites(siteIds: string[]): Promise<SyncResult[]> {
  console.log(`🔄 Starting batch sync for ${siteIds.length} sites...`);

  const results = await Promise.all(
    siteIds.map((siteId) => syncSiteData(siteId))
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`✅ Batch sync complete: ${successCount} success, ${failCount} failed`);

  return results;
}

/**
 * 同步所有站点
 */
export async function syncAllSites(): Promise<SyncResult[]> {
  try {
    // 获取所有活跃站点
    const sites = await db()
      .select({ id: monitoredSites.id })
      .from(monitoredSites)
      .where(eq(monitoredSites.status, 'active'));

    const siteIds = sites.map((s) => s.id);

    if (siteIds.length === 0) {
      console.log('No active sites to sync');
      return [];
    }

    return await syncMultipleSites(siteIds);
  } catch (error) {
    console.error('Failed to sync all sites:', error);
    throw error;
  }
}
