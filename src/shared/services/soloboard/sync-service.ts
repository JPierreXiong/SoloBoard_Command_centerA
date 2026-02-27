/**
 * SoloBoard - 站点数据同步服务
 * 
 * 统一的数据抓取调度器，根据站点平台类型分发任务
 * 
 * 核心逻辑：
 * 1. 从数据库读取站点配置
 * 2. 解密 API 配置
 * 3. 调用对应平台的 Fetcher
 * 4. 更新 lastSnapshot 到数据库
 * 5. 记录同步日志
 */

import { db } from '@/core/db';
import { monitoredSites, siteMetricsHistory, syncLogs } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { decryptSiteConfigObject } from '@/shared/lib/site-crypto';
import { fetchGA4Metrics } from './platform-fetchers/ga4-fetcher';
import { fetchStripeMetrics } from './platform-fetchers/stripe-fetcher';
import { fetchUptimeMetrics } from './uptime-fetcher';
import { fetchLemonSqueezyMetrics } from './lemonsqueezy-fetcher';
import { fetchShopifyMetrics } from './shopify-fetcher';
import { fetchCustomApiMetrics } from './custom-api-service';

/**
 * 同步单个站点的数据
 * 
 * @param siteId - 站点 ID
 * @returns 同步结果
 */
export async function syncSiteData(siteId: string) {
  const startTime = Date.now();
  
  try {
    // 1. 查询站点配置
    const site = await db().query.monitoredSites.findFirst({
      where: eq(monitoredSites.id, siteId),
    });
    
    if (!site) {
      throw new Error(`Site not found: ${siteId}`);
    }
    
    if (site.status !== 'active') {
      throw new Error(`Site is not active: ${site.status}`);
    }
    
    // 2. 解密 API 配置
    const config = decryptSiteConfigObject(site.encryptedConfig);
    
    // 3. 根据平台类型抓取数据
    let metrics: any;
    
    switch (site.platform) {
      case 'GA4':
        if (!config.ga4) {
          throw new Error('GA4 configuration not found');
        }
        // 解析 Service Account credentials
        const ga4Credentials = JSON.parse(config.ga4.credentials);
        metrics = await fetchGA4Metrics({
          clientEmail: ga4Credentials.client_email,
          privateKey: ga4Credentials.private_key,
          propertyId: config.ga4.propertyId,
        });
        break;
        
      case 'STRIPE':
        if (!config.stripe) {
          throw new Error('Stripe configuration not found');
        }
        metrics = await fetchStripeMetrics(config.stripe);
        break;
        
      case 'UPTIME':
        if (!config.uptime) {
          throw new Error('Uptime configuration not found');
        }
        metrics = await fetchUptimeMetrics(config.uptime);
        break;
        
      case 'LEMON_SQUEEZY':
        if (!config.lemonSqueezy) {
          throw new Error('Lemon Squeezy configuration not found');
        }
        metrics = await fetchLemonSqueezyMetrics(config.lemonSqueezy);
        break;
        
      case 'SHOPIFY':
        if (!config.shopify) {
          throw new Error('Shopify configuration not found');
        }
        metrics = await fetchShopifyMetrics(config.shopify);
        break;
        
      case 'CUSTOM_API':
        if (!config.customApi) {
          throw new Error('Custom API configuration not found');
        }
        metrics = await fetchCustomApiMetrics(config.customApi);
        break;
        
      default:
        throw new Error(`Unknown platform: ${site.platform}`);
    }
    
    // 4. 更新站点快照
    await db()
      .update(monitoredSites)
      .set({
        lastSnapshot: {
          metrics,
          updatedAt: new Date().toISOString(),
        },
        lastSyncAt: new Date(),
        healthStatus: metrics.isOnline !== undefined 
          ? (metrics.isOnline ? 'online' : 'offline')
          : 'unknown',
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));
    
    // 5. 保存历史数据
    await db().insert(siteMetricsHistory).values({
      id: nanoid(),
      siteId,
      metrics,
      recordedAt: new Date(),
    });
    
    // 6. 记录同步日志
    const duration = Date.now() - startTime;
    await db().insert(syncLogs).values({
      id: nanoid(),
      siteId,
      status: 'success',
      duration,
      syncedMetrics: metrics,
    });
    
    return {
      success: true,
      siteId,
      platform: site.platform,
      metrics,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 记录错误日志
    await db().insert(syncLogs).values({
      id: nanoid(),
      siteId,
      status: 'failed',
      duration,
      errorMessage,
    });
    
    // 更新站点错误状态
    await db()
      .update(monitoredSites)
      .set({
        status: 'error',
        lastErrorAt: new Date(),
        lastErrorMessage: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(monitoredSites.id, siteId));
    
    return {
      success: false,
      siteId,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * 同步用户的所有站点数据
 * 
 * @param userId - 用户 ID
 * @returns 同步结果数组
 */
export async function syncUserSites(userId: string) {
  // 查询用户的所有活跃站点
  const sites = await db().query.monitoredSites.findMany({
    where: eq(monitoredSites.userId, userId),
  });
  
  // 并行同步所有站点
  const results = await Promise.allSettled(
    sites.map((site: any) => syncSiteData(site.id))
  );
  
  return results.map((result, index) => ({
    siteId: sites[index].id,
    siteName: sites[index].name,
    result: result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' },
  }));
}

/**
 * 同步所有站点数据（Cron Job 使用）
 * 
 * @returns 同步结果统计
 */
export async function syncAllSites() {
  const startTime = Date.now();
  
  // 查询所有活跃站点
  const sites = await db().query.monitoredSites.findMany({
    where: eq(monitoredSites.status, 'active'),
  });
  
  console.log(`🔄 Starting sync for ${sites.length} sites...`);
  
  // 并行同步所有站点（限制并发数）
  const batchSize = 10; // 每批处理 10 个站点
  const results = [];
  
  for (let i = 0; i < sites.length; i += batchSize) {
    const batch = sites.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((site: any) => syncSiteData(site.id))
    );
    results.push(...batchResults);
  }
  
  // 统计结果
  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failedCount = results.length - successCount;
  const duration = Date.now() - startTime;
  
  console.log(`✅ Sync completed: ${successCount} success, ${failedCount} failed, ${duration}ms`);
  
  return {
    total: sites.length,
    success: successCount,
    failed: failedCount,
    duration,
  };
}

