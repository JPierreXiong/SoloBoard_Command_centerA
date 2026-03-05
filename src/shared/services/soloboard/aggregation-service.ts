/**
 * Data Aggregation Service
 * 聚合所有平台的数据
 */

import { fetchUptimeMetrics } from './fetchers/uptime-fetcher';
import { fetchShopifyMetrics } from './fetchers/shopify-fetcher';
import { fetchTrackingMetrics } from './fetchers/tracking-fetcher';

interface SiteConfig {
  id: string;
  domain: string;
  platforms: {
    shopify?: { shop: string; accessToken: string; apiVersion?: string };
    tracking?: { apiUrl: string; apiKey?: string; siteId?: string };
  };
}

interface AggregatedMetrics {
  revenue: {
    today: number;
    sources: Record<string, number>;
  };
  visitors: {
    today: number;
    sources: Record<string, number>;
  };
  uptime: {
    status: 'up' | 'down';
    responseTime: number;
  };
}

export async function aggregateSiteData(
  config: SiteConfig
): Promise<AggregatedMetrics> {
  // Run all checks concurrently
  const [uptimeResult, revenueData, visitorData] = await Promise.all([
    fetchUptimeMetrics({ url: config.domain }),
    fetchRevenueData(config),
    fetchVisitorData(config),
  ]);

  return {
    revenue: revenueData,
    visitors: visitorData,
    uptime: {
      status: uptimeResult.status,
      responseTime: uptimeResult.responseTime,
    },
  };
}

async function fetchRevenueData(config: SiteConfig) {
  const sources: Record<string, number> = {};
  let total = 0;

  // Fetch from Shopify
  if (config.platforms.shopify) {
    try {
      const shopifyData = await fetchShopifyMetrics(config.platforms.shopify);
      sources.shopify = shopifyData.revenue;
      total += shopifyData.revenue;
    } catch (error) {
      console.error('Shopify fetch error:', error);
      sources.shopify = 0;
    }
  }

  return {
    today: total,
    sources,
  };
}

async function fetchVisitorData(config: SiteConfig) {
  const sources: Record<string, number> = {};
  let total = 0;

  // Fetch from Tracking
  if (config.platforms.tracking) {
    try {
      const trackingData = await fetchTrackingMetrics(config.platforms.tracking);
      sources.tracking = trackingData.visitors;
      total += trackingData.visitors;
    } catch (error) {
      console.error('Tracking fetch error:', error);
      sources.tracking = 0;
    }
  }

  // Fetch from Shopify (use orders as visitors)
  if (config.platforms.shopify) {
    try {
      const shopifyData = await fetchShopifyMetrics(config.platforms.shopify);
      sources.shopify = shopifyData.visitors;
      total += shopifyData.visitors;
    } catch (error) {
      console.error('Shopify fetch error:', error);
      sources.shopify = 0;
    }
  }

  return {
    today: total,
    sources,
  };
}

/**
 * Aggregate data for multiple sites
 */
export async function aggregateMultipleSites(
  configs: SiteConfig[]
): Promise<Map<string, AggregatedMetrics>> {
  const results = await Promise.all(
    configs.map(async (config) => {
      const metrics = await aggregateSiteData(config);
      return [config.id, metrics] as [string, AggregatedMetrics];
    })
  );

  return new Map(results);
}