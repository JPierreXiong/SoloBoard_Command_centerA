/**
 * SoloBoard - Lemon Squeezy 数据抓取服务
 * 
 * 用于从 Lemon Squeezy 获取销售数据、订单数、订阅等指标
 * 
 * API 文档: https://docs.lemonsqueezy.com/api
 */

import type { SiteApiConfig } from '@/shared/lib/site-crypto';

/**
 * Lemon Squeezy 指标数据类型
 */
export interface LemonSqueezyMetrics {
  todayRevenue: number; // 今日销售额（单位：分）
  todayOrders: number; // 今日订单数
  todaySubscriptions: number; // 今日新订阅
  activeSubscriptions: number; // 活跃订阅数
  mrr: number; // 月度经常性收入（单位：分）
  currency: string; // 货币代码
  updatedAt: string; // 更新时间（ISO 8601）
}

/**
 * 从 Lemon Squeezy 获取今日指标
 * 
 * @param config - Lemon Squeezy API 配置
 * @returns Lemon Squeezy 指标数据
 */
export async function fetchLemonSqueezyMetrics(
  config: NonNullable<SiteApiConfig['lemonSqueezy']>
): Promise<LemonSqueezyMetrics> {
  try {
    const headers = {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    // 获取今日开始时间戳
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // 1. 获取今日订单
    const ordersResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${config.storeId}&filter[created_at]=${todayStartISO}`,
      { headers }
    );

    if (!ordersResponse.ok) {
      throw new Error(`Lemon Squeezy API error: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.data || [];

    // 计算今日订单指标
    let todayRevenue = 0;
    let todayOrders = orders.length;
    let currency = 'USD';

    for (const order of orders) {
      const amount = order.attributes.total;
      todayRevenue += amount;
      currency = order.attributes.currency || 'USD';
    }

    // 2. 获取今日新订阅
    const subscriptionsResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${config.storeId}&filter[created_at]=${todayStartISO}`,
      { headers }
    );

    const subscriptionsData = await subscriptionsResponse.json();
    const todaySubscriptions = subscriptionsData.data?.length || 0;

    // 3. 获取所有活跃订阅
    const activeSubsResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${config.storeId}&filter[status]=active`,
      { headers }
    );

    const activeSubsData = await activeSubsResponse.json();
    const activeSubs = activeSubsData.data || [];
    const activeSubscriptions = activeSubs.length;

    // 计算 MRR（月度经常性收入）
    let mrr = 0;
    for (const sub of activeSubs) {
      const price = sub.attributes.product_price || 0;
      const interval = sub.attributes.billing_interval || 'month';
      
      // 转换为月度收入
      if (interval === 'year') {
        mrr += price / 12;
      } else if (interval === 'month') {
        mrr += price;
      }
    }

    return {
      todayRevenue,
      todayOrders,
      todaySubscriptions,
      activeSubscriptions,
      mrr,
      currency,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Lemon Squeezy fetch error:', error);
    throw new Error(
      `Failed to fetch Lemon Squeezy metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 验证 Lemon Squeezy 配置是否有效
 * 
 * @param config - Lemon Squeezy API 配置
 * @returns true 如果配置有效
 */
export async function validateLemonSqueezyConfig(
  config: NonNullable<SiteApiConfig['lemonSqueezy']>
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/stores/${config.storeId}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 格式化 Lemon Squeezy 指标为显示文本
 * 
 * @param metrics - Lemon Squeezy 指标数据
 * @returns 格式化后的文本对象
 */
export function formatLemonSqueezyMetrics(metrics: LemonSqueezyMetrics) {
  const amount = (metrics.todayRevenue / 100).toFixed(2);
  const mrrAmount = (metrics.mrr / 100).toFixed(2);
  
  return {
    todayRevenue: `$${amount}`,
    todayOrders: metrics.todayOrders.toLocaleString(),
    todaySubscriptions: metrics.todaySubscriptions.toLocaleString(),
    activeSubscriptions: metrics.activeSubscriptions.toLocaleString(),
    mrr: `$${mrrAmount}/mo`,
  };
}
























