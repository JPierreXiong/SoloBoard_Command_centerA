/**
 * Data Aggregation Service
 * 聚合所有平台的数据
 */

import { checkUptime } from './uptime-service';
import { fetchStripeMetrics } from './stripe-fetcher';
import { fetchGA4Metrics } from './ga4-fetcher';
import { fetchShopifyMetrics } from './shopify-fetcher';
import { fetchLemonSqueezyMetrics } from './lemonsqueezy-fetcher';
import { fetchCreemMetrics } from './creem-fetcher';

interface SiteConfig {
  id: string;
  domain: string;
  platforms: {
    stripe?: { secretKey: string };
    shopify?: { apiKey: string; shopDomain: string; accessToken: string };
    ga4?: { propertyId: string; credentials: string };
    lemonSqueezy?: { apiKey: string; storeId: string };
    creem?: { apiKey: string; environment?: 'sandbox' | 'production' };
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
    checkUptime(config.domain),
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

  // Fetch from Creem (优先级最高，因为是主推平台)
  if (config.platforms.creem) {
    try {
      const creemData = await fetchCreemMetrics(config.platforms.creem);
      const creemRevenue = creemData.todayRevenue / 100; // Convert cents to dollars
      sources.creem = creemRevenue;
      total += creemRevenue;
    } catch (error) {
      console.error('Creem fetch error:', error);
      sources.creem = 0;
    }
  }

  // Fetch from Stripe
  if (config.platforms.stripe) {
    try {
      const stripeData = await fetchStripeMetrics(config.platforms.stripe);
      const stripeRevenue = stripeData.todayRevenue / 100; // Convert cents to dollars
      sources.stripe = stripeRevenue;
      total += stripeRevenue;
    } catch (error) {
      console.error('Stripe fetch error:', error);
      sources.stripe = 0;
    }
  }

  // Fetch from Shopify
  if (config.platforms.shopify) {
    try {
      const shopifyData = await fetchShopifyMetrics(config.platforms.shopify);
      const shopifyRevenue = shopifyData.todayRevenue / 100; // Convert cents to dollars
      sources.shopify = shopifyRevenue;
      total += shopifyRevenue;
    } catch (error) {
      console.error('Shopify fetch error:', error);
      sources.shopify = 0;
    }
  }

  // Fetch from Lemon Squeezy
  if (config.platforms.lemonSqueezy) {
    try {
      const lemonData = await fetchLemonSqueezyMetrics(config.platforms.lemonSqueezy);
      const lemonRevenue = lemonData.todayRevenue / 100; // Convert cents to dollars
      sources.lemonSqueezy = lemonRevenue;
      total += lemonRevenue;
    } catch (error) {
      console.error('Lemon Squeezy fetch error:', error);
      sources.lemonSqueezy = 0;
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

  // Fetch from GA4
  if (config.platforms.ga4) {
    try {
      const ga4Data = await fetchGA4Metrics(config.platforms.ga4);
      const ga4Visitors = ga4Data.pageViews; // Use page views as visitor metric
      sources.ga4 = ga4Visitors;
      total += ga4Visitors;
    } catch (error) {
      console.error('GA4 fetch error:', error);
      sources.ga4 = 0;
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